# CityWhisper: Development History & Prototyp-Update
## Umfassende Dokumentation: Von der Basis zum Feldtest (März 2026)

Dieses Dokument bietet eine vollständige Übersicht über die Entwicklung von CityWhisper, basierend auf der Source Control und den abgeschlossenen Tracks (TRK-001 bis TRK-008).

---

## 🏛️ Das Fundament: Abgeschlossene Meilensteine (Tracks)

Vor dem aktuellen Feldtest-Update wurden folgende Kernsysteme eigenständig entwickelt und implementiert:

### 1. KI-Audio-Pipeline & Content-Engine (TRK-002, TRK-003)
*   **Groq/Llama-3 Integration:** Dynamische Generierung von ortsbezogenen Geschichten in Echtzeit.
*   **Neural Voice Engine:** Integration von `edge-tts` mit den Stimmen "Katja" (Insiderin) und "Killian" (Historiker).
*   **Persona-System:** Vollständige Implementierung unterschiedlicher Erzählstile (faktisch-tiefgründig vs. locker-modern).
*   **Wikipedia-Sourcing:** Automatischer Datenabgleich mit der Wikipedia-API für historisch korrekte Fakten.

### 2. Dynamisches Routing & Map-Integration (TRK-001)
*   **Mapbox-Anbindung:** Komplexes System zur Berechnung optimierter Rundwege.
*   **Routen-Animationen:** Entwicklung von 8 verschiedenen visuellen Stilen (Rainbow, Glow, Particle, etc.) für eine ansprechende Wegführung.
*   **Leaflet-Anpassung:** Hochgradig optimierte Dark-Mode Karte mit interaktiven Custom-Markern.

### 3. Progressive Web App (PWA) & Mobile (TRK-004)
*   **Installierbarkeit:** Vollständige `manifest.json` für Android/iOS-Installation.
*   **Service Worker:** Implementierung von Offline-Caching für die App-Hülle und statische Assets.
*   **Live-GPS Tracking:** Basis-Integration der Geolocation API für die Standpunktanzeige.

### 4. Bild-Discovery & Caching-Infrastruktur (TRK-005)
*   **Multi-Source Search:** Automatisierte Bildsuche über Unsplash- und Wikipedia-Rest-APIs.
*   **Image Proxy:** Eigener Server-Endpunkt zur Umgehung von CORS-Problemen und OpaqueResponseBlocking.
*   **Local Cache:** Intelligentes Speichersystem (`cache.json`), das Bilder auf dem Server vorhält und Bandbreite spart.

### 5. Offline-Modus & Daten-Sync (TRK-006)
*   **IndexedDB Integration:** Persistente Speicherung von Nutzerpräferenzen und generierten Routen direkt im Browser.
*   **Stadt-Download-Manager:** Funktion zum Vorab-Laden kompletter Datensätze (Mannheim/Schönau) für die Nutzung ohne Internet.

---

## 🚀 Aktuelles Update: Ready for Feldtest (TRK-008)

Heute wurden folgende "Hardening"-Maßnahmen durchgeführt, um den Prototypen für das Team auf der Straße einsatzbereit zu machen:

### 1. Smart-GPS Start & Simulation
*   **Dynamischer Startpunkt:** Routen starten nun exakt an der GPS-Position des Nutzers.
*   **GPS-Mocking:** Integrierter Simulator ("Simuliere Mannheim") für Remote-Tests und Debugging.
*   **Smart Start Overlay:** Löst Browser-Sperren für Audio durch eine explizite Start-Geste auf.

### 2. Intelligente Tour-Logik
*   **Nearest-Neighbor Sortierung:** Automatischer Fallback-Algorithmus, falls die Mapbox-Optimierung fehlschlägt (garantiert immer eine Route).
*   **Echtzeit-Nummerierung:** Marker auf der Karte zeigen live die Stopp-Reihenfolge (1, 2, 3...) der aktiven Tour.
*   **Pre-fetching:** Automatisches Vorladen aller Audio-Inhalte beim Tourstart zur Überbrückung von Funklöchern.

### 3. Active Tour Cockpit (Hybrid-UI)
*   **Feldtest-Oberfläche:** Neues Overlay-Element mit Distanzanzeige, Zielname und Fortschrittsbalken.
*   **Optimierte UX:** Unterstützung für "Handy in der Tasche" durch automatische Geofence-Trigger (50m Radius).

---
**Status:** Alle Systeme (Backend & Frontend) sind synchronisiert und auf Port 7861 einsatzbereit.
**Source Control:** Alle Tracks von 001-007 sind finalisiert; TRK-008 ist im Release-Zustand.
