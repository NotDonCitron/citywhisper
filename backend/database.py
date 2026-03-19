import sqlite3
import json
import math
import os
from typing import List, Optional

# Use absolute path for database
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "citywhisper.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with tables. Returns True on success."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # POI Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS pois (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            emoji TEXT,
            city TEXT,
            image TEXT,
            categories TEXT -- JSON string of categories
        )
        """)
        
        # Metadata / Settings Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
        """)

        # Geofences Table (for Districts, Areas, Paths)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS geofences (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL, -- 'area', 'district', 'path'
            geometry TEXT NOT NULL, -- GeoJSON string
            priority INTEGER DEFAULT 1
        )
        """)

        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Database initialization error: {e}")
        return False

def check_geofences(lat: float, lng: float):
    """
    Check if a point is inside any defined geofence polygon.
    Returns the matching geofence with the highest priority.
    """
    try:
        from shapely.geometry import shape, Point

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM geofences ORDER BY priority DESC")
        rows = cursor.fetchall()
        conn.close()

        point = Point(lng, lat) # GeoJSON is usually [lng, lat]

        for row in rows:
            geo_data = json.loads(row["geometry"])
            polygon = shape(geo_data)
            if polygon.contains(point):
                return dict(row)
        return None
    except Exception as e:
        print(f"Error checking geofences: {e}")
        return None

def save_geofence(id: str, name: str, fence_type: str, geometry: dict, priority: int = 1):
    """Save or update a geofence."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO geofences (id, name, type, geometry, priority)
        VALUES (?, ?, ?, ?, ?)
        """, (id, name, fence_type, json.dumps(geometry), priority))
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Error saving geofence: {e}")
        return False
def save_poi(poi: dict):
    """Save or update a POI. Returns True on success."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO pois (id, name, lat, lng, emoji, city, image, categories)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            poi["id"],
            poi["name"],
            poi["lat"],
            poi["lng"],
            poi.get("emoji", "📍"),
            poi.get("city", ""),
            poi.get("image"),
            json.dumps(poi.get("categories", []))
        ))
        conn.commit()
        conn.close()
        return True
    except sqlite3.Error as e:
        print(f"Error saving POI: {e}")
        return False

def get_all_pois():
    """Fetch all POIs from database. Returns empty list on error."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pois")
        rows = cursor.fetchall()
        conn.close()
        
        pois = []
        for row in rows:
            poi = dict(row)
            poi["categories"] = json.loads(poi["categories"]) if poi.get("categories") else []
            pois.append(poi)
        return pois
    except sqlite3.Error as e:
        print(f"Error fetching POIs: {e}")
        return []

def get_pois_by_categories(categories: List[str]):
    """Filter POIs by categories. Returns all POIs if no categories specified."""
    try:
        all_pois = get_all_pois()
        if not categories:
            return all_pois
        
        filtered = []
        for poi in all_pois:
            if any(cat in poi["categories"] for cat in categories):
                filtered.append(poi)
        return filtered
    except Exception as e:
        print(f"Error filtering POIs: {e}")
        return []

def find_nearby_pois(lat: float, lng: float, radius_meters: float = 50.0):
    """
    Simple Haversine-based distance filtering in Python.
    For a production version with thousands of POIs, we'd use a bounding box first.
    Returns empty list on error.
    """
    try:
        all_pois = get_all_pois()
        nearby = []
        
        for poi in all_pois:
            # Haversine distance
            R = 6371000 # Earth radius in meters
            phi1, phi2 = math.radians(lat), math.radians(poi["lat"])
            dphi = math.radians(poi["lat"] - lat)
            dlamb = math.radians(poi["lng"] - lng)
            
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlamb/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            distance = R * c
            
            if distance <= radius_meters:
                poi["distance"] = distance
                nearby.append(poi)
                
        return nearby
    except Exception as e:
        print(f"Error finding nearby POIs: {e}")
        return []
