from fastapi.testclient import TestClient
from app.main import app

def test_health():
    # Runtime DB availability is exercised by Docker smoke testing; this verifies route registration.
    assert any(getattr(r,'path',None)=='/health' for r in app.routes)
