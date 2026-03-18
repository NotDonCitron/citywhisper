import sys
import os
import json

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import save_geofence, init_db

def migrate_more_districts():
    print("Adding more Mannheim Districts to Geofencing Engine...")
    init_db()

    # 1. Jungbusch (District)
    # Bounding roughly: Jungbuschstr, Werftstr, Kanal
    jungbusch_geom = {
        "type": "Polygon",
        "coordinates": [[
            [8.450, 49.490],
            [8.460, 49.490],
            [8.460, 49.498],
            [8.450, 49.498],
            [8.450, 49.490]
        ]]
    }
    save_geofence("dist_jungbusch", "Jungbusch", "district", jungbusch_geom, priority=10)

    # 2. Schloss / University Area (District)
    schloss_geom = {
        "type": "Polygon",
        "coordinates": [[
            [8.458, 49.480],
            [8.468, 49.480],
            [8.468, 49.485],
            [8.458, 49.485],
            [8.458, 49.480]
        ]]
    }
    save_geofence("dist_schloss", "Schloss & Universität", "district", schloss_geom, priority=10)

    # 3. Neckarstadt-West (District)
    neckarstadt_geom = {
        "type": "Polygon",
        "coordinates": [[
            [8.460, 49.498],
            [8.475, 49.498],
            [8.475, 49.505],
            [8.460, 49.505],
            [8.460, 49.498]
        ]]
    }
    save_geofence("dist_neckarstadt", "Neckarstadt-West", "district", neckarstadt_geom, priority=10)

    print("Migration of additional districts complete!")

if __name__ == "__main__":
    migrate_more_districts()
