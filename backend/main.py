import os
import json
import time
import requests
import httpx
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
from urllib.parse import quote, unquote

# Lade Umgebungsvariablen
load_dotenv()

# Initialize Database on startup
init_db()

# API Keys
AGENTROUTER_API_KEY = os.getenv('AGENTROUTER_API_KEY')
AGENTROUTER_BASE_URL = os.getenv('AGENTROUTER_BASE_URL', 'https://agentrouter.org/v1').rstrip('/')
AGENTROUTER_MODEL = os.getenv('AGENTROUTER_MODEL', 'claude-opus-4-6')
MAPBOX_ACCESS_TOKEN = os.getenv('MAPBOX_ACCESS_TOKEN')
UNSPLASH_ACCESS_KEY = os.getenv('unsplash_access_key')

# BASE DIR for absolute paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')

app = FastAPI(title='CityWhisper AI Backend')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

AUDIO_DIR = os.path.join(STATIC_DIR, 'audio')
os.makedirs(AUDIO_DIR, exist_ok=True)

@app.get('/')
async def get_index():
    path = os.path.join(BASE_DIR, '../citywhisper_prototype.html')
    if not os.path.exists(path):
        path = 'citywhisper_prototype.html'
    return FileResponse(path)

@app.get('/citywhisper_prototype.html')
async def get_index_file():
    path = os.path.join(BASE_DIR, '../citywhisper_prototype.html')
    if not os.path.exists(path):
        path = 'citywhisper_prototype.html'
    return FileResponse(path)

# Mount static files correctly
app.mount('/static', StaticFiles(directory=STATIC_DIR), name='static')

wiki_wiki = wikipediaapi.Wikipedia(language='de', user_agent='CityWhisper/1.0')

class POI(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    emoji: Optional[str] = '📍'
    city: str
    categories: List[str] = []

PERSONAS = {
    'historian': {'name': 'Historiker Tom', 'emoji': '📜', 'description': 'Faktisch, tiefgründig.', 'prompt_style': 'Du bist ein Historiker. Erzähle präzise über Architektur.'},
    'insider': {'name': 'Insiderin Sarah', 'emoji': '🕶️', 'description': 'Cool, szenig.', 'prompt_style': 'Du bist eine trendbewusste Insiderin. Erzähle locker.'}
}

# Fallback image (local SVG)
FALLBACK_IMAGE = '/static/fallback.svg'

# Image cache directory
IMAGE_CACHE_DIR = os.path.join(STATIC_DIR, 'images')
os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)
IMAGE_CACHE_FILE = os.path.join(IMAGE_CACHE_DIR, 'cache.json')

def load_image_cache():
    if os.path.exists(IMAGE_CACHE_FILE):
        try:
            with open(IMAGE_CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_image_cache(cache):
    with open(IMAGE_CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)

def search_wikipedia_image(poi_name: str, city: str = '') -> Optional[str]:
    """Search Wikipedia for a POI image, trying multiple name variations."""
    headers = {'User-Agent': 'CityWhisper/1.0', 'Accept': 'application/json'}

    # Build ordered list of search variations
    variations = [poi_name]
    if city:
        base = poi_name.replace(f' {city}', '').replace(f' {city.lower()}', '').strip()
        if base != poi_name:
            # "Zeughaus Mannheim" -> try "Zeughaus (Mannheim)" before bare "Zeughaus"
            variations.append(f'{base} ({city})')
            variations.append(base)
        else:
            # City not in name: "Congress Center Rosengarten" -> try "Congress Center Rosengarten (Mannheim)"
            variations.append(f'{poi_name} ({city})')
            # Also try last word + (city): "Rosengarten (Mannheim)"
            last_word = poi_name.split()[-1]
            if last_word != poi_name:
                variations.append(f'{last_word} ({city})')

    for term in variations:
        try:
            search_term = term.replace(' ', '_')
            api_url = f'https://de.wikipedia.org/api/rest_v1/page/summary/{quote(search_term)}'
            response = requests.get(api_url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                thumbnail = data.get('thumbnail')
                if thumbnail and thumbnail.get('source'):
                    return thumbnail['source']
                original = data.get('originalimage')
                if original and original.get('source'):
                    return original['source']
        except:
            continue
    return None

def search_unsplash_image(poi_name: str, city: str = '') -> Optional[str]:
    if not UNSPLASH_ACCESS_KEY or UNSPLASH_ACCESS_KEY == 'YOUR_UNSPLASH_ACCESS_KEY_HERE':
        return None
    try:
        query = f'{poi_name} {city}' if city else poi_name
        api_url = f"https://api.unsplash.com/search/photos?query={query.replace(' ', '+')}&per_page=1&orientation=landscape"
        headers = {'Authorization': f'Client-ID {UNSPLASH_ACCESS_KEY}'}
        response = requests.get(api_url, headers=headers, timeout=10)
        if response.status_code == 200:
            results = response.json().get('results', [])
            if results: return results[0].get('urls', {}).get('regular')
        return None
    except:
        return None

def download_and_cache_image(url: str, poi_id: str) -> Optional[str]:
    try:
        cache = load_image_cache()
        if poi_id in cache:
            local_path = cache[poi_id]
            if os.path.exists(local_path): return local_path

        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, stream=True, timeout=30, headers=headers)
        if response.status_code != 200: return None

        content_type = response.headers.get('Content-Type', '')
        ext = '.jpg'
        if 'png' in content_type: ext = '.png'
        elif 'webp' in content_type: ext = '.webp'

        local_path = os.path.join(IMAGE_CACHE_DIR, f'{poi_id}{ext}')
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192): f.write(chunk)

        cache[poi_id] = local_path
        save_image_cache(cache)
        return local_path
    except:
        return None

