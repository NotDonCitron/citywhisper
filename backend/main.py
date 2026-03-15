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
from gtts import gTTS
import wikipediaapi
from groq import Groq

# Lade Umgebungsvariablen
load_dotenv()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
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

CURRENT_POIS = [
    # Schönau (69250)
    {"id": "klosterkirche", "name": "Klosterkirche Schönau (Odenwald)", "lat": 49.4355, "lng": 8.8095, "emoji": "⛪", "city": "Schoenau"},
    {"id": "rathaus_schoenau", "name": "Rathaus Schönau", "lat": 49.4348, "lng": 8.8088, "emoji": "🏛️", "city": "Schoenau"},
    {"id": "huehnerberg", "name": "Hühnerberg Schönau", "lat": 49.4380, "lng": 8.8150, "emoji": "🌿", "city": "Schoenau"},
    {"id": "torhaus", "name": "Historisches Torhaus Schönau", "lat": 49.4342, "lng": 8.8080, "emoji": "🚪", "city": "Schoenau"},
    
    # Mannheim
    {"id": "wasserturm", "name": "Wasserturm Mannheim", "lat": 49.4836, "lng": 8.4751, "emoji": "⛲", "city": "Mannheim"},
    {"id": "schloss_mannheim", "name": "Schloss Mannheim", "lat": 49.4831, "lng": 8.4622, "emoji": "🏛️", "city": "Mannheim"},
    {"id": "jungbusch", "name": "Jungbusch Mannheim", "lat": 49.4939, "lng": 8.4568, "emoji": "🎸", "city": "Mannheim"},
    {"id": "fernmeldeturm", "name": "Fernmeldeturm Mannheim", "lat": 49.4873, "lng": 8.4871, "emoji": "🗼", "city": "Mannheim"},
    {"id": "planken", "name": "Mannheimer Planken", "lat": 49.4850, "lng": 8.4680, "emoji": "🛍️", "city": "Mannheim"}
]

async def generate_script(poi):
    page = wiki_wiki.page(poi["name"])
    facts = page.summary[:1200] if page.exists() else f"Ein cooler Ort in {poi['city']}."
    
    city_flavor = "den Vibe der Quadrate und die industrielle Energie" if poi['city'] == "Mannheim" else "die idyllische Odenwald-Atmosphäre und die historische Tiefe"
    
    prompt = f"""
    Du bist ein leidenschaftlicher Lokal-Insider für {poi['city']}. 
    Deine Mission: Erzähle einem Freund eine packende, kurze Geschichte über {poi['name']}.
    
    Nutze diese Fakten als Basis: {facts}
    
    STIL-REGELN:
    - Fang direkt an mit: "Schau dir das mal an..." oder "Wusstest du eigentlich...?"
    - Sprich den Nutzer direkt an (Du). Sei begeistert!
    - Erwähne kurz {city_flavor}.
    - Verliere dich nicht in Jahreszahlen. Konzentriere dich auf das 'Warum' dieser Ort besonders ist.
    - Halte es kurz und knackig (ca. 120-150 Wörter, max 45 Sek Sprechzeit).
    - Gib NUR den Text zurück, keine Einleitung oder Meta-Kommentare.
    """
    
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama3-8b-8192", 
                messages=[{"role": "system", "content": "Du bist ein charismatischer Tourguide."}, {"role": "user", "content": prompt}], 
                temperature=0.8
            )
            return completion.choices[0].message.content
        except: pass
    return f"Hey! Wir stehen hier am {poi['name']}. Ein echter Insider-Punkt in {poi['city']}. Schau dich mal um!"

@app.get("/")
async def root(): return FileResponse("citywhisper_prototype.html")

@app.get("/pois")
async def get_pois(): return CURRENT_POIS

@app.get("/poi/{poi_id}/audio")
async def get_audio(poi_id: str):
    audio_path = f"{AUDIO_DIR}/{poi_id}.mp3"
    script_path = f"{AUDIO_DIR}/{poi_id}.txt"
    public_url = f"/static/audio/{poi_id}.mp3"

    # Wenn wir die Persona ändern, löschen wir ggf. alte Cache-Files (optional)
    # Für diesen Test lassen wir sie, damit du den Unterschied bei neuen Klicks merkst.

    if os.path.exists(audio_path):
        script = ""
        if os.path.exists(script_path):
            with open(script_path, "r", encoding="utf-8") as f: script = f.read()
        return {"id": poi_id, "audio_url": public_url, "cached": True, "script": script}

    poi = next((p for p in CURRENT_POIS if p["id"] == poi_id), None)
    if not poi: raise HTTPException(404)
    
    script = await generate_script(poi)
    with open(script_path, "w", encoding="utf-8") as f: f.write(script)

    try:
        tts = gTTS(text=script, lang='de')
        tts.save(audio_path)
        return {"id": poi_id, "audio_url": public_url, "cached": False, "script": script}
    except:
        return {"id": poi_id, "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "script": script}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
