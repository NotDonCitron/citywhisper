# TRK-010: Pro-Simulation, Hybrid-Icons & Intelligent Caching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visuelles Upgrade der Karte und Implementierung einer präzisen Route-Following Simulation sowie eines robusten Audio-Caching-Systems.

**Architecture:** Erweiterung von `MapContainer` für Hybrid-Icons, Implementierung eines `useSimulation` Hooks für das Route-Following und Optimierung von `useAudio` für persistentes Caching.

**Tech Stack:** React, Leaflet, Capacitor (@capacitor/filesystem, @capacitor/haptics).

---

### Task 1: Hybrid-Icons Visual Upgrade

**Files:**
- Modify: `src/components/MapContainer.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: CSS für neue Marker-Styles hinzufügen**
    `src/index.css` um `custom-marker`, `marker-dot`, `stop-badge` und `pulse-active` ergänzen (basierend auf Prototyp-Styles).

- [ ] **Step 2: MapContainer auf L.divIcon umstellen**
    `src/components/MapContainer.jsx` anpassen, um die komplexen HTML-Marker mit Emojis und Stop-Nummern zu rendern.

- [ ] **Step 3: Puls-Animation bei Annäherung implementieren**
    Logik hinzufügen, die `pulse-active` Klasse setzt, wenn `distance < 150`.

- [ ] **Step 4: Commit**
    Run: `git add src/components/MapContainer.jsx src/index.css && git commit -m "feat: implement hybrid icons with emojis and stop numbers"`

---

### Task 2: Robustes Audio-Caching (@capacitor/filesystem)

**Files:**
- Modify: `src/hooks/useAudio.js`
- Modify: `src/services/api.js`

- [ ] **Step 1: Hash-basierte Dateinamen-Strategie**
    `useAudio.js` anpassen, um `[POI_ID]_[PERSONA]_[CAT_HASH].mp3` als Key zu nutzen.

- [ ] **Step 2: Persistentes Speichern implementieren**
    Sicherstellen, dass Blobs permanent im `Data` Verzeichnis gespeichert werden.

- [ ] **Step 3: Paralleles Vorladen bei Tour-Start**
    `preFetchAll` so optimieren, dass es alle Audio-Dateien der Tour bei "Tour starten" herunterlädt.

- [ ] **Step 4: Commit**
    Run: `git add src/hooks/useAudio.js src/services/api.js && git commit -m "feat: implement persistent audio caching with unique hashes"`

---

### Task 3: Route-Following Simulation (Virtual Walk)

**Files:**
- Create: `src/hooks/useSimulation.js`
- Modify: `src/context/TourContext.jsx`

- [ ] **Step 1: useSimulation Hook implementieren**
    Logik zum Interpolieren zwischen Wegpunkten der `activeRoute.geometry`.

- [ ] **Step 2: Demo-Modus Steuerung**
    Simulation in den `TourContext` integrieren, um `userLocation` flüssig zu überschreiben.

- [ ] **Step 3: Audio-Trigger Synchronisation**
    Pausieren der Bewegung, wenn ein Audio-Trigger (< 50m) ausgelöst wird.

- [ ] **Step 4: Commit**
    Run: `git add src/hooks/useSimulation.js src/context/TourContext.jsx && git commit -m "feat: add pro-simulation with route-following logic"`

---

### Task 4: Haptik & Audio-Fokus (Mobile)

**Files:**
- Modify: `src/hooks/useTour.js`
- Modify: `src/native/BackgroundTracker.js`

- [ ] **Step 1: Capacitor Haptics Integration**
    Vibration bei POI-Ankunft auslösen.

- [ ] **Step 2: Mobile Audio Optimierung**
    Konfiguration der Audio-Session für iOS/Android.

- [ ] **Step 3: Commit**
    Run: `git add src/hooks/useTour.js src/native/ && git commit -m "feat: add haptic feedback and mobile audio optimizations"`
