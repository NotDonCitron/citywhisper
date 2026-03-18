import pytest
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import check_geofences, save_geofence, init_db

def test_geofence_priority():
    """
    Test that higher priority geofences are returned first.
    Area (Prio 20) should win over District (Prio 10) even if both match.
    """
    init_db()
    
    # 1. Coordinate inside both District and Area
    # Quadrate (Prio 10) and Wasserturm (Prio 20)
    lat, lng = 49.484, 8.475
    
    result = check_geofences(lat, lng)
    
    assert result is not None
    assert result["id"] == "area_wasserturm"
    assert result["priority"] == 20

def test_geofence_outside():
    """Test that points outside return None."""
    lat, lng = 52.0, 13.0 # Berlin
    result = check_geofences(lat, lng)
    assert result is None

def test_geofence_district_only():
    """Test point inside district but outside specific area."""
    # Somewhere in Quadrate but not at Wasserturm
    lat, lng = 49.485, 8.465
    result = check_geofences(lat, lng)
    
    assert result is not None
    assert result["id"] == "dist_quadrate"
