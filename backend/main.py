import os
import json
import time
import requests
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from database import get_all_pois, get_pois_by_categories, init_db, save_poi
from pydantic import BaseModel, Field
from typing import List, Optional
from dotenv import load_dotenv
import edge_tts
import wikipediaapi
from groq import Groq
from urllib.parse import quote, unquote

# Lade Umgebungsvariablen
load_dotenv()

# Initialize Database on startup
init_db()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")
UNSPLASH_ACCESS_KEY = os.getenv("unsplash_access_key")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = FastAPI(title="CityWhisper AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

@app.get("/")
async def get_index():
    # If running from backend directory, root is one level up
    path = "../citywhisper_prototype.html"
    if not os.path.exists(path):
        # Fallback if running from root
        path = "citywhisper_prototype.html"
    return FileResponse(path)

@app.get("/citywhisper_prototype.html")
async def get_index_file():
    path = "../citywhisper_prototype.html"
    if not os.path.exists(path):
        path = "citywhisper_prototype.html"
    return FileResponse(path)

app.mount("/static", StaticFiles(directory="static"), name="static")

wiki_wiki = wikipediaapi.Wikipedia(language='de', user_agent="CityWhisper/1.0")

class POI(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    emoji: Optional[str] = "📍"
    city: str
    categories: List[str] = []

PERSONAS = {
    "historian": {"name": "Historiker Tom", "emoji": "📜", "description": "Faktisch, tiefgründig.", "prompt_style": "Du bist ein Historiker. Erzähle präzise über Architektur."},
    "insider": {"name": "Insiderin Sarah", "emoji": "🕶️", "description": "Cool, szenig.", "prompt_style": "Du bist eine trendbewusste Insiderin. Erzähle locker."}
}

# Fallback image (local SVG)
FALLBACK_IMAGE = "/static/fallback.svg"

# Image cache directory
IMAGE_CACHE_DIR = "backend/static/images"
os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)
IMAGE_CACHE_FILE = "backend/static/images/cache.json"

# Pre-download and cache all POI images on startup
def preload_all_images():
    """Pre-download all POI images to local cache."""
    print("Pre-loading POI images...")
    cache = load_image_cache()
    all_pois = get_all_pois()
    
    for poi in all_pois:
        poi_id = poi["id"]
        poi_name = poi["name"]
        city = poi.get("city", "")
        static_img = poi.get("image")
        
        # Skip if already cached
        if poi_id in cache and cache[poi_id] and os.path.exists(cache[poi_id]):
            print(f"  {poi_id}: already cached")
            continue
        
        # Try static image first if available
        if static_img:
            print(f"  {poi_id}: downloading static image...")
            cached_path = download_and_cache_image(static_img, poi_id)
            if cached_path:
                print(f"  {poi_id}: cached successfully")
                time.sleep(1)
                continue
            else:
                print(f"  {poi_id}: static image failed, trying Wikipedia search...")
        
        # Fallback: search Wikipedia for image
        wiki_img = search_wikipedia_image(poi_name, city)
        if wiki_img:
            print(f"  {poi_id}: found on Wikipedia, downloading...")
            cached_path = download_and_cache_image(wiki_img, poi_id)
            if cached_path:
                print(f"  {poi_id}: cached successfully")
            else:
                print(f"  {poi_id}: Wikipedia download failed, trying Unsplash...")
                # Try Unsplash as fallback
                unsplash_img = search_unsplash_image(poi_name, city)
                if unsplash_img:
                    print(f"  {poi_id}: found on Unsplash, downloading...")
                    cached_path = download_and_cache_image(unsplash_img, poi_id)
                    if cached_path:
                        print(f"  {poi_id}: cached successfully from Unsplash")
                    else:
                        print(f"  {poi_id}: Unsplash download failed")
                else:
                    print(f"  {poi_id}: no Unsplash image found")
        else:
            # Wikipedia failed, try Unsplash directly
            print(f"  {poi_id}: no Wikipedia image, trying Unsplash...")
            unsplash_img = search_unsplash_image(poi_name, city)
            if unsplash_img:
                print(f"  {poi_id}: found on Unsplash, downloading...")
                cached_path = download_and_cache_image(unsplash_img, poi_id)
                if cached_path:
                    print(f"  {poi_id}: cached successfully from Unsplash")
                else:
                    print(f"  {poi_id}: Unsplash download failed")
            else:
                print(f"  {poi_id}: no image found on any source")
        
        # Wait between downloads to avoid rate limiting
        time.sleep(1)
    print("Image pre-loading complete!")


def load_image_cache():
    """Load the image cache from disk."""
    if os.path.exists(IMAGE_CACHE_FILE):
        try:
            with open(IMAGE_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_image_cache(cache):
    """Save the image cache to disk."""
    with open(IMAGE_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def search_wikipedia_image(poi_name: str, city: str = "") -> Optional[str]:
    """
    Search Wikipedia for an image of the POI using the REST API.
    Returns the image URL or None if not found.
    """
    try:
        # Use Wikipedia REST API to get page summary with thumbnail
        search_term = poi_name.replace(" ", "_")
        api_url = f"https://de.wikipedia.org/api/rest_v1/page/summary/{search_term}"
        
        headers = {
            "User-Agent": "CityWhisper/1.0",
            "Accept": "application/json"
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            thumbnail = data.get("thumbnail")
            if thumbnail:
                # Get the source URL (not the thumbnail)
                return thumbnail.get("source")
            # Try originalimage as fallback
            original = data.get("originalimage")
            if original:
                return original.get("source")
        
        return None
    except Exception as e:
        print(f"Wikipedia image search failed for {poi_name}: {e}")
        return None

def search_unsplash_image(poi_name: str, city: str = "") -> Optional[str]:
    """
    Search Unsplash for an image of the POI.
    Returns the image URL or None if not found.
    """
    if not UNSPLASH_ACCESS_KEY or UNSPLASH_ACCESS_KEY == "YOUR_UNSPLASH_ACCESS_KEY_HERE":
        print(f"[UNSPLASH] No access key configured")
        return None
    
    try:
        # Build search query
        query = f"{poi_name} {city}" if city else poi_name
        query = query.replace(" ", "+")
        
        api_url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&orientation=landscape"
        headers = {
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        print(f"[UNSPLASH] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            if results:
                photo = results[0]
                # Get regular size URL (1080px width)
                urls = photo.get("urls", {})
                image_url = urls.get("regular") or urls.get("full")
                if image_url:
                    # Trigger download endpoint (required by Unsplash API guidelines)
                    download_url = photo.get("links", {}).get("download")
                    if download_url:
                        try:
                            requests.get(download_url, timeout=5)
                        except:
                            pass  # Non-critical
                    print(f"[UNSPLASH] Found image for {poi_name}")
                    return image_url
        elif response.status_code == 401:
            print(f"[UNSPLASH] Invalid API key")
        elif response.status_code == 403:
            print(f"[UNSPLASH] Rate limit exceeded")
        else:
            print(f"[UNSPLASH] API error: {response.status_code}")
        
        return None
    except Exception as e:
        print(f"Unsplash image search failed for {poi_name}: {e}")
        return None

def download_and_cache_image(url: str, poi_id: str) -> Optional[str]:
    """
    Download an image and cache it locally.
    Returns the local path or None if failed.
    """
    print(f"[DOWNLOAD_DEBUG] Downloading {poi_id} from: {url}")
    try:
        cache = load_image_cache()
        
        # Check if already cached
        if poi_id in cache:
            local_path = cache[poi_id]
            if os.path.exists(local_path):
                return local_path
        
        # Download the image
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, stream=True, timeout=30, headers=headers)
        print(f"[DOWNLOAD_DEBUG] Response status: {response.status_code}, content-type: {response.headers.get('Content-Type')}")
        if response.status_code != 200:
            return None
        
        # Determine file extension
        content_type = response.headers.get("Content-Type", "")
        ext = ".jpg"
        if "png" in content_type:
            ext = ".png"
        elif "gif" in content_type:
            ext = ".gif"
        elif "webp" in content_type:
            ext = ".webp"
        
        # Save locally
        local_path = f"{IMAGE_CACHE_DIR}/{poi_id}{ext}"
        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"[DOWNLOAD_DEBUG] Saved to: {local_path}, size: {os.path.getsize(local_path)} bytes")
        
        # Update cache
        cache[poi_id] = local_path
        save_image_cache(cache)
        
        return local_path
    except Exception as e:
        print(f"[DOWNLOAD_DEBUG] Image download failed for {poi_id}: {e}")
        return None

def get_poi_image(poi: dict) -> dict:
    """
    Get image for a POI, automatically discovering one if needed.
    Returns an image data object with direct, cached, and fallback options.
    """
    poi_id = poi["id"]
    poi_name = poi["name"]
    city = poi.get("city", "")
    
    # Check cache first - cached images are always best (local, no CORS issues)
    cache = load_image_cache()
    cached_img = cache.get(poi_id)
    
    # If we have a cached image, use it as primary (even if static image exists)
    if cached_img and os.path.exists(cached_img):
        cached_url = f"/static/images/{os.path.basename(cached_img)}"
        static_img = poi.get("image")  # Still include for fallback
        encoded_url = quote(static_img, safe='') if static_img else None
        print(f"[POI_IMAGE_DEBUG] poi_id={poi_id}, using_cached={cached_url}")
        return {
            "direct": static_img,
            "proxied": f"/proxy_image?url={encoded_url}" if encoded_url else None,
            "cached": cached_url,
            "fallback": FALLBACK_IMAGE
        }
    
    # Check static image
    static_img = poi.get("image")
    
    # Auto-discover if no static image
    if not static_img:
        print(f"No image for {poi_id}, searching Wikipedia...")
        wiki_img = search_wikipedia_image(poi_name, city)
        if wiki_img:
            # Download and cache
            cached_path = download_and_cache_image(wiki_img, poi_id)
            if cached_path:
                cached_img = cached_path
    
    # Build response - include all fallback strategies
    # URL-encode the image URL for the proxy endpoint
    encoded_url = quote(static_img, safe='') if static_img else None
    print(f"[POI_IMAGE_DEBUG] poi_id={poi_id}, static_img={static_img}, encoded={encoded_url}")
    return {
        "direct": static_img,
        "proxied": f"/proxy_image?url={encoded_url}" if encoded_url else None,
        "cached": f"/static/images/{os.path.basename(cached_img)}" if cached_img else None,
        "fallback": FALLBACK_IMAGE
    }

@app.get("/proxy_image")
async def proxy_image(url: str = Query(..., description="URL-encoded image URL")):
    """
    Robust image proxy with proper error handling.
    Returns the image directly or falls back to local fallback.
    """
    # Diagnostic: Log the received URL
    print(f"[PROXY_DEBUG] Received URL: {url}")
    print(f"[PROXY_DEBUG] URL decoded: {unquote(url)}")
    
    try:
        # Validate URL is safe
        if not url or not url.startswith(('http://', 'https://')):
            print(f"[PROXY_DEBUG] Invalid URL format: {url}")
            return Response(content="", status_code=400)
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://unsplash.com/",
        }
        
        # Retry logic for rate limiting (429) with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.get(url, stream=True, timeout=15, headers=headers, allow_redirects=True)
            
            if response.status_code == 200:
                break  # Success!
            elif response.status_code == 429 and attempt < max_retries - 1:
                # Rate limited - wait and retry
                wait_time = (attempt + 1) * 2  # 2, 4, 6 seconds
                print(f"[PROXY_DEBUG] Rate limited (429), waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                continue
            else:
                print(f"[PROXY_DEBUG] Wikipedia returned {response.status_code} for {url}")
                return FileResponse("backend/static/fallback.svg", media_type="image/svg+xml")
        
        # Verify content type is an image
        content_type = response.headers.get("Content-Type", "")
        if not content_type.startswith("image/"):
            print(f"[PROXY_DEBUG] Invalid content-type: {content_type} for {url}")
            return FileResponse("backend/static/fallback.svg", media_type="image/svg+xml")
        
        print(f"[PROXY_DEBUG] Successfully proxied: {url}, size: {len(response.content)} bytes")
        
        # Return with CORS headers
        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except requests.exceptions.Timeout:
        print(f"[PROXY_DEBUG] Timeout for {url}")
        return FileResponse("backend/static/fallback.svg", media_type="image/svg+xml")
    except requests.exceptions.RequestException as e:
        print(f"[PROXY_DEBUG] Request error for {url}: {e}")
        return FileResponse("backend/static/fallback.svg", media_type="image/svg+xml")
    except Exception as e:
        print(f"[PROXY_DEBUG] Unexpected error for {url}: {e}")
        return FileResponse("backend/static/fallback.svg", media_type="image/svg+xml")

async def generate_script(poi, persona_id="insider", user_categories: List[str] = []):
    persona = PERSONAS.get(persona_id, PERSONAS["insider"])
    page = wiki_wiki.page(poi["name"])
    facts = page.summary[:1000] if page.exists() else f"Ort: {poi['name']}."
    
    # Context-aware prompting
    poi_cats = poi.get("categories", [])
    matched_cats = [c for c in poi_cats if c in user_categories]
    
    prompt = f"{persona['prompt_style']} KONTEXT: Wir stehen vor {poi['name']}. "
    if matched_cats:
        prompt += f"Interessen-Match: Der Nutzer interessiert sich besonders für {', '.join(matched_cats)}. Betone diese Aspekte. "
    prompt += f"Kategorien des Ortes: {', '.join(poi_cats)}. STIL: Kein Name, ca. 80 Wörter. FAKTEN: {facts}"
    
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(model="llama-3.3-70b-versatile", messages=[{"role": "user", "content": prompt}], temperature=0.8)
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Groq error: {e}")
            pass
    return f"Schau dir das mal an. Wir stehen hier am {poi['name']}."

class RouteRequest(BaseModel):
    poi_ids: List[str]
    start_poi_id: Optional[str] = None
    start_location: Optional[List[float]] = Field(default=None, min_items=2, max_items=2)

@app.post("/route")
async def get_optimized_route(req: RouteRequest):
    if not MAPBOX_ACCESS_TOKEN: raise HTTPException(500, "Token missing")
    all_pois = get_all_pois()
    selected_pois = [p for p in all_pois if p["id"] in req.poi_ids]
    
    if len(selected_pois) < 2:
        raise HTTPException(400, "At least 2 POIs required")
    
    # Build route points list
    route_points = [{"id": p["id"], "lat": p["lat"], "lng": p["lng"], "is_poi": True} for p in selected_pois]
    
    # Mapbox API parameters
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "geometries": "geojson",
        "overview": "full",
        "steps": "false"
    }
    
    # Handle start point selection
    if req.start_location:
        # Use current location as start point
        lat, lng = req.start_location[1], req.start_location[0]  # [lng, lat] -> lat, lng
        route_points.insert(0, {"id": "__start_location__", "lat": lat, "lng": lng, "is_poi": False})
        params.update({"source": "first", "destination": "any", "roundtrip": "false"})
    elif req.start_poi_id:
        # Use selected POI as start point
        start = next((p for p in selected_pois if p["id"] == req.start_poi_id), None)
        if start:
            # Reorder: start POI first, then others
            route_points = [
                {"id": start["id"], "lat": start["lat"], "lng": start["lng"], "is_poi": True}
            ] + [
                {"id": p["id"], "lat": p["lat"], "lng": p["lng"], "is_poi": True}
                for p in selected_pois if p["id"] != req.start_poi_id
            ]
            params.update({"source": "first", "destination": "any", "roundtrip": "false"})
    
    # Build coordinates string for Mapbox API
    coords = ";".join([f"{p['lng']},{p['lat']}" for p in route_points])
    url = f"https://api.mapbox.com/optimized-trips/v1/mapbox/walking/{coords}"
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "trips" not in data or not data["trips"]:
        raise HTTPException(400, data.get("message", "Route could not be generated"))
    
    # Extract ordered POIs from waypoints
    ordered_pois = []
    for wp in data.get("waypoints", []):
        idx = wp.get("waypoint_index")
        if idx is None or idx >= len(route_points):
            continue
        point = route_points[idx]
        if point["is_poi"]:
            ordered_pois.append(point["id"])
    
    return {
        "geometry": data["trips"][0]["geometry"],
        "duration": data["trips"][0]["duration"],
        "optimized_poi_order": ordered_pois
    }

@app.get("/")
async def root():
    path = "citywhisper_prototype.html"
    if not os.path.exists(path):
        path = os.path.join("..", path)
    return FileResponse(path)

@app.get("/manifest.json")
async def manifest(): return FileResponse("manifest.json")

@app.get("/sw.js")
async def service_worker(): return FileResponse("sw.js", media_type="application/javascript")

@app.get("/pois")
async def get_pois(): return get_all_pois()

@app.get("/discover")
async def discover_pois(categories: List[str] = Query([])):
    """Filter POIs based on a list of categories."""
    if not categories:
        return get_all_pois()
    
    processed_categories = []
    for cat in categories:
        if "," in cat:
            processed_categories.extend([c.strip() for c in cat.split(",")])
        else:
            processed_categories.append(cat)
            
    return get_pois_by_categories(processed_categories)

@app.get("/personas")
async def get_personas(): return PERSONAS

@app.get("/poi/{poi_id}/audio")
async def get_audio(poi_id: str, persona: str = "insider", categories: str = Query("")):
    all_pois = get_all_pois()
    poi = next((p for p in all_pois if p["id"] == poi_id), None)
    if not poi: raise HTTPException(404)
    
    # Get image with auto-discovery
    image_data = get_poi_image(poi)
    
    # Handle user preferences if passed
    user_cats = [c.strip() for c in categories.split(",")] if categories else []
    
    import hashlib
    cat_hash = hashlib.md5(categories.encode()).hexdigest()[:8] if categories else "none"
    
    audio_path = f"{AUDIO_DIR}/{poi_id}_{persona}_{cat_hash}.mp3"
    script_path = f"{AUDIO_DIR}/{poi_id}_{persona}_{cat_hash}.txt"
    
    if os.path.exists(audio_path):
        with open(script_path, "r", encoding="utf-8") as f: script = f.read()
        return {"id": poi_id, "audio_url": f"/static/audio/{os.path.basename(audio_path)}", "script": script, "image": image_data}
    
    script = await generate_script(poi, persona, user_cats)
    with open(script_path, "w", encoding="utf-8") as f: f.write(script)
    
    # Map personas to edge-tts voices
    voice = "de-DE-KatjaNeural" if persona == "insider" else "de-DE-KillianNeural"
    
    try:
        communicate = edge_tts.Communicate(script, voice)
        await communicate.save(audio_path)
    except Exception as e:
        print(f"Edge-TTS error: {e}")
        # Very minimal fallback if even edge-tts fails
        return {"id": poi_id, "audio_url": None, "script": script, "image": image_data, "error": "TTS failed"}
    
    return {"id": poi_id, "audio_url": f"/static/audio/{os.path.basename(audio_path)}", "script": script, "image": image_data}

# Startup event: preload images after app is ready
@app.on_event("startup")
async def startup_event():
    print("Starting CityWhisper backend...")
    # Run image preloading in background to not block
    import threading
    thread = threading.Thread(target=preload_all_images, daemon=True)
    thread.start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
