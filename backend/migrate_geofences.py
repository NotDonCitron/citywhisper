import sys
import os
import json

# Add current directory to path so we can import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import save_geofence, init_db

def migrate():
    print("Migrating Geofences to SQLite...")
    init_db()

    # 1. District: Mannheim Quadrate (Approximate bounding box)
    quadrate_geom = {
        "type": "Polygon",
        "coordinates": [[
            [8.460, 49.480],
            [8.475, 49.480],
            [8.475, 49.495],
            [8.460, 49.495],
            [8.460, 49.480]
        ]]
    }
    save_geofence("dist_quadrate", "Mannheimer Quadrate", "district", quadrate_geom, priority=10)

    # 2. Landmark Area: Wasserturm / Friedrichsplatz (Smaller circle-like polygon)
    wasserturm_geom = {
        "type": "Polygon",
        "coordinates": [[
            [8.474, 49.483],
            [8.477, 49.483],
            [8.477, 49.485],
            [8.474, 49.485],
            [8.474, 49.483]
        ]]
    }
    save_geofence("area_wasserturm", "Friedrichsplatz & Wasserturm", "area", wasserturm_geom, priority=20)

    print("Geofence migration complete!")

if __name__ == "__main__":
    migrate()
