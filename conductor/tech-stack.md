# Tech Stack: CityWhisper

## 🌐 Frontend & Client
- **Web Prototype:** HTML5, CSS3, Vanilla JS (based on current implementation).
- **Styling:** Modern, dark mode with orange/teal accents (Vanilla CSS).
- **Framework (Planned):** React (TypeScript) or Angular for full-featured mobile app.
- **Mapping Library:** Mapbox GL JS / Google Maps SDK.

## 🤖 AI & Logic
- **Backend (New):** Python with **FastAPI** for high-performance API endpoints.
- **Routing Engine:** Google Routes API (Optimize Waypoints) or Mapbox Optimization API.
- **Storytelling:** GPT-4o-mini or Gemini (using Retrieval-Augmented Generation / RAG).
- **Narrations:** ElevenLabs (using the `test_audio.py` logic) or Google Cloud TTS.
- **Data Processing:** LangChain for RAG pipelines.

## 📡 Data Sources & APIs
- **POI Discovery:** OpenStreetMap (OSM) / Foursquare / Google Places.
- **Context Data:** Wikipedia API, Rijksmuseum API for factual grounding.
- **Travel APIs:** Viator, GetYourGuide (In-app ticket booking).

## 🛠️ Tools
- **Frontend Prototype:** HTML/Tailwind CSS/JS (Leaflet).
- **Deployment:** Vercel (Frontend) & Railway/Render (Backend).
- **PWA:** Implementation of Service Workers for "App-like" mobile experience and Geolocation access.

## ⚙️ Key Technical Challenges
- **GPS Geofencing:** Accurate trigger points for audio without excessive battery drain.
- **TTS Realism:** Ensuring natural-sounding narration that users actually want to listen to.
- **Dynamic Content:** Ensuring factually accurate AI-generated scripts (RAG required).
