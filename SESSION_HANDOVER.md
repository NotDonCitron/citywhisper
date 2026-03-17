# CityWhisper Session Handover - 16. März 2026 (Updated)

## 🚀 Aktueller Status
- **Backend:** FastAPI (Python 3.11+) läuft stabil. Migration von hardcodierten Listen auf **SQLite-Datenbank** abgeschlossen.
- **Frontend:** PWA (HTML/Tailwind/JS/Leaflet) mit Leaflet-Map, Interessen-Management und "Discovery"-Feature.
- **Image System:** Robustes Caching & Discovery (Unsplash/Wikipedia Fallback) implementiert (TRK-005).
- **Offline Mode:** IndexedDB Persistence & Asset Pre-downloading (Audio/Bilder/Maps) aktiv (TRK-006).

## 🛠️ Highlights der letzten Session
- **Datenbank-Migration:**
    - `backend/database.py` erstellt: SQLite-Layer mit Geofencing-Vorbereitung.
    - `backend/migrate_pois.py` ausgeführt: Alle Mannheim- und Schönau-POIs in die DB überführt.
    - `backend/main.py` nutzt nun ausschließlich die DB-Schnittstelle.
- **TRK-007 Abgeschlossen:**
    - **Interessen-Management:** Nutzer können Kategorien (Art, History, etc.) wählen.
    - **Discovery-Feature:** Ein "Entdecken"-Modal schlägt POIs basierend auf Interessen vor.
    - **Personalisierung:** Die KI-Audio-Guides passen ihre Inhalte nun dynamisch an die gewählten Interessen des Nutzers an.
    - **Map-Highlights:** Passende Orte werden auf der Karte optisch hervorgehoben (Sparkle-Effekt).
    - **First-Run Experience:** Automatisches Öffnen der Interessen-Wahl beim ersten Start.

## 🎯 Nächste Mission
- **TRK-008 (Vorschlag):** Gamification & Quests. Nutzer können an Orten Rätsel lösen oder "Sammelgegenstände" finden.
- **Daten-Expansion:** Hinzufügen von POIs für weitere Städte (z.B. Heidelberg oder Amsterdam).
- **Professional Geofencing:** Umstieg auf echte PostGIS-ähnliche Abfragen in SQLite für bessere Performance bei großen Datenmengen.

## ⚠️ Bekannte "Workarounds"
- ElevenLabs wird im Hugging Face Free Tier blockiert -> gTTS wird als Standard genutzt.
- Binärdateien (*.mp3, *.png) sind in `.gitignore`.
