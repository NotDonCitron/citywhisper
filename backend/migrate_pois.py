from database import init_db, save_poi
import json

# Comprehensive Mannheim POI List
MANNHEIM_POIS = [
    # Landmarks
    {"id": "wasserturm", "name": "Mannheimer Wasserturm", "lat": 49.4842, "lng": 8.4755, "emoji": "⛲", "city": "Mannheim", "categories": ["History", "Architecture", "Views"]},
    {"id": "schloss_mannheim", "name": "Barockschloss Mannheim", "lat": 49.4836, "lng": 8.4620, "emoji": "🏛️", "city": "Mannheim", "categories": ["History", "Architecture"]},
    {"id": "fernmeldeturm", "name": "Fernmeldeturm Mannheim", "lat": 49.4872, "lng": 8.4875, "emoji": "🗼", "city": "Mannheim", "categories": ["Architecture", "Views", "Urban"]},
    
    # Squares & Urban
    {"id": "paradeplatz", "name": "Paradeplatz Mannheim", "lat": 49.4862, "lng": 8.4665, "emoji": "🌳", "city": "Mannheim", "categories": ["History", "Urban"]},
    {"id": "marktplatz", "name": "Marktplatz Mannheim (G1)", "lat": 49.4894, "lng": 8.4669, "emoji": "🏢", "city": "Mannheim", "categories": ["History", "Architecture", "Religion"]},
    {"id": "friedrichsplatz", "name": "Friedrichsplatz Mannheim", "lat": 49.4840, "lng": 8.4740, "emoji": "🗿", "city": "Mannheim", "categories": ["Nature", "Architecture"]},
    {"id": "collini_center", "name": "Collini-Center", "lat": 49.4880, "lng": 8.4770, "emoji": "🏢", "city": "Mannheim", "categories": ["Architecture", "Urban"]},
    
    # Parks & Nature
    {"id": "luisenpark", "name": "Luisenpark Mannheim", "lat": 49.4825, "lng": 8.4935, "emoji": "🌺", "city": "Mannheim", "categories": ["Nature", "Family"]},
    {"id": "teehaus", "name": "Chinesisches Teehaus", "lat": 49.4828, "lng": 8.4960, "emoji": "🏮", "city": "Mannheim", "categories": ["Culture", "Architecture", "Nature"]},
    {"id": "herzogenriedpark", "name": "Herzogenriedpark", "lat": 49.5005, "lng": 8.4795, "emoji": "🌳", "city": "Mannheim", "categories": ["Nature", "Family"]},
    
    # Culture & Museums
    {"id": "kunsthalle", "name": "Kunsthalle Mannheim", "lat": 49.4828, "lng": 8.4750, "emoji": "🎨", "city": "Mannheim", "categories": ["Art", "Architecture"]},
    {"id": "technoseum", "name": "Technoseum Mannheim", "lat": 49.4775, "lng": 8.4975, "emoji": "⚙️", "city": "Mannheim", "categories": ["History", "Urban"]},
    {"id": "rem", "name": "Reiss-Engelhorn-Museen", "lat": 49.4885, "lng": 8.4615, "emoji": "🏛️", "city": "Mannheim", "categories": ["History", "Art"]},
    {"id": "zeughaus", "name": "Zeughaus Mannheim", "lat": 49.4888, "lng": 8.4615, "emoji": "⚔️", "city": "Mannheim", "categories": ["History", "Art"]},
    {"id": "planetarium", "name": "Planetarium Mannheim", "lat": 49.4795, "lng": 8.4915, "emoji": "🪐", "city": "Mannheim", "categories": ["Views", "Urban"]},
    {"id": "nationaltheater", "name": "Nationaltheater Mannheim", "lat": 49.4830, "lng": 8.4670, "emoji": "🎭", "city": "Mannheim", "categories": ["Art", "Culture"]},
    {"id": "rosengarten", "name": "Congress Center Rosengarten", "lat": 49.4845, "lng": 8.4775, "emoji": "🌹", "city": "Mannheim", "categories": ["Culture", "Architecture"]},
    
    # Subculture & Scene
    {"id": "jungbusch", "name": "Jungbusch Mannheim", "lat": 49.4945, "lng": 8.4585, "emoji": "🎸", "city": "Mannheim", "categories": ["Subculture", "Nightlife", "Urban"]},
    {"id": "popakademie", "name": "Popakademie Baden-Württemberg", "lat": 49.4940, "lng": 8.4550, "emoji": "🎸", "city": "Mannheim", "categories": ["Subculture", "Culture"]},
    {"id": "hafen", "name": "Mannheimer Hafen", "lat": 49.4970, "lng": 8.4510, "emoji": "🚢", "city": "Mannheim", "categories": ["Urban", "Views"]},
    
    # Religion
    {"id": "jesuitenkirche", "name": "Jesuitenkirche Mannheim", "lat": 49.4858, "lng": 8.4605, "emoji": "⛪", "city": "Mannheim", "categories": ["History", "Religion", "Architecture"]},
    {"id": "moschee", "name": "Yavuz-Sultan-Selim-Moschee", "lat": 49.4920, "lng": 8.4590, "emoji": "🕌", "city": "Mannheim", "categories": ["Religion", "Architecture", "Culture"]},
    {"id": "synagoge", "name": "Synagoge Mannheim", "lat": 49.4865, "lng": 8.4635, "emoji": "🕎", "city": "Mannheim", "categories": ["Religion", "History"]},
    
    # Bridges
    {"id": "kurpfalzbruecke", "name": "Kurpfalzbrücke", "lat": 49.4915, "lng": 8.4690, "emoji": "🌉", "city": "Mannheim", "categories": ["Views", "Architecture"]}
]

# Schönau POIs (Legacy)
SCHOENAU_POIS = [
    {"id": "rathaus_schoenau", "name": "Rathaus Schönau", "lat": 49.4355, "lng": 8.8090, "emoji": "🏢", "city": "Schoenau", "categories": ["Architecture", "History"]},
    {"id": "klosterkirche_schoenau", "name": "Klosterkirche Schönau", "lat": 49.4348, "lng": 8.8105, "emoji": "⛪", "city": "Schoenau", "categories": ["History", "Religion"]},
    {"id": "huehnerberg", "name": "Hühnerberg Schönau", "lat": 49.4420, "lng": 8.8150, "emoji": "⛰️", "city": "Schoenau", "categories": ["Nature", "Views"]},
    {"id": "torhaus", "name": "Torhaus Schönau", "lat": 49.4360, "lng": 8.8075, "emoji": "🚪", "city": "Schoenau", "categories": ["History", "Architecture"]}
]

def migrate():
    print("Initializing Database...")
    init_db()
    
    print(f"Migrating {len(MANNHEIM_POIS)} Mannheim POIs...")
    for poi in MANNHEIM_POIS:
        save_poi(poi)
        print(f"  Migrated: {poi['name']}")
        
    print(f"Migrating {len(SCHOENAU_POIS)} Schönau POIs...")
    for poi in SCHOENAU_POIS:
        save_poi(poi)
        print(f"  Migrated: {poi['name']}")
        
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
