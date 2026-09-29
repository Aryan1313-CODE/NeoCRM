from app.core.config import settings


def test_health(seeded_client):
    r = seeded_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_login_success(seeded_client):
    r = seeded_client.post(
        "/auth/login",
        json={"email": settings.FIRST_SUPERADMIN_EMAIL, "password": settings.FIRST_SUPERADMIN_PASSWORD},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(seeded_client):
    r = seeded_client.post(
        "/auth/login",
        json={"email": settings.FIRST_SUPERADMIN_EMAIL, "password": "wrong"},
    )
    assert r.status_code == 401


def test_login_unknown_email(seeded_client):
    r = seeded_client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "anything"},
    )
    assert r.status_code == 401


def test_me_authenticated(seeded_client):
    token = seeded_client.post(
        "/auth/login",
        json={"email": settings.FIRST_SUPERADMIN_EMAIL, "password": settings.FIRST_SUPERADMIN_PASSWORD},
    ).json()["access_token"]

    r = seeded_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == settings.FIRST_SUPERADMIN_EMAIL
    assert data["is_superadmin"] is True


def test_me_unauthenticated(seeded_client):
    r = seeded_client.get("/auth/me")
    assert r.status_code == 401


def test_me_invalid_token(seeded_client):
    r = seeded_client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert r.status_code == 401
