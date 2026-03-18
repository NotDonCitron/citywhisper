# TRK-009: Modularisierung (React, Vite & Capacitor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migration des monolithischen HTML-Prototyps in eine moderne React SPA mit Capacitor-Integration.

**Architecture:** Komponentenbasierte Struktur mit funktionalen Hooks für GPS, Audio und Tour-Logik. Vite dient als Build-Tool, Capacitor ermöglicht den nativen App-Build.

**Tech Stack:** React, Vite, Tailwind CSS, Leaflet, Capacitor (@capacitor/geolocation, @capacitor/preferences).

---

### Task 1: Projekt-Scaffolding & Test-Setup

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
- Create: `src/main.jsx`, `src/App.jsx`, `index.html`
- Create: `vitest.config.js`, `src/setupTests.js`

- [ ] **Step 1: Basis-Dateien manuell anlegen**
    Da das Verzeichnis nicht leer ist, legen wir `package.json` und `vite.config.js` manuell an, um Konflikte zu vermeiden.

- [ ] **Step 2: Abhängigkeiten installieren**
    Run: `npm install leaflet react-leaflet lucide-react @capacitor/core @capacitor/cli @capacitor/geolocation @capacitor/preferences @capacitor-community/background-geolocation`
    Run: `npm install -D tailwindcss postcss autoprefixer vite vitest @testing-library/react @testing-library/jest-dom jsdom`

- [ ] **Step 3: Test-Umgebung konfigurieren**
    `vitest.config.js` erstellen und `src/setupTests.js` mit `import '@testing-library/jest-dom';` befüllen.

- [ ] **Step 4: Commit**
    Run: `git add package.json vite.config.js vitest.config.js tailwind.config.js src/ index.html && git commit -m "chore: initial project scaffolding and testing setup"`

---

### Task 2: Globale State-Verwaltung (Context & activeRoute)

**Files:**
- Create: `src/services/api.js`
- Create: `src/context/TourContext.jsx`
- Test: `src/context/TourContext.test.jsx`

- [ ] **Step 1: TourProvider mit activeRoute State**
    `src/context/TourContext.jsx` um `activeRoute` und `isTourActive` erweitern.

- [ ] **Step 2: Failing Test für State-Updates schreiben**
    Sicherstellen, dass `setSelectedPois` den State korrekt aktualisiert.

- [ ] **Step 3: Commit**
    Run: `git add src/context/TourContext.jsx && git commit -m "feat: implement global state with activeRoute support"`

---

### Task 3: Native Module & Permissions

**Files:**
- Create: `src/native/PermissionManager.js`
- Create: `src/native/BackgroundTracker.js`

- [ ] **Step 1: PermissionManager implementieren**
    Logik zur Abfrage von GPS-Berechtigungen (iOS/Android).

- [ ] **Step 2: BackgroundTracker Setup**
    Integration von `@capacitor-community/background-geolocation` für unterbrechungsfreies Tracking.

- [ ] **Step 3: Commit**
    Run: `git add src/native/ && git commit -m "feat: add native permission management and background tracking"`

---

### Task 4: Map & Tour Cockpit Komponenten

**Files:**
- Create: `src/components/MapContainer.jsx`
- Create: `src/components/TourCockpit.jsx`
- Create: `src/components/AudioHUD.jsx`

- [ ] **Step 1: MapContainer mit Tile-Caching**
    Implementierung von Offline-Support für Leaflet-Tiles.

- [ ] **Step 2: TourCockpit & AudioHUD**
    Migration des "Living Cockpit" und der Audio-Steuerung in React-Komponenten.

- [ ] **Step 3: Commit**
    Run: `git add src/components/ && git commit -m "feat: implement map with caching and tour cockpit components"`

---

### Task 5: useTour & useAudio Hooks

**Files:**
- Create: `src/hooks/useTour.js`
- Create: `src/hooks/useAudio.js`

- [ ] **Step 1: useTour State-Machine**
    Logik für Tour-Phasen (Idle -> Routing -> Active).

- [ ] **Step 2: useAudio mit Filesystem-Caching**
    Nutzung von `@capacitor/filesystem` zum Speichern der Audio-Blobs (TRK-010).

- [ ] **Step 3: Commit**
    Run: `git add src/hooks/ && git commit -m "feat: add useTour and useAudio hooks with persistence"`

---

### Task 6: Mobile Build & Background Modes

- [ ] **Step 1: Capacitor Sync & iOS/Android Setup**
    Run: `npx cap sync`

- [ ] **Step 2: Hintergrund-Modi konfigurieren**
    Anpassung von `Info.plist` (iOS) für `location` und `audio` Background-Modes.
    Anpassung von `AndroidManifest.xml` für Foreground-Services.

- [ ] **Step 3: Commit**
    Run: `git add ios/ android/ && git commit -m "chore: configure native background modes for ios and android"`
