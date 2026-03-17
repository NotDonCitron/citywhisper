import pytest
import os
import sqlite3
import json
import database as db

# Use a temporary test database
TEST_DB_PATH = "test_citywhisper.db"

@pytest.fixture(autouse=True)
def setup_test_db():
    """Setup a clean test database before each test."""
    # Override the DB_PATH in the database module
    original_path = db.DB_PATH
    db.DB_PATH = TEST_DB_PATH
    
    # Ensure a clean start
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    
    db.init_db()
    
    yield
    
    # Cleanup after test
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    
    # Restore original path
    db.DB_PATH = original_path

def test_init_db():
    """Check if tables are correctly created."""
    conn = sqlite3.connect(TEST_DB_PATH)
    cursor = conn.cursor()
    
    # Check pois table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pois'")
    assert cursor.fetchone() is not None
    
    # Check settings table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
    assert cursor.fetchone() is not None
    conn.close()

def test_save_and_get_poi():
    """Verify saving and retrieving a POI."""
    poi = {
        "id": "test_spot",
        "name": "Test Location",
        "lat": 49.0,
        "lng": 8.0,
        "emoji": "🧪",
        "city": "TestCity",
        "categories": ["Test", "Dev"]
    }
    
    db.save_poi(poi)
    all_pois = db.get_all_pois()
    
    assert len(all_pois) == 1
    saved = all_pois[0]
    assert saved["id"] == "test_spot"
    assert saved["name"] == "Test Location"
    assert "Test" in saved["categories"]
    assert saved["emoji"] == "🧪"

def test_get_pois_by_categories():
    """Verify category-based filtering."""
    poi1 = {"id": "p1", "name": "Art Spot", "lat": 49.1, "lng": 8.1, "categories": ["Art"]}
    poi2 = {"id": "p2", "name": "Food Spot", "lat": 49.2, "lng": 8.2, "categories": ["Food"]}
    poi3 = {"id": "p3", "name": "Mixed Spot", "lat": 49.3, "lng": 8.3, "categories": ["Art", "Food"]}
    
    db.save_poi(poi1)
    db.save_poi(poi2)
    db.save_poi(poi3)
    
    # Filter for Art
    art_spots = db.get_pois_by_categories(["Art"])
    assert len(art_spots) == 2
    ids = [p["id"] for p in art_spots]
    assert "p1" in ids
    assert "p3" in ids
    assert "p2" not in ids

def test_find_nearby_pois():
    """Verify Haversine distance logic (within ~50m)."""
    # Wasserturm Mannheim approx coordinates
    wasserturm = {"id": "w", "name": "Wasserturm", "lat": 49.4842, "lng": 8.4755, "categories": []}
    # Very close spot (~10m away)
    near_spot = {"id": "n", "name": "Near", "lat": 49.48425, "lng": 8.47555, "categories": []}
    # Far spot (~1km away)
    far_spot = {"id": "f", "name": "Far", "lat": 49.4942, "lng": 8.4755, "categories": []}
    
    db.save_poi(wasserturm)
    db.save_poi(near_spot)
    db.save_poi(far_spot)
    
    # Search near Wasserturm (50m radius)
    nearby = db.find_nearby_pois(49.4842, 8.4755, radius_meters=50.0)
    
    assert len(nearby) == 2
    ids = [p["id"] for p in nearby]
    assert "w" in ids
    assert "n" in ids
    assert "f" not in ids
