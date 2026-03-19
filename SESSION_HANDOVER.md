# CityWhisper V2 - Session Handover

## Aktueller Status
Das Projekt ist ein funktionsfähiger Prototyp einer KI-gestützten Audiotour-App. Der Fokus der letzten Session lag auf der **"Cinematic Navigation"** für den Demo-Modus.

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Leaflet (Maps).
- **Backend:** FastAPI, Groq (Llama 3.3), edge-tts (Neural Audio), Mapbox (Routing).
- **Infrastruktur:** 
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:8000` (API)
  - `.env` im Root enthält die notwendigen API-Keys.

## Kern-Features (Implementiert)
1. **Non-Stop Demo Walk:** Die Simulation läuft flüssig durch, ohne bei Audio-Wiedergabe zu stoppen.
2. **Cinematic Sync:** Die Laufgeschwindigkeit (5-40 km/h) passt sich dynamisch an die Länge des gesprochenen Guide-Audios an.
3. **Smart Navigation HUD:**
   - Drei Zustände: `EXPANDED` (POI Info), `NAV_HUD` (Schlanke Navigation), `MINIMIZED` (Audio-Strip).
   - Automatisches Minimieren 5s nach Audio-Ende oder bei Entfernung (>50m).
   - Visuelle Abbiegehinweise ("Turn left onto...") direkt im HUD.
   - Richtungs-Pfeil (Bearing) zeigt zum nächsten Abbiegepunkt (nicht nur zum fernen POI).
4. **Auto-Demo Button:** Die "Rakete" oben rechts automatisiert den kompletten Test-Flow (POIs laden -> Route -> Start).

## Wichtige Logik-Dateien
- `src/components/TourCockpit.jsx`: Beinhaltet die komplexe Zustandsmaschine für das HUD und die Navigations-Logik (Index-basiertes Tracking der Abbiegehinweise).
- `src/utils/geo.js`: Zentrale Geofunktionen (`getDistance`, `getBearing`).
- `src/context/TourContext.jsx`: Hält den globalen Tour-Status und berechnet die `routeSteps`.
- `backend/main.py`: API-Endpunkt `/route` liefert Mapbox `steps` und `legs` zurück.

## Bekannte Punkte für den nächsten Agenten
- **Bilder:** Die Bild-Suche via Wikipedia/Unsplash ist implementiert, liefert aber manchmal noch Platzhalter (404-Handling stabilisiert).
- **Audio:** Audio-Context muss im Browser durch Nutzer-Interaktion entsperrt werden (Auto-Demo Button macht das bereits via Silent-Sound).
- **UI:** Das HUD ist funktional, könnte aber noch mehr "Politur" bei den Transitionen vertragen.
