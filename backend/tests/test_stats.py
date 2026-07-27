from datetime import date


def _create_trip(client, auth_headers, **overrides):
    payload = {
        "location_name": "Stats Camp",
        "start_date": "2025-06-01",
        "end_date": "2025-06-02",
        "price_input_mode": "none",
    }
    payload.update(overrides)
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_stats_requires_auth(client):
    response = client.get("/api/stats/summary")
    assert response.status_code == 401


def test_stats_summary_default_range_is_current_year(client, auth_headers):
    year = date.today().year
    _create_trip(
        client,
        auth_headers,
        location_name="This Year Trip",
        start_date=f"{year}-03-01",
        end_date=f"{year}-03-03",
        price_per_night_input=200,
        price_input_mode="per_night",
        star_rating=4,
    )
    _create_trip(
        client,
        auth_headers,
        location_name="Last Year Trip",
        start_date=f"{year - 1}-03-01",
        end_date=f"{year - 1}-03-03",
        price_input_mode="none",
    )

    response = client.get("/api/stats/summary", headers=auth_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["trip_count"] == 1
    assert body["total_nights"] == 2
    assert body["total_price"] == 400.0
    assert body["avg_price_per_night"] == 200.0
    assert body["avg_star_rating"] == 4.0


def test_stats_summary_explicit_range(client, auth_headers):
    _create_trip(
        client, auth_headers, start_date="2020-01-01", end_date="2020-01-02", price_total=100, price_input_mode="total"
    )
    _create_trip(
        client, auth_headers, start_date="2021-01-01", end_date="2021-01-02", price_total=200, price_input_mode="total"
    )

    response = client.get(
        "/api/stats/summary",
        params={"start_date": "2020-01-01", "end_date": "2021-01-01"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["trip_count"] == 1
    assert body["total_price"] == 100.0


def test_stats_summary_excludes_unpriced_trips_from_price_average(client, auth_headers):
    _create_trip(client, auth_headers, start_date="2022-01-01", end_date="2022-01-03", price_input_mode="none")
    _create_trip(
        client,
        auth_headers,
        start_date="2022-02-01",
        end_date="2022-02-02",
        price_per_night_input=300,
        price_input_mode="per_night",
    )

    response = client.get(
        "/api/stats/summary",
        params={"start_date": "2022-01-01", "end_date": "2022-03-01"},
        headers=auth_headers,
    )
    body = response.json()
    assert body["trip_count"] == 2
    assert body["total_nights"] == 3
    assert body["total_price"] == 300.0
    assert body["avg_price_per_night"] == 300.0


def test_stats_summary_no_trips_in_range(client, auth_headers):
    response = client.get(
        "/api/stats/summary",
        params={"start_date": "1999-01-01", "end_date": "1999-02-01"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["trip_count"] == 0
    assert body["total_nights"] == 0
    assert body["total_price"] is None
    assert body["avg_price_per_night"] is None
    assert body["avg_star_rating"] is None


def test_stats_rejects_invalid_range(client, auth_headers):
    response = client.get(
        "/api/stats/summary",
        params={"start_date": "2023-01-01", "end_date": "2023-01-01"},
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_stats_by_month(client, auth_headers):
    _create_trip(
        client, auth_headers, start_date="2023-01-05", end_date="2023-01-07", price_total=100, price_input_mode="total"
    )
    _create_trip(
        client, auth_headers, start_date="2023-01-20", end_date="2023-01-21", price_total=50, price_input_mode="total"
    )
    _create_trip(client, auth_headers, start_date="2023-03-10", end_date="2023-03-11", price_input_mode="none")

    response = client.get(
        "/api/stats/by_month",
        params={"start_date": "2023-01-01", "end_date": "2023-04-01"},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    months = {m["month"]: m for m in response.json()["months"]}
    assert set(months.keys()) == {"2023-01", "2023-02", "2023-03"}
    assert months["2023-01"]["trip_count"] == 2
    assert months["2023-01"]["total_nights"] == 3
    assert months["2023-01"]["total_price"] == 150.0
    assert months["2023-02"]["trip_count"] == 0
    assert months["2023-02"]["total_price"] is None
    assert months["2023-03"]["trip_count"] == 1
    assert months["2023-03"]["total_price"] is None


def test_stats_by_month_clamps_trip_starting_before_range(client, auth_headers):
    _create_trip(
        client, auth_headers, start_date="2022-12-30", end_date="2023-01-02", price_total=90, price_input_mode="total"
    )

    response = client.get(
        "/api/stats/by_month",
        params={"start_date": "2023-01-01", "end_date": "2023-02-01"},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    months = {m["month"]: m for m in response.json()["months"]}
    assert months["2023-01"]["trip_count"] == 1
    assert months["2023-01"]["total_nights"] == 3
