import base64
import io
import uuid
from pathlib import Path

from app.config import settings
from app.models.photo import Photo

TINY_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


def _create_trip(client, auth_headers):
    payload = {
        "location_name": "Photo Test Camp",
        "start_date": "2025-06-01",
        "end_date": "2025-06-02",
        "price_input_mode": "none",
    }
    response = client.post("/api/trips", json=payload, headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


def _upload(client, auth_headers, trip_id, filename="test.png", content_type="image/png", content=TINY_PNG):
    return client.post(
        f"/api/trips/{trip_id}/photos",
        files={"file": (filename, io.BytesIO(content), content_type)},
        headers=auth_headers,
    )


def test_upload_photo_requires_auth(client):
    response = client.post(
        "/api/trips/00000000-0000-0000-0000-000000000000/photos",
        files={"file": ("test.png", io.BytesIO(TINY_PNG), "image/png")},
    )
    assert response.status_code == 401


def test_upload_photo_trip_not_found(client, auth_headers):
    response = _upload(client, auth_headers, "00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_upload_photo_success(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    response = _upload(client, auth_headers, trip["id"])
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["content_type"] == "image/png"
    assert body["file_size_bytes"] == len(TINY_PNG)
    assert body["original_filename"] == "test.png"
    assert body["trip_id"] == trip["id"]


def test_upload_photo_rejects_non_image(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    response = _upload(client, auth_headers, trip["id"], filename="test.txt", content_type="text/plain", content=b"not an image")
    assert response.status_code == 415


def test_upload_photo_rejects_oversized_file(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "max_photo_size_bytes", 10)
    trip = _create_trip(client, auth_headers)
    response = _upload(client, auth_headers, trip["id"])
    assert response.status_code == 413


def test_get_trip_includes_nested_photos(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    _upload(client, auth_headers, trip["id"])

    response = client.get(f"/api/trips/{trip['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()["photos"]) == 1


def test_list_photos_endpoint(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    _upload(client, auth_headers, trip["id"])

    response = client.get(f"/api/trips/{trip['id']}/photos", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_delete_photo(client, auth_headers):
    trip = _create_trip(client, auth_headers)
    upload = _upload(client, auth_headers, trip["id"])
    photo_id = upload.json()["id"]

    response = client.delete(f"/api/photos/{photo_id}", headers=auth_headers)
    assert response.status_code == 204

    trip_response = client.get(f"/api/trips/{trip['id']}", headers=auth_headers)
    assert trip_response.json()["photos"] == []


def test_delete_photo_not_found(client, auth_headers):
    response = client.delete(
        "/api/photos/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404


def test_deleting_trip_cascades_photos(client, auth_headers, db_session):
    trip = _create_trip(client, auth_headers)
    upload = _upload(client, auth_headers, trip["id"])
    photo_id = upload.json()["id"]
    file_path = Path(settings.photo_storage_path) / upload.json()["file_path"]
    assert file_path.exists()

    response = client.delete(f"/api/trips/{trip['id']}", headers=auth_headers)
    assert response.status_code == 204

    assert db_session.get(Photo, uuid.UUID(photo_id)) is None
    assert not file_path.exists()
