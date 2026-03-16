# CityWhisper 🎙️🏙️

"Die Stadt flüstert dir ihre Geheimnisse zu."

CityWhisper ist ein KI-gestützter City-Guide, der personalisierte Audio-Touren basierend auf deinem Standort und deinen Interessen erstellt.

## ✨ Features
- **PWA Ready:** Auf Android (Pixel 10) und iOS als App installierbar.
- **AI Storytelling:** Generiert individuelle Geschichten über Orte via Groq (Llama 3) oder Gemini.
- **Auto-Audio:** GPS-basiertes Geofencing triggert Audio-Guides automatisch (50m Radius).
- **Multi-City:** Support für Schönau (Odenwald) und Mannheim.

## 🛠️ Schnellstart (Lokal)
1. **Abhängigkeiten:** `py -m venv backend/venv` && `.\backend\venv\Scripts\pip install -r backend/requirements.txt`
2. **Umgebung:** Erstelle eine `.env` mit `GROQ_API_KEY`, `GEMINI_API_KEY` und `ELEVENLABS_API_KEY`.
3. **Start:** `.\backend\venv\Scripts\python -m uvicorn backend.main:app --reload`
4. **Browser:** Öffne `http://localhost:8000`

## 🚀 Deployment
Das Projekt wird automatisch auf **Hugging Face Spaces** gehostet.
- URL: `https://huggingface.co/spaces/PHhTTPS/Citywhisper`

## 📖 Planung
Alle Arbeitsschritte werden über das **Conductor Framework** in `/conductor` verwaltet.
