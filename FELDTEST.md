# CityWhisper — Feldtest-Guide

## Was ist CityWhisper?

CityWhisper ist eine KI-gesteuerte Audio-Tour App. Du gehst durch eine Stadt, und wenn du an einem interessanten Ort vorbeikommst, erzählt dir ein KI-Guide die Geschichte dazu — mit Bild, Text und Sprache. Wie ein persönlicher Stadtführer auf dem Handy.

---

## Features

### Karte mit POIs
- Dunkle Karte mit allen Points of Interest (POIs)
- **Tap auf einen Marker** → zeigt Bild, Beschreibung und Kategorien
- Play-Button zum manuellen Anhören der Audio-Geschichte
- "Zur Tour hinzufügen" direkt aus der Vorschau

### Tour planen
1. POIs auf der Karte antippen und zur Tour hinzufügen
2. Im **Tour-Tab** (unten) die Route konfigurieren:
   - **Rundkurs** — komm zurück zum Startpunkt
   - **A zu B** — Punkt-zu-Punkt Route
3. **Offline vorbereiten** — lädt Audio + Bilder vor dem Losgehen
4. **Demo-Modus** — simuliert einen virtuellen Spaziergang (zum Testen)
5. **Tour starten** — los geht's!

### Während der Tour
- **Navigations-HUD** zeigt Richtung und Entfernung zum nächsten Halt
- **Automatische Erkennung**: Wenn du an einem POI ankommst (~25m), öffnet sich das Cockpit mit Bild, Text und Audio
- **Audio-Crossfade**: Sanfter Übergang zwischen POI-Geschichten
- **Tour beenden** Button im erweiterten Cockpit
- **Tour abgeschlossen!** Screen wenn alle POIs besucht sind

### Profil & Einstellungen
- **Guide-Stil**: Insiderin (locker, modern) oder Historiker (faktisch, präzise)
- **Interessen**: Wähle Kategorien (Geschichte, Kunst, Architektur, Natur...)
- **Karten-Marker**: Schlicht (einheitlich grau) oder Bunt (Farben nach Kategorie)
- **Offline-Download**: Ganze Städte herunterladen für den Offline-Einsatz

### KI-generierte Inhalte
- Jede POI-Geschichte wird live von einer KI erstellt (Claude via AgentRouter)
- Der Text wird an deinen gewählten Guide-Stil angepasst
- Audio wird mit Microsoft Edge TTS generiert (deutsche Stimmen)
- Wikipedia-Fakten fließen automatisch ein

---

## So benutzt du die App am Samstag

### Vorbereitung (Zuhause im WLAN)
1. Öffne die App auf dem Handy: `https://[IP]:5173`
2. Browser fragt nach Standort-Berechtigung → **Erlauben**
3. Geh in **Profil** (👤) und wähle deinen Guide-Stil + Interessen
4. Unter **Offline-Download** → Mannheim herunterladen (dauert ein paar Minuten)

### Tour starten
1. **Karte** (📍) — tippe auf POIs die dich interessieren
2. Jeder Tap zeigt eine Vorschau — drücke **"Zur Tour hinzufügen"**
3. Geh zum **Tour-Tab** (🗺️) — dort siehst du deine gewählten Orte
4. Wähle **Rundkurs** oder **A zu B**
5. Drücke **TOUR STARTEN**

### Unterwegs
- Folge dem Navigations-Pfeil auf dem Display
- An jedem POI (~25m Nähe) spielt automatisch die Audio-Geschichte
- Du kannst jederzeit pausieren oder zum nächsten POI skippen
- Am Ende: "Tour abgeschlossen!" mit Zusammenfassung

### Tipps
- Falls kein Audio kommt: Handy-Lautstärke checken + Stummmodus aus
- GPS braucht manchmal 10-20 Sekunden um genau zu werden
- Die App funktioniert am besten mit eingeschaltetem Display
- Wenn die App im Hintergrund ist, kann GPS ungenau werden

---

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Karte | Leaflet + CartoDB Dark Tiles |
| Backend | Python FastAPI |
| KI-Texte | Claude (via AgentRouter API) |
| Sprache | Microsoft Edge TTS (de-DE) |
| Routing | Mapbox Optimized Trips API |
| Bilder | Wikipedia API + Unsplash |
| Datenbank | SQLite |
| GPS | Web Geolocation API / Capacitor |

---

## Was wir gebaut/gefixt haben (Session-Zusammenfassung)

### Kritische Fixes
- **LAN-Zugriff**: App ist jetzt von allen Handys im WLAN erreichbar (HTTPS + Vite Proxy)
- **GPS auf Handys**: Web-Fallback für Geolocation eingebaut (vorher nur Capacitor-native)
- **POI-Erkennung**: Audio + Text werden jetzt korrekt getriggert wenn man an einem POI vorbeiläuft
- **Audio-Encoding**: UTF-8 Fix für deutsche Umlaute in KI-generierten Texten
- **Markdown-Bereinigung**: TTS liest keine Sterne/Formatierung mehr vor ("Stern Stern" Bug)

### Neue Features
- **POI Preview**: Tap auf Marker → Bottom Sheet mit Bild, Text, manuellem Play
- **Stadtspezifischer Offline-Download**: Im Profil ganze Städte vorladen
- **Marker-Stil Toggle**: Schlicht (grau) oder Bunt (kategorie-farbig)
- **Guide-Stil wählbar**: Insiderin oder Historiker, beeinflusst KI-Text + Stimme
- **Interessen-System**: Kategorien wählen, POIs werden auf der Karte hervorgehoben
- **Tour-Ende Screen**: Belohnung wenn alle POIs besucht sind
- **Toast-Benachrichtigungen**: Feedback bei Aktionen und Fehlern
- **Offline-Vorbereitung**: Audio + Bilder vorladen vor der Tour
- **Tour beenden Button**: Jederzeit zurück zur Karte

### Bug Fixes
- Historiker-Button war ausgegraut → jetzt klickbar
- Interessen gingen beim Neuladen verloren → localStorage
- POI-Farben aktualisierten sich nicht → React.memo entfernt
- Schönau-POIs hatten falsche Koordinaten → entfernt
- Shapely-Import konnte Backend crashen → Lazy Import
- Doppeltes Audio-Laden nach Offline-Vorbereitung → Web-Cache
