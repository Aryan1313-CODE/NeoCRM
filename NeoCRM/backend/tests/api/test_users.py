import pytest
from app.core.config import settings


def _get_token(client):
    return client.post(
        "/auth/login",
        json={"email": settings.FIRST_SUPERADMIN_EMAIL, "password": settings.FIRST_SUPERADMIN_PASSWORD},
    ).json()["access_token"]


def test_list_users(seeded_client):
    token = _get_token(seeded_client)
    r = seeded_client.get("/users", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert data["total"] >= 1


def test_create_user(seeded_client):
    token = _get_token(seeded_client)
    r = seeded_client.post(
        "/users",
        json={"email": "newuser@example.com", "full_name": "New User", "password": "securepass123"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "newuser@example.com"
    assert data["status"] == "active"


def test_create_user_duplicate_email(seeded_client):
    token = _get_token(seeded_client)
    payload = {"email": "dup@example.com", "full_name": "Dup User", "password": "securepass123"}
    seeded_client.post("/users", json=payload, headers={"Authorization": f"Bearer {token}"})
    r = seeded_client.post("/users", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 409


def test_create_user_weak_password(seeded_client):
    token = _get_token(seeded_client)
    r = seeded_client.post(
        "/users",
        json={"email": "weak@example.com", "full_name": "Weak", "password": "short"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


def test_get_user(seeded_client):
    token = _get_token(seeded_client)
    users = seeded_client.get("/users", headers={"Authorization": f"Bearer {token}"}).json()
    user_id = users["items"][0]["id"]
    r = seeded_client.get(f"/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200


def test_update_user(seeded_client):
    token = _get_token(seeded_client)
    # Create a user to update
    created = seeded_client.post(
        "/users",
        json={"email": "toupdate@example.com", "full_name": "Original Name", "password": "securepass123"},
        headers={"Authorization": f"Bearer {token}"},
    ).json()

    r = seeded_client.put(
        f"/users/{created['id']}",
        json={"full_name": "Updated Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["full_name"] == "Updated Name"


def test_unauthenticated_list_users(seeded_client):
    r = seeded_client.get("/users")
    assert r.status_code == 401
