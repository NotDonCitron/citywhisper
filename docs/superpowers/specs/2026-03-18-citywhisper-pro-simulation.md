# Design Spec: CityWhisper Pro-Simulation & Visual Polish

**Datum:** 2026-03-18  
**Status:** Approved  
**Track:** TRK-010 (Audio-Caching & Demo-Refinement)

## 1. Vision & Ziele
Dieses Update bringt die Ästhetik des Prototyps in die robuste React-Umgebung und erweitert die App um eine hochpräzise Simulation. Ziel ist es, die Tour am Schreibtisch exakt so zu erleben, wie sie sich am Wochenende im Gehen anfühlen wird.

## 2. Visuelles Upgrade: Hybrid-Icons
Wir implementieren ein dynamisches `L.divIcon` System in `MapContainer.jsx`:

- **Design:**
    - Zentrales Emoji des POI.
    - Weißer Rand (3px) und dynamischer Hintergrund (Sky-500 wenn aktiv, Slate-700 wenn inaktiv).
    - **Stop-Badge:** Eine kleine weiße Badge oben links am Marker mit der Stop-Nummer (1, 2, 3...), wenn der POI Teil der aktiven Tour ist.
    - **Interessen-Highlight:** Ein kleiner Stern ✨ oder oranger Rand für POIs, die zu den gewählten Interessen passen.
- **Animation:**
    - Marker pulsieren sanft (`pulse-active`), wenn der Nutzer weniger als 150m entfernt ist.

## 3. Pro-Demo-Modus (Virtual Walk)
Erweiterung des bestehenden Demo-Modus in `TourContext` und `App.jsx`:

- **Route-Following Logik:**
    - Statt von POI zu POI zu springen, folgt der Demo-Marker exakt den Koordinaten aus `activeRoute.geometry`.
    - Berechnung der Zwischenschritte (Interpolation) für ein flüssiges Gleiten entlang der Wege.
- **Synchronisation:**
    - Der Demo-Modus "geht" mit ca. 5 km/h.
    - Erreicht der Marker den 50m-Radius eines POIs, wird das Audio-Event ausgelöst.
    - Die Geh-Animation pausiert während der Audio-Wiedergabe und setzt danach fort zum nächsten Ziel.

## 4. Intelligentes Caching (@capacitor/filesystem)
Optimierung des `useAudio` Hooks für maximale Robustheit:

- **Dateinamens-Strategie:** `[POI_ID]_[PERSONA]_[CAT_HASH].mp3`.
- **Persistent Storage:** Audio-Dateien werden dauerhaft im `Data` Verzeichnis des Geräts gespeichert und nicht mehr nur temporär vorgehalten.
- **Vorladen:** Sobald "Tour starten" geklickt wird, erfolgt ein paralleler Download aller benötigten Audio-Files.

## 5. Mobile Optimierung (iOS/Android)
- **Haptik:** Vibration des Smartphones bei Erreichen eines Ziels (via Capacitor Haptics Plugin).
- **Audio-Fokus:** Korrekte Handhabung des Audio-Fokus, falls andere Apps Geräusche machen.

## 6. Erfolgskriterien
- Die Icons in der React-App sind visuell identisch zum Prototyp.
- Der Demo-Modus folgt präzise der blauen Route auf der Karte.
- Audio startet automatisch im Demo-Modus bei Annäherung.
- Die App funktioniert komplett offline, wenn die Tour einmal geladen wurde.
