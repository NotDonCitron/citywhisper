# Active Tour Prototype Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable a reliable, hands-free "Sidewalk Test" in Mannheim with automatic audio triggers and a dedicated tour UI.

**Architecture:** A "Smart Start" layer unlocks the browser's audio context, followed by a hybrid "Cockpit" UI that floats over the map. A dedicated Geofence Manager calculates distances and triggers audio for the next stop in the sequence.

**Tech Stack:** Vanilla JS, Leaflet.js, Web Audio API, Geolocation API, TailwindCSS (existing).

---

## Chunk 1: Infrastructure & Core Logic

### Task 1: Smart Start Overlay & Audio Context Unlock

**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Add Smart Start HTML structure**
Add a full-screen overlay (hidden by default) that appears when a route is generated but not yet "started".

```html
<!-- Insert before </body> -->
<div id="smartStartOverlay" class="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center hidden">
    <div class="text-6xl mb-6">🏙️</div>
    <h2 class="text-3xl font-bold mb-2">Bereit für die Tour?</h2>
    <p id="tourSummaryText" class="text-slate-400 mb-8 max-w-xs">3 Orte in Mannheim • ca. 45 Min Gehzeit</p>
    <button onclick="startActiveTour()" class="w-full max-w-xs bg-sky-500 hover:bg-sky-400 text-white py-5 rounded-3xl font-black text-xl shadow-2xl shadow-sky-500/20 transition-all active:scale-95">
        ▶️ TOUR STARTEN
    </button>
    <div id="gpsWarmupStatus" class="mt-8 flex items-center gap-2 text-sm text-slate-500">
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        GPS wird kalibriert...
    </div>
</div>
```

- [ ] **Step 2: Implement `startActiveTour()` logic**
This function must:
1. Play a short "silent" or "intro" sound to unlock the AudioContext.
2. Hide the overlay.
3. Call `enableFollow()` and start high-accuracy GPS tracking.
4. Set `isTourActive = true`.

- [ ] **Step 3: Test Audio Unlock**
Verify in Chrome DevTools that the `AudioContext` is "running" after the click and that the overlay disappears.

- [ ] **Step 4: Commit**
`git commit -m "feat: add Smart Start overlay and audio unlock logic"`

### Task 2: Geofence Manager & Distance Logic

**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Implement `calculateDistance` (Haversine)**
Add a helper function to calculate the distance between two coordinates in meters.

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const dPhi = (lat2-lat1) * Math.PI/180;
    const dLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(dLambda/2) * Math.sin(dLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
```

- [ ] **Step 2: Update `checkGeofences` for sequential triggers**
Modify the existing logic to only check the distance to the *current* target POI in the route sequence, rather than all POIs.

```javascript
let currentRouteIndex = 0;
let isTourActive = false;

function checkGeofences(uLat, uLng) {
    if (!isTourActive || selectedPoiIds.length === 0) return;
    
    const targetId = selectedPoiIds[currentRouteIndex];
    const poi = pois.find(p => String(p.id) === String(targetId));
    if (!poi) return;

    const dist = calculateDistance(uLat, uLng, poi.lat, poi.lng);
    updateCockpitUI(poi, dist);

    if (dist < GEOFENCE_RADIUS && lastTriggeredPoiId !== poi.id) {
        lastTriggeredPoiId = poi.id;
        openSheet(poi, false);
        currentRouteIndex++; // Advance to next POI
        if (currentRouteIndex >= selectedPoiIds.length) {
            finishTour();
        }
    }
}
```

- [ ] **Step 3: Test sequential triggering**
Simulate a walk using the `startDemoWalk()` or manual coordinate overrides in the console and verify `currentRouteIndex` increments correctly.

- [ ] **Step 4: Commit**
`git commit -m "feat: add Haversine distance and sequential geofence logic"`

---

## Chunk 2: UI & Feedback

### Task 3: Active Tour Cockpit (Hybrid UI)

**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Add Cockpit Card HTML**
Add the floating card that appears only when `isTourActive` is true.

```html
<div id="activeTourCockpit" class="fixed bottom-24 left-4 right-4 z-[500] bg-slate-900/90 backdrop-blur-md p-5 rounded-[32px] border border-white/10 shadow-2xl transition-transform translate-y-full hidden">
    <div class="flex justify-between items-center mb-4">
        <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">Nächster Halt</p>
            <h3 id="cockpitTargetName" class="text-xl font-bold">Wasserturm</h3>
        </div>
        <div id="cockpitDistBadge" class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            ~ 150m
        </div>
    </div>
    <div class="h-1 bg-white/10 rounded-full overflow-hidden">
        <div id="cockpitProgress" class="h-full bg-sky-500 transition-all duration-500" style="width: 0%"></div>
    </div>
    <div class="flex gap-2 mt-5">
        <button onclick="endTour()" class="flex-1 bg-red-500/10 text-red-500 py-3 rounded-2xl text-xs font-bold border border-red-500/20">TOUR BEENDEN</button>
        <button onclick="toggleMapFocus()" class="flex-1 bg-white/5 text-white py-3 rounded-2xl text-xs font-bold border border-white/10">KARTE FIXIEREN</button>
    </div>
</div>
```

- [ ] **Step 2: Implement `updateCockpitUI(poi, dist)`**
Update the cockpit labels and progress bar based on real-time distance.

- [ ] **Step 3: Test UI transitions**
Verify the cockpit slides in when the tour starts and updates its labels correctly as distance changes.

- [ ] **Step 4: Commit**
`git commit -m "feat: implement active tour cockpit UI"`

### Task 4: Debug HUD & Signal Quality

**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Extend Debug Panel with GPS stats**
Add GPS accuracy (in meters) and signal strength indicator to the existing debug panel.

- [ ] **Step 2: Implement accuracy-based color coding**
Show "Signal: Excellent" (Green) if accuracy < 10m, "Poor" (Red) if > 30m.

- [ ] **Step 3: Test in simulated environment**
Use Chrome's "Sensors" tab to vary accuracy and verify the HUD reflects the changes.

- [ ] **Step 4: Commit**
`git commit -m "feat: add GPS accuracy tracking to debug panel"`

---

## Chunk 3: Resilience & Final Polish

### Task 5: Audio Pre-fetching & Offline Resilience

**Files:**
- Modify: `citywhisper_prototype.html`
- Modify: `sw.js`

- [ ] **Step 1: Implement `preFetchTourAssets()`**
When the tour starts, iterate through `selectedPoiIds` and fetch their audio URLs to populate the browser cache.

- [ ] **Step 2: Add "Lost Connection" UI state**
Show a small warning icon if the user goes offline during a tour, but reassure them if assets are cached.

- [ ] **Step 3: Final Integration Test**
Perform a full "Indoor Walkthrough" (simulated) from start to finish.

- [ ] **Step 4: Commit**
`git commit -m "feat: add audio pre-fetching and offline UI feedback"`
