# Design Spec: CityWhisper 2.0 (React, Vite & Capacitor)

**Datum:** 2026-03-18  
**Status:** Approved  
**Track:** TRK-009 (Modularisierung)

## 1. Vision & Ziele
Die aktuelle 2700-zeilige `citywhisper_prototype.html` wird in eine moderne, modulare **React Single Page Application (SPA)** überführt. Ziel ist maximale Wartbarkeit, bessere Performance und die Vorbereitung auf native iOS- und Android-Apps via **Capacitor**.

## 2. Technischer Stack
- **Frontend Framework:** React (Vite-basiert)
- **Styling:** Tailwind CSS (nativ integriert, kein CDN mehr)
- **Karte:** Leaflet (identisch zum Prototyp, aber als React-Komponente isoliert)
- **Mobile Bridge:** Capacitor (@capacitor/core, @capacitor/ios, @capacitor/android)
- **Backend:** Bestehendes FastAPI-System (bleibt unverändert)

## 3. Architektur & Modul-Struktur
Wir teilen den monolithischen Code in funktionale Einheiten auf:

### 3.1 Komponenten (`/src/components`)
- `MapContainer`: Reines Karten-Rendering (Leaflet). Empfängt Marker-Daten und User-Position als Props.
- `DiscoveryOverlay`: Das "Entdecken"-System (Filter, POI-Vorschläge).
- `ProfileOverlay`: Einstellungen für Persona, Kategorien und Offline-Daten.
- `TourCockpit`: Das interaktive "Living Cockpit" für die aktive Tour.
- `AudioHUD`: Steuerung für Ton und Auto-Play.

### 3.2 Logik-Hooks (`/src/hooks`)
- `useGPS`: Kapselt das Tracking (Capacitor Geolocation Plugin). Bietet `position`, `heading` und `speed`.
- `useAudio`: Zentrale Steuerung für `edge-tts` Audio-Elemente, Vorladen (Pre-fetching) und Wiedergabe.
- `useTour`: State-Maschine für den Tour-Status (Idle, Routing, Active).

### 3.3 Services (`/src/services`)
- `api.js`: Kapselt alle `fetch`-Aufrufe zum Backend (`/pois`, `/route`, `/poi/*/audio`).

### 3.4 Native Modules (`/src/native`)
- `PermissionManager`: Zentrales Handling für Standort- und Benachrichtigungs-Berechtigungen (iOS/Android).
- `BackgroundTracker`: Steuerung des `@capacitor-community/background-geolocation` Plugins für unterbrechungsfreies Tracking.

## 4. Datenfluss & Optimierung
- **Global State:** Wir nutzen React Context oder ein einfaches State-Management für:
    - `userLocation`: Aktuelle Koordinaten (optimiert mit Throttle/Memoization für flüssige Karten-Updates).
    - `selectedPois`: Liste der für die Tour gewählten Orte.
    - `activeRoute`: Die vom Backend berechnete Geometrie.
- **Persistence:** Benutzereinstellungen (Interessen, Persona) werden via `Capacitor Preferences` (oder LocalStorage) dauerhaft gespeichert.

## 5. Capacitor & Native Integration (Mobile)
- **Background Operations:**
    - **GPS:** Nutzung von `@capacitor-community/background-geolocation`, um die Position auch bei gesperrtem Bildschirm zu verfolgen.
    - **Audio:** Konfiguration der `UIBackgroundModes` (iOS) und Foreground Services (Android), damit der Guide nicht verstummt, wenn die App im Hintergrund ist.
- **Offline Capabilities:**
    - **Maps:** Implementierung eines Tile-Caching-Mechanismus für Leaflet, um Basiskarten auch ohne mobile Daten anzuzeigen.
    - **Audio:** TRK-010 (IndexedDB/Filesystem) stellt sicher, dass Audio-Dateien vorab geladen sind.
- **App-Hülle:** Konfiguration von `capacitor.config.json` für den Build auf iOS/Android.
- **Icons/Splash:** Automatische Generierung der nativen Assets über Capacitor-Assets.

## 6. Migrations-Plan (Schritt-für-Schritt)
1. **Scaffolding:** Neues Vite-Projekt initialisieren und Basis-Struktur anlegen.
2. **UI-Portierung:** Übernahme der Tailwind-Styles in React-Komponenten (Modals zuerst).
3. **Karten-Logik:** Migration der Leaflet-Initialisierung und Marker-Verwaltung.
4. **Logic-Split:** Auslagerung der `fetch`-Logik und GPS-Berechnungen in Hooks/Services.
5. **Validation:** Vergleich mit dem alten Prototyp (Funktions-Check).
6. **Capacitor Setup:** Hinzufügen der nativen Plattformen und Test auf dem Smartphone/Simulator.

## 7. Erfolgskriterien
- Die App lädt schneller als der CDN-basierte Prototyp.
- Der Code ist in Dateien unter 300 Zeilen aufgeteilt.
- Die App ist als PWA installierbar und lässt sich als native iOS/Android App bauen.
