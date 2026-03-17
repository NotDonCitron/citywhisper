# Tech Stack: CityWhisper

## 🌐 Frontend & Client
- **Web Prototype:** HTML5, CSS3, Vanilla JS (based on current implementation).
- **Styling:** Modern, dark mode with orange/teal accents (Vanilla CSS).
- **Framework (Planned):** React (TypeScript) or Angular for full-featured mobile app.
- **Mapping Library:** **Leaflet.js** with **OpenStreetMap (OSM)** tiles (Free).

## 🤖 AI & Logic
- **Backend (New):** Python with **FastAPI** for high-performance API endpoints.
- **Routing Engine:** **MyRouteOnline API** (Credits-based, no base fee) or custom **OSM-based routing** (Free).
- **Storytelling:** **Gemini 2.0 Flash** (highly efficient/low-cost) or **GPT-4o-mini** (using Retrieval-Augmented Generation / RAG).
- **Narrations:** **edge-tts** (Free, using Microsoft Edge's TTS engine) or Google Cloud TTS (within free tier).
- **Data Processing:** LangChain for RAG pipelines.

## 📡 Data Sources & APIs
- **POI Discovery:** **OpenStreetMap (OSM) / Overpass API** (Free).
- **Context Data:** **Wikipedia API**, **Rijksmuseum API**, **PDOK National Monuments API** (All Free/Open Data).
- **Travel APIs:** Viator, GetYourGuide (Affiliate-based, generates revenue instead of cost).

## 🛠️ Tools
- **Frontend Prototype:** HTML/Tailwind CSS/JS (Leaflet).
- **Deployment:** Vercel (Frontend) & Railway/Render (Backend - using free tiers).
- **PWA:** Implementation of Service Workers for "App-like" mobile experience and Geolocation access.

## 💰 Cost Analysis (0-Cost Strategy)
| Component | Previous Option | 0-Cost Alternative | Savings |
|---|---|---|---|
| **Mapping** | Google Maps / Mapbox | **Leaflet + OSM** | ~ $3,500+ / mo |
| **Routing** | Google Routes / Mapbox | **MyRouteOnline / OSM** | Pay-as-you-go / Free |
| **TTS** | ElevenLabs | **edge-tts** | ~ $5 - $22 / mo |
| **Data** | Google Places | **Overpass API / PDOK** | High usage costs |
| **AI (LLM)** | GPT-4o / Claude 3.5 Sonnet | **Gemini 2.0 Flash** | Significant token costs |

## ⚙️ Key Technical Challenges
- **GPS Geofencing:** Accurate trigger points for audio without excessive battery drain (using native OS APIs).
- **TTS Realism:** Ensuring natural-sounding narration using `edge-tts` or high-quality free voices.
- **Dynamic Content:** Ensuring factually accurate AI-generated scripts (RAG required using Open Data).