def get_poi_image(poi: dict) -> dict:
    poi_id = poi['id']
    poi_name = poi['name']
    city = poi.get('city', '')
    cache = load_image_cache()
    cached_img = cache.get(poi_id)

    # Try to find the file even if path in cache is slightly different
    actual_path = None
    if cached_img:
        if os.path.exists(cached_img):
            actual_path = cached_img
        else:
            # Try to find by filename in IMAGE_CACHE_DIR
            filename = os.path.basename(cached_img)
            potential_path = os.path.join(IMAGE_CACHE_DIR, filename)
            if os.path.exists(potential_path):
                actual_path = potential_path

    if actual_path:
        cached_url = f'/static/images/{os.path.basename(actual_path)}'
        return {'direct': poi.get('image'), 'proxied': None, 'cached': cached_url, 'fallback': FALLBACK_IMAGE}

    static_img = poi.get('image')
    if not static_img:
        wiki_img = search_wikipedia_image(poi_name, city)
        if wiki_img:
            cached_path = download_and_cache_image(wiki_img, poi_id)
            if cached_path:
                return {'direct': None, 'proxied': None, 'cached': f'/static/images/{os.path.basename(cached_path)}', 'fallback': FALLBACK_IMAGE}

    return {'direct': static_img, 'proxied': None, 'cached': None, 'fallback': FALLBACK_IMAGE}

def preload_all_images():
    cache = load_image_cache()
    all_pois = get_all_pois()
    for poi in all_pois:
        poi_id = poi['id']
        if poi_id not in cache:
            get_poi_image(poi)
            time.sleep(0.5)

@app.get('/proxy_image')
async def proxy_image(url: str = Query(...)):
    try:
        response = requests.get(url, stream=True, timeout=15)
        if response.status_code == 200:
            return Response(content=response.content, media_type=response.headers.get('Content-Type'))
        return FileResponse(os.path.join(STATIC_DIR, 'fallback.svg'))
    except:
        return FileResponse(os.path.join(STATIC_DIR, 'fallback.svg'))

