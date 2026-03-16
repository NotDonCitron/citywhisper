import os
import json
import time
import requests
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from gtts import gTTS
import wikipediaapi
from groq import Groq
from urllib.parse import quote, unquote

# Lade Umgebungsvariablen
load_dotenv()

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

AUDIO_DIR = "backend/static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

wiki_wiki = wikipediaapi.Wikipedia(language='de', user_agent="CityWhisper/1.0")

class POI(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    emoji: Optional[str] = "📍"
    city: str

# POI data with correct Wikipedia images
CURRENT_POIS = [
    {"id": "wasserturm", "name": "Mannheimer Wasserturm", "lat": 49.4836, "lng": 8.4751, "emoji": "⛲", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Mannheim_Wasserturm_Friedrichsplatz_1.jpg/800px-Mannheim_Wasserturm_Friedrichsplatz_1.jpg"},
    {"id": "schloss_mannheim", "name": "Schloss Mannheim", "lat": 49.4831, "lng": 8.4622, "emoji": "🏛️", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/SchlossEhrenhof_2017.jpg/800px-SchlossEhrenhof_2017.jpg"},
    {"id": "jungbusch", "name": "Jungbusch Mannheim", "lat": 49.4939, "lng": 8.4568, "emoji": "🎸", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Jungbusch_in_Mannheim.jpg/800px-Jungbusch_in_Mannheim.jpg"},
    {"id": "fernmeldeturm", "name": "Fernmeldeturm Mannheim", "lat": 49.4873, "lng": 8.4871, "emoji": "🗼", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Fernmeldeturm_Mannheim_02.jpg/800px-Fernmeldeturm_Mannheim_02.jpg"},
    {"id": "jesuitenkirche", "name": "Jesuitenkirche (Mannheim)", "lat": 49.4852, "lng": 8.4608, "emoji": "⛪", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Mannheim_Jesuitenkirche_20120322.jpg/800px-Mannheim_Jesuitenkirche_20120322.jpg"},
    {"id": "paradeplatz", "name": "Paradeplatz (Mannheim)", "lat": 49.4862, "lng": 8.4665, "emoji": "🌳", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Paradeplatz_Mannheim_2019.jpg/800px-Paradeplatz_Mannheim_2019.jpg"},
    {"id": "luisenpark", "name": "Luisenpark Mannheim", "lat": 49.4710, "lng": 8.4500, "emoji": "🌺", "city": "Mannheim"},
    {"id": "reiss_engelhorn_museen", "name": "Reiss-Engelhorn-Museen", "lat": 49.4805, "lng": 8.4610, "emoji": "🏛️", "city": "Mannheim"},
    {"id": "nationaltheater", "name": "Nationaltheater Mannheim", "lat": 49.4830, "lng": 8.4670, "emoji": "🎭", "city": "Mannheim"},
    {"id": "kunsthalle", "name": "Kunsthalle Mannheim", "lat": 49.4825, "lng": 8.4680, "emoji": "🎨", "city": "Mannheim"},
    {"id": "water_tower_park", "name": "Friedrichsplatz Mannheim", "lat": 49.4840, "lng": 8.4740, "emoji": "🗿", "city": "Mannheim", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Friedrichsplatz_Mannheim_2019.jpg/800px-Friedrichsplatz_Mannheim_2019.jpg"}
]

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
    
    for poi in CURRENT_POIS:
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
                time.sleep(10)
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
        time.sleep(10)
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

async def generate_script(poi, persona_id="insider"):
    persona = PERSONAS.get(persona_id, PERSONAS["insider"])
    page = wiki_wiki.page(poi["name"])
    facts = page.summary[:1000] if page.exists() else f"Ort: {poi['name']}."
    prompt = f"{persona['prompt_style']} KONTEXT: Wir stehen vor {poi['name']}. STIL: Kein Name, ca. 80 Wörter. FAKTEN: {facts}"
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(model="llama3-8b-8192", messages=[{"role": "user", "content": prompt}], temperature=0.8)
            return completion.choices[0].message.content
        except: pass
    return f"Schau dir das mal an. Wir stehen hier am {poi['name']}."

class RouteRequest(BaseModel):
    poi_ids: List[str]

@app.post("/route")
async def get_optimized_route(req: RouteRequest):
    if not MAPBOX_ACCESS_TOKEN: raise HTTPException(500, "Token missing")
    selected_pois = [p for p in CURRENT_POIS if p["id"] in req.poi_ids]
    coords = ";".join([f"{p['lng']},{p['lat']}" for p in selected_pois])
    url = f"https://api.mapbox.com/optimized-trips/v1/mapbox/walking/{coords}"
    params = {"access_token": MAPBOX_ACCESS_TOKEN, "geometries": "geojson", "overview": "full", "steps": "false"}
    response = requests.get(url, params=params)
    data = response.json()
    return {"geometry": data["trips"][0]["geometry"], "duration": data["trips"][0]["duration"], "optimized_poi_order": [selected_pois[i]["id"] for i in [tw["waypoint_index"] for tw in data["waypoints"]]]}

@app.get("/")
async def root(): return FileResponse("citywhisper_prototype.html")

@app.get("/pois")
async def get_pois(): return CURRENT_POIS

@app.get("/personas")
async def get_personas(): return PERSONAS

@app.get("/poi/{poi_id}/audio")
async def get_audio(poi_id: str, persona: str = "insider"):
    poi = next((p for p in CURRENT_POIS if p["id"] == poi_id), None)
    if not poi: raise HTTPException(404)
    
    # Get image with auto-discovery
    image_data = get_poi_image(poi)
    
    audio_path, script_path = f"{AUDIO_DIR}/{poi_id}_{persona}.mp3", f"{AUDIO_DIR}/{poi_id}_{persona}.txt"
    if os.path.exists(audio_path):
        with open(script_path, "r", encoding="utf-8") as f: script = f.read()
        return {"id": poi_id, "audio_url": f"/static/audio/{poi_id}_{persona}.mp3", "script": script, "image": image_data}
    script = await generate_script(poi, persona)
    with open(script_path, "w", encoding="utf-8") as f: f.write(script)
    tts = gTTS(text=script, lang='de')
    tts.save(audio_path)
    return {"id": poi_id, "audio_url": f"/static/audio/{poi_id}_{persona}.mp3", "script": script, "image": image_data}

# Preload images on startup (after all functions are defined)
preload_all_images()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
