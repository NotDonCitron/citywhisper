import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_root():
    """Prüft ob das Frontend (HTML) ausgeliefert wird."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_get_pois():
    """Prüft ob die POIs korrekt zurückgegeben werden."""
    response = client.get("/pois")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["id"] == "klosterkirche"

def test_get_audio_endpoint():
    """Prüft ob der Audio-Endpunkt eine URL zurückgibt."""
    response = client.get("/poi/rathaus/audio")
    assert response.status_code == 200
    data = response.json()
    assert "audio_url" in data
    # Prüfen ob URL mit http anfängt (Fallback) oder /static (Normal)
    assert data["audio_url"].startswith("http") or data["audio_url"].startswith("/static")
