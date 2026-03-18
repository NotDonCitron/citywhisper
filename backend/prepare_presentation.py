import requests
import json
import time

BASE_URL = "http://localhost:7860"
PERSONAS = ["insider", "historian"]

def prepare_demo_assets():
    print("🚀 Starte Audio-Vorbereitung für die Präsentation...")
    
    # 1. Get all POIs
    try:
        pois = requests.get(f"{BASE_URL}/pois").json()
        mannheim_pois = [p for p in pois if p.get('city') == 'Mannheim']
        print(f"📍 Gefunden: {len(mannheim_pois)} Orte in Mannheim.")
    except Exception as e:
        print(f"❌ Fehler beim Laden der POIs: {e}")
        return

    # 2. Get all Geofences
    # We don't have a list-all endpoint for fences yet, so we'll use the known ones
    fences = ["dist_quadrate", "area_wasserturm", "dist_jungbusch", "dist_schloss", "dist_neckarstadt"]
    
    # 3. Trigger Audio Generation for POIs
    for poi in mannheim_pois:
        pid = poi['id']
        name = poi['name']
        for persona in PERSONAS:
            print(f"🎙️ Generiere Audio ({persona}): {name}...")
            try:
                # This call will trigger generation and caching on the server
                res = requests.get(f"{BASE_URL}/poi/{pid}/audio?persona={persona}")
                if res.status_code == 200:
                    print(f" ✅ Fertig.")
                else:
                    print(f" ⚠️ Fehler: {res.status_code}")
            except Exception as e:
                print(f" ❌ Request fehlgeschlagen: {e}")
            time.sleep(0.5) # Be gentle to the API

    # 4. Trigger Audio Generation for Geofences
    for fid in fences:
        for persona in PERSONAS:
            print(f"🏙️ Generiere Zonen-Intro ({persona}): {fid}...")
            try:
                res = requests.get(f"{BASE_URL}/geofence/{fid}/audio?persona={persona}")
                if res.status_code == 200:
                    print(f" ✅ Fertig.")
                else:
                    print(f" ⚠️ Fehler: {res.status_code}")
            except Exception as e:
                print(f" ❌ Request fehlgeschlagen: {e}")
            time.sleep(0.5)

    print("\n✨ Alle Assets wurden generiert und im Server-Cache gespeichert!")

if __name__ == "__main__":
    prepare_demo_assets()
