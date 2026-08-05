import io


def _create_trip(client, auth_headers, name="Route Test Camp"):
    payload = {
        "location_name": name,
        "start_date": "2025-06-01",
        "end_date": "2025-06-02",
        "price_input_mode": "none",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


def _csv_file(content: str, filename: str = "route.csv"):
    return {"file": (filename, io.BytesIO(content.encode("utf-8")), "text/csv")}


def _upload(client, auth_headers, trip_id, content: str, filename: str = "route.csv"):
    return client.post(
        f"/api/trips/{trip_id}/route",
        files=_csv_file(content, filename),
        headers=auth_headers,
    )


TWO_SEGMENT_CSV = """date,latitude,longitude
2025-06-01T10:00:00,59.30,18.00
2025-06-01T10:01:00,59.31,18.01
2025-06-01T10:02:00,59.32,18.02
2025-06-01T10:35:00,59.40,18.10
2025-06-01T10:36:00,59.41,18.11
"""

ONE_SEGMENT_CSV = """date,latitude,longitude
2025-06-01T10:00:00,59.30,18.00
2025-06-01T10:05:00,59.31,18.01
2025-06-01T10:10:00,59.32,18.02
"""


def test_upload_route_requires_auth(client):
    response = client.post(
        "/api/trips/00000000-0000-0000-0000-000000000000/route",
        files=_csv_file(ONE_SEGMENT_CSV),
    )
    assert response.status_code == 401


def test_upload_route_trip_not_found(client, auth_headers):
    response = _upload(client, auth_headers, "00000000-0000-0000-0000-000000000000", ONE_SEGMENT_CSV)
    assert response.status_code == 404


def test_upload_route_success_splits_on_time_gap(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    response = _upload(client, auth_headers, trip["id"], TWO_SEGMENT_CSV)
    assert response.status_code == 200, response.text
    route_points = response.json()["route_points"]
    assert len(route_points) == 2
    assert len(route_points[0]) == 3
    assert len(route_points[1]) == 2
    assert route_points[0][0] == [59.30, 18.00]


def test_upload_route_single_segment_when_no_gap(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    response = _upload(client, auth_headers, trip["id"], ONE_SEGMENT_CSV)
    assert response.status_code == 200, response.text
    route_points = response.json()["route_points"]
    assert len(route_points) == 1
    assert len(route_points[0]) == 3


def test_upload_route_accepts_column_aliases(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    csv_content = "time,lat,lon\n2025-06-01T10:00:00,59.30,18.00\n2025-06-01T10:01:00,59.31,18.01\n"
    response = _upload(client, auth_headers, trip["id"], csv_content)
    assert response.status_code == 200, response.text
    assert response.json()["route_points"] == [[[59.30, 18.00], [59.31, 18.01]]]


def test_upload_route_skips_invalid_rows_but_keeps_valid_ones(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    csv_content = (
        "date,latitude,longitude\n"
        "2025-06-01T10:00:00,59.30,18.00\n"
        "2025-06-01T10:01:00,999,18.01\n"
        "not-a-date,59.32,18.02\n"
        "2025-06-01T10:02:00,59.33,18.03\n"
    )
    response = _upload(client, auth_headers, trip["id"], csv_content)
    assert response.status_code == 200, response.text
    route_points = response.json()["route_points"]
    assert route_points == [[[59.30, 18.00], [59.33, 18.03]]]


def test_upload_route_rejects_csv_with_no_valid_rows(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    csv_content = "date,latitude,longitude\nnot-a-date,999,999\n"
    response = _upload(client, auth_headers, trip["id"], csv_content)
    assert response.status_code == 422


def test_upload_route_rejects_missing_columns(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    csv_content = "foo,bar\n1,2\n"
    response = _upload(client, auth_headers, trip["id"], csv_content)
    assert response.status_code == 422


def test_upload_route_replaces_existing_route(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    _upload(client, auth_headers, trip["id"], TWO_SEGMENT_CSV)
    response = _upload(client, auth_headers, trip["id"], ONE_SEGMENT_CSV)
    assert response.status_code == 200
    assert len(response.json()["route_points"]) == 1


def test_get_trip_includes_route_points(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    _upload(client, auth_headers, trip["id"], ONE_SEGMENT_CSV)

    response = client.get(f"/api/trips/{trip['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["route_points"] is not None


def test_delete_route(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    _upload(client, auth_headers, trip["id"], ONE_SEGMENT_CSV)

    response = client.delete(f"/api/trips/{trip['id']}/route", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["route_points"] is None


def test_delete_route_when_none_exists(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    response = client.delete(f"/api/trips/{trip['id']}/route", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["route_points"] is None


def test_deleting_trip_with_route_attached(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    _upload(client, auth_headers, trip["id"], ONE_SEGMENT_CSV)

    response = client.delete(f"/api/trips/{trip['id']}", headers=auth_headers)
    assert response.status_code == 204