async def generate_script(target_data, target_type='poi', persona_id='insider', user_categories: List[str] = []):
    persona = PERSONAS.get(persona_id, PERSONAS['insider'])
    name = target_data['name']
    page = wiki_wiki.page(name)
    facts = page.summary[:1000] if page.exists() else f'Ort: {name}.'

    categories = target_data.get('categories', []) if target_type == 'poi' else []
    matched_cats = [c for c in categories if c in user_categories]

    match_info = f'Interessen-Match: {", ".join(matched_cats)}.' if matched_cats else ''
    prompt = f"{persona['prompt_style']} Wir stehen vor {name}. {match_info} Erzähle eine Geschichte dazu (ca. 80 Wörter). FAKTEN: {facts}"

    if AGENTROUTER_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{AGENTROUTER_BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {AGENTROUTER_API_KEY}"},
                    json={
                        "model": AGENTROUTER_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.8
                    },
                    timeout=30.0
                )
                response.encoding = 'utf-8'
                if response.status_code == 200:
                    data = response.json()
                    return data['choices'][0]['message']['content']
                else:
                    print(f"AgentRouter Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"AgentRouter Exception: {e}")
            pass
    return f'Willkommen in {name}.'

@app.get('/poi/{poi_id}/audio')
async def get_audio(poi_id: str, persona: str = 'insider', categories: str = Query('')):
    all_pois = get_all_pois()
    poi = next((p for p in all_pois if p['id'] == poi_id), None)
    if not poi: raise HTTPException(404)

    image_data = get_poi_image(poi)
    cat_hash = 'none'
    if categories:
        import hashlib
        cat_hash = hashlib.md5(categories.encode()).hexdigest()[:8]

    audio_path = os.path.join(AUDIO_DIR, f'{poi_id}_{persona}_{cat_hash}.mp3')
    script_path = os.path.join(AUDIO_DIR, f'{poi_id}_{persona}_{cat_hash}.txt')

    if os.path.exists(audio_path):
        with open(script_path, 'r', encoding='utf-8') as f: script = f.read()
        return {'id': poi_id, 'audio_url': f'/static/audio/{os.path.basename(audio_path)}', 'script': script, 'image': image_data}

    script = await generate_script(poi, persona_id=persona, user_categories=categories.split(',') if categories else [])
    with open(script_path, 'w', encoding='utf-8') as f: f.write(script)

    # Strip markdown formatting before TTS (prevents "Stern Stern" for **bold**)
    import re
    tts_text = script
    tts_text = re.sub(r'\*\*(.+?)\*\*', r'\1', tts_text)  # **bold**
    tts_text = re.sub(r'\*(.+?)\*', r'\1', tts_text)        # *italic*
    tts_text = re.sub(r'_(.+?)_', r'\1', tts_text)          # _italic_
    tts_text = re.sub(r'#{1,6}\s+', '', tts_text)           # # headers
    tts_text = re.sub(r'`(.+?)`', r'\1', tts_text)          # `code`
    tts_text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', tts_text) # [link](url)

    voice = 'de-DE-KatjaNeural' if persona == 'insider' else 'de-DE-KillianNeural'
    try:
        communicate = edge_tts.Communicate(tts_text, voice)
        await communicate.save(audio_path)
    except:
        return {'id': poi_id, 'audio_url': None, 'script': script, 'image': image_data, 'error': 'TTS failed'}  

    return {'id': poi_id, 'audio_url': f'/static/audio/{os.path.basename(audio_path)}', 'script': script, 'image': image_data}

class RouteRequest(BaseModel):
    poi_ids: List[str]
    roundtrip: Optional[bool] = True
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None

@app.post('/route')
async def get_optimized_route(req: RouteRequest):
    if not MAPBOX_ACCESS_TOKEN: raise HTTPException(500, 'Token missing')
    all_pois = get_all_pois()
    selected_pois = [p for p in all_pois if p['id'] in req.poi_ids]
    if len(selected_pois) < 2: raise HTTPException(400, 'At least 2 POIs required')

    params = {'access_token': MAPBOX_ACCESS_TOKEN, 'geometries': 'geojson', 'overview': 'full', 'steps': 'true', 'language': 'de'}
    route_points = []
    # If a start position is provided, prepend it as the first waypoint
    if req.start_lat is not None and req.start_lng is not None:
        route_points.append({'id': '_start', 'lat': req.start_lat, 'lng': req.start_lng, 'is_poi': False})
    route_points += [{'id': p['id'], 'lat': p['lat'], 'lng': p['lng'], 'is_poi': True} for p in selected_pois]
    params.update({'roundtrip': 'true' if req.roundtrip else 'false', 'source': 'first'})

    coords = ';'.join([f"{p['lng']},{p['lat']}" for p in route_points])
    url = f'https://api.mapbox.com/optimized-trips/v1/mapbox/walking/{coords}'
    response = requests.get(url, params=params)
    data = response.json()

    if response.status_code != 200 or 'trips' not in data or not data['trips']:
        return {'geometry': None, 'duration': 0, 'optimized_poi_order': req.poi_ids, 'legs': []}

    ordered_pois = []
    for wp in data.get('waypoints', []):
        idx = wp.get('waypoint_index')
        if idx is not None and idx < len(route_points) and route_points[idx]['is_poi']:
            ordered_pois.append(route_points[idx]['id'])

    return {
        'geometry': data['trips'][0]['geometry'],
        'duration': data['trips'][0]['duration'],
        'optimized_poi_order': ordered_pois,
        'legs': data['trips'][0].get('legs', [])
    }

@app.get('/pois')
async def get_pois():
    all_pois = get_all_pois()
    for poi in all_pois:
        poi['image'] = get_poi_image(poi)
    return all_pois

@app.get('/geofence/check')
async def check_current_geofence(lat: float = Query(...), lng: float = Query(...)):
    from database import check_geofences
    fence = check_geofences(lat, lng)
    return fence if fence else {'id': None}

@app.on_event('startup')
async def startup_event():
    import threading
    threading.Thread(target=preload_all_images, daemon=True).start()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
