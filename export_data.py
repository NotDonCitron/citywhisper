import sqlite3
import json
import os

def export():
    conn = sqlite3.connect('backend/citywhisper.db')
    conn.row_factory = sqlite3.Row
    
    # Export POIs
    pois = [dict(r) for r in conn.execute('SELECT * FROM pois WHERE city="Mannheim"').fetchall()]
    # Decode categories if they are strings
    for poi in pois:
        if isinstance(poi.get('categories'), str):
            poi['categories'] = json.loads(poi['categories'])
            
    # Export Geofences
    fences = [dict(r) for r in conn.execute('SELECT * FROM geofences').fetchall()]
    
    os.makedirs('deploy_presentation/static/data', exist_ok=True)
    
    with open('deploy_presentation/static/data/pois.json', 'w', encoding='utf-8') as f:
        json.dump(pois, f, indent=2, ensure_ascii=False)
        
    with open('deploy_presentation/static/data/geofences.json', 'w', encoding='utf-8') as f:
        json.dump(fences, f, indent=2, ensure_ascii=False)
        
    print(f"Exported {len(pois)} POIs and {len(fences)} Geofences.")
    conn.close()

if __name__ == "__main__":
    export()
