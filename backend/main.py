import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq
import wikipediaapi

# Lade Umgebungsvariablen (.env)
load_dotenv()

# Konfigurationen
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00T838D34dgv433sl")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title="CityWhisper AI Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Statische Dateien (Audio-Cache)
AUDIO_DIR = "backend/static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Wikipedia API Setup
wiki_wiki = wikipediaapi.Wikipedia(
    language='de',
    user_agent="CityWhisper/1.0 (contact: team@citywhisper.app)"
)

class POI(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    description: Optional[str] = None
    emoji: Optional[str] = "📍"
    category: Optional[str] = "historisch"
    address: Optional[str] = ""
    routeOrder: int

# Daten für Schönau (69250)
CURRENT_POIS = [
    {"id": "klosterkirche", "name": "Klosterkirche Schönau (Odenwald)", "lat": 49.4355, "lng": 8.8095, "emoji": "⛪", "category": "historisch", "address": "Marktplatz, Schönau", "routeOrder": 1},
    {"id": "rathaus", "name": "Rathaus Schönau", "lat": 49.4348, "lng": 8.8088, "emoji": "🏛️", "category": "historisch", "address": "Hauptstraße, Schönau", "routeOrder": 2},
    {"id": "hühnerberg", "name": "Hühnerberg Schönau", "lat": 49.4380, "lng": 8.8150, "emoji": "🌿", "category": "natur", "address": "Wanderweg, Schönau", "routeOrder": 3}
]

def get_wiki_summary(poi_name: str):
    page = wiki_wiki.page(poi_name)
    if page.exists():
        return page.summary[:1500]
    return f"Informationen über {poi_name} in Schönau bei Heidelberg."

async def generate_script_logic(poi, persona="lockerer Guide"):
    facts = get_wiki_summary(poi["name"])
    prompt = f"""
    Du bist ein {persona} für die CityWhisper App in Schönau (Odenwald).
    Schreibe ein fesselndes, kurzes Audio-Guide Skript (ca. 30-45 Sekunden Sprechzeit) für den Ort: {poi['name']}.
    Nutze diese Fakten als Grundlage:
    {facts}

    Regeln:
    - Sprich den Nutzer direkt an (Duzen).
    - Sei unterhaltsam, aber faktisch korrekt.
    - Erwähne Schönau und die Atmosphäre im Odenwald.
    - Gib NUR den Skript-Text zurück.
    """
    
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            return completion.choices[0].message.content
        except: pass

    return f"Willkommen am {poi['name']} in Schönau! Ein historischer Ort im Odenwald."

@app.get("/")
async def root():
    html_path = "citywhisper_prototype.html"
    if os.path.exists(html_path):
        return FileResponse(html_path)
    return {"message": "CityWhisper Backend active"}

@app.get("/manifest.json")
async def manifest():
    return FileResponse("manifest.json")

@app.get("/sw.js")
async def service_worker():
    return FileResponse("sw.js", media_type="application/javascript")

@app.get("/pois", response_model=List[POI])
async def get_pois():
    return CURRENT_POIS

@app.get("/poi/{poi_id}/audio")
async def get_poi_audio(poi_id: str):
    audio_path = f"{AUDIO_DIR}/{poi_id}.mp3"
    script_path = f"{AUDIO_DIR}/{poi_id}.txt"
    public_url = f"/static/audio/{poi_id}.mp3"

    script = "Skript konnte nicht geladen werden."
    if os.path.exists(script_path):
        with open(script_path, "r", encoding="utf-8") as f:
            script = f.read()

    if os.path.exists(audio_path):
        return {"id": poi_id, "audio_url": public_url, "cached": True, "script": script}

    poi = next((p for p in CURRENT_POIS if p["id"] == poi_id), None)
    if not poi:
        raise HTTPException(status_code=404, detail="POI nicht gefunden")
    
    script = await generate_script_logic(poi)
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script)

    if not ELEVENLABS_API_KEY:
        return {"id": poi_id, "audio_url": "/static/audio/demo_audio.mp3", "cached": False, "script": script}

    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {"accept": "audio/mpeg", "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    data = {"text": script, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}

    try:
        response = requests.post(tts_url, json=data, headers=headers)
        if response.status_code == 200:
            with open(audio_path, "wb") as f:
                f.write(response.content)
            return {"id": poi_id, "audio_url": public_url, "cached": False, "script": script}
        else:
            return {"id": poi_id, "audio_url": "/static/audio/demo_audio.mp3", "cached": False, "script": script}
    except:
        return {"id": poi_id, "audio_url": "/static/audio/demo_audio.mp3", "cached": False, "script": script}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
