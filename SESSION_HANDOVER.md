# CityWhisper Session Handover - 15. März 2026

## 🚀 Aktueller Status
- **Backend:** FastAPI (Python 3.11+) läuft stabil.
- **Frontend:** PWA (HTML/Tailwind/JS/Leaflet) ist installierbar und mobil-optimiert.
- **Deployment:** Live auf Hugging Face Spaces (`PHhTTPS/Citywhisper`).
- **Features:** 
  - Live-GPS mit Geofencing (50m Radius).
  - KI-Inhaltsgenerierung (Groq Llama 3 / Gemini 2.0 Flash Fallback).
  - Audio-Pipeline: gTTS (Google Cloud) für 100% Zuverlässigkeit auf dem Server.
  - Support für Schönau (Odenwald) und Mannheim (City Switcher).

## 🛠️ Technische Details
- **Backend-URL:** Dynamisch (`window.location.origin`).
- **Audio-Cache:** Gespeichert unter `backend/static/audio/` (MP3 + TXT Skripte).
- **Tests:** `pytest` für API-Endpunkte ist eingerichtet (`backend/test_api.py`).

## 🎯 Nächste Mission: TRK-001 (Dynamisches Routing)
- **Ziel:** Weg von Luftlinien-Verbindungen hin zu echten Straßen-Routen.
- **API-Kandidaten:** Mapbox Optimization API oder Google Routes API.
- **Requirement:** Nutzer soll POIs wählen können, Backend berechnet die optimale TSP-Reihenfolge.

## ⚠️ Bekannte "Workarounds"
- ElevenLabs wird im Hugging Face Free Tier wegen IP-Sperren blockiert -> gTTS wird als Standard genutzt.
- Binärdateien (*.mp3, *.png) sind in `.gitignore`, um Hugging Face Git-Limits einzuhalten.
