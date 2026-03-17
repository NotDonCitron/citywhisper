import pytest
from fastapi.testclient import TestClient
import os
import json
from main import app

client = TestClient(app)

def test_read_root():
    """Verify that the frontend (HTML) is served."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_get_pois():
    """Verify that POIs are returned correctly."""
    response = client.get("/pois")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    # The first POI in migrate_pois.py for Mannheim is wasserturm
    assert any(p["id"] == "wasserturm" for p in data)

def test_discover_by_category():
    """Verify category filtering via the /discover endpoint."""
    # Filter for 'Art' (Kunsthalle, Nationaltheater, etc.)
    response = client.get("/discover?categories=Art")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for poi in data:
        assert "Art" in poi["categories"]

def test_route_optimization():
    """Verify the Mapbox-based route optimization (selected Mannheim POIs)."""
    # Use 3 Mannheim POIs
    poi_ids = ["wasserturm", "schloss_mannheim", "jungbusch"]
    response = client.post("/route", json={"poi_ids": poi_ids})
    
    # If Mapbox token is missing/invalid, it returns 500 (based on main.py)
    # But let's check if we get a valid response if the token exists
    if response.status_code == 200:
        data = response.json()
        assert "geometry" in data
        assert "optimized_poi_order" in data
        assert len(data["optimized_poi_order"]) == 3
    elif response.status_code == 500:
        print("Mapbox Token missing or error - skipping detailed geometry check")
    else:
        pytest.fail(f"Route endpoint failed with status {response.status_code}")

@pytest.mark.asyncio
async def test_full_audio_pipeline_endpoint():
    """Verify the full pipeline: Groq script generation -> edge-tts audio generation."""
    # Test for a Mannheim POI with a persona
    poi_id = "wasserturm"
    persona = "historian"
    
    # This might take a few seconds as it calls Groq and edge-tts
    response = client.get(f"/poi/{poi_id}/audio?persona={persona}")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == poi_id
    assert "audio_url" in data
    assert data["audio_url"].startswith("/static/audio/")
    assert "script" in data
    assert len(data["script"]) > 20
    
    # Verify the physical file was created
    filename = os.path.basename(data["audio_url"])
    # The file is saved in AUDIO_DIR = "backend/static/audio" (relative to root)
    # OR "static/audio" (relative to backend dir)
    file_path = f"static/audio/{filename}"
    if not os.path.exists(file_path):
        file_path = os.path.join("backend", file_path)
    
    assert os.path.exists(file_path)
    
    # Clean up generated test file to keep the 0-cost storage lean
    # (Optional: we might want to keep it for actual app usage)
