import pytest


def test_list_trips_requires_auth(client):
    response = client.get("/api/trips")
    assert response.status_code == 401


def test_create_trip_single_night_total_price(client, auth_headers):
    # 2025-08-05, 1 natt, Skeppsdockans Söderköping camping, Plats 101, Pris 440 kr
    payload = {
        "location_name": "Skeppsdockans Söderköping camping",
        "plot_number": "101",
        "start_date": "2025-08-05",
        "end_date": "2025-08-06",
        "price_total": 440,
        "price_input_mode": "total",
        "notes": "Fräscha duschar och toaletter.",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["nights"] == 1
    assert body["price_total"] == 440.0
    assert body["plot_number"] == "101"


def test_create_trip_multi_night_per_night_price(client, auth_headers):
    # 2025-08-06 - 2025-08-08, 2 nätter, Trosa Havsbad och Camping, Plats 420, 495 kr/natt
    payload = {
        "location_name": "Trosa Havsbad och Camping",
        "plot_number": "420",
        "start_date": "2025-08-06",
        "end_date": "2025-08-08",
        "price_per_night_input": 495,
        "price_input_mode": "per_night",
        "notes": "Fint läge vid östersjön, ok servicehus.",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["nights"] == 2
    assert body["price_total"] == 990.0


def test_create_trip_free_text_plot_number(client, auth_headers):
    # Dragsviks husvagnsklubb: plot is descriptive text, not a plot number
    payload = {
        "location_name": "Dragsviks husvagnsklubb",
        "plot_number": "Första gästplatsen innanför entrén",
        "start_date": "2025-08-08",
        "end_date": "2025-08-09",
        "price_per_night_input": 325,
        "price_input_mode": "per_night",
        "notes": "Enkel standard...",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["nights"] == 1
    assert body["price_total"] == 325.0
    assert body["plot_number"] == "Första gästplatsen innanför entrén"


def test_create_trip_with_place_area(client, auth_headers):
    # 2026-05-15, Björäng, Varberg, 350 kr/natt
    payload = {
        "location_name": "Björäng",
        "place_area": "Varberg",
        "start_date": "2026-05-15",
        "end_date": "2026-05-16",
        "price_per_night_input": 350,
        "price_input_mode": "per_night",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    assert response.json()["place_area"] == "Varberg"


def test_create_trip_missing_price(client, auth_headers):
    # 2026-05-16, Ugglarps camping, Falkenberg -- no price given at all
    payload = {
        "location_name": "Ugglarps camping",
        "place_area": "Falkenberg",
        "start_date": "2026-05-16",
        "end_date": "2026-05-17",
        "price_input_mode": "none",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["price_total"] is None


def test_create_trip_with_coordinates(client, auth_headers):
    # Fricamping, Holkekärrnäs skans -- geocoded from a Google Maps link
    payload = {
        "location_name": "Fricamping, Holkekärrnäs skans",
        "start_date": "2026-07-13",
        "end_date": "2026-07-14",
        "latitude": 58.8512677,
        "longitude": 11.5414512,
        "price_input_mode": "none",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["latitude"] == pytest.approx(58.8512677)
    assert body["longitude"] == pytest.approx(11.5414512)


def test_create_trip_rejects_end_date_not_after_start_date(client, auth_headers):
    payload = {
        "location_name": "Somewhere",
        "start_date": "2026-05-16",
        "end_date": "2026-05-16",
        "price_input_mode": "none",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 422


def test_create_trip_rejects_total_mode_without_price(client, auth_headers):
    payload = {
        "location_name": "Somewhere",
        "start_date": "2026-05-16",
        "end_date": "2026-05-17",
        "price_input_mode": "total",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 422


def _create(client, auth_headers, **overrides):
    payload = {
        "location_name": "Test Camp",
        "start_date": "2025-06-01",
        "end_date": "2025-06-02",
        "price_input_mode": "none",
    }
    payload.update(overrides)
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_get_trip_by_id(client, auth_headers):
    created = _create(client, auth_headers, location_name="Get Me")
    response = client.get(f"/api/trips/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["location_name"] == "Get Me"


def test_get_trip_not_found(client, auth_headers):
    response = client.get(
        "/api/trips/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404


def test_list_trips_date_range_filter(client, auth_headers):
    _create(client, auth_headers, location_name="In Range", start_date="2025-08-01", end_date="2025-08-02")
    _create(client, auth_headers, location_name="Out Of Range", start_date="2020-01-01", end_date="2020-01-02")

    response = client.get(
        "/api/trips",
        params={"start_date": "2025-01-01", "end_date": "2025-12-31"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    names = [item["location_name"] for item in response.json()["items"]]
    assert "In Range" in names
    assert "Out Of Range" not in names


def test_list_trips_text_search(client, auth_headers):
    _create(client, auth_headers, location_name="Trosa Havsbad och Camping")
    _create(client, auth_headers, location_name="Ugglarps camping")

    response = client.get("/api/trips", params={"q": "Trosa"}, headers=auth_headers)
    assert response.status_code == 200
    names = [item["location_name"] for item in response.json()["items"]]
    assert names == ["Trosa Havsbad och Camping"]


def test_update_trip_recomputes_price_on_date_change(client, auth_headers):
    created = _create(
        client,
        auth_headers,
        location_name="Recompute Me",
        price_per_night_input=100,
        price_input_mode="per_night",
    )
    assert created["price_total"] == 100.0

    response = client.patch(
        f"/api/trips/{created['id']}",
        json={"end_date": "2025-06-04"},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["nights"] == 3
    assert body["price_total"] == 300.0


def test_update_trip_rejects_invalid_resulting_dates(client, auth_headers):
    created = _create(client, auth_headers)
    response = client.patch(
        f"/api/trips/{created['id']}",
        json={"start_date": "2025-06-05"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_delete_trip(client, auth_headers):
    created = _create(client, auth_headers)
    response = client.delete(f"/api/trips/{created['id']}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/api/trips/{created['id']}", headers=auth_headers)
    assert response.status_code == 404
