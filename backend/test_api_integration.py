import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

def test_geofence_check_api():
    """Test the /geofence/check endpoint."""
    # Coordinates inside Quadrate
    response = client.get("/geofence/check?lat=49.485&lng=8.465")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "dist_quadrate"
    assert data["name"] == "Mannheimer Quadrate"

def test_geofence_audio_api():
    """Test the /geofence/{id}/audio endpoint (triggers AI pipeline)."""
    # Request audio for the Quadrate district
    response = client.get("/geofence/dist_quadrate/audio?persona=insider")
    assert response.status_code == 200
    data = response.json()
    
    assert "audio_url" in data
    assert "script" in data
    assert data["type"] == "geofence"
    
    # Check if AI actually generated something
    assert len(data["script"]) > 20
    print(f"\nAI generated script: {data['script'][:50]}...")

def test_invalid_geofence_id():
    """Test error handling for non-existent geofence."""
    response = client.get("/geofence/non_existent/audio")
    assert response.status_code == 404
