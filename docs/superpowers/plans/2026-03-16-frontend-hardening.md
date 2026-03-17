# Frontend Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementierung eines robusten Offline-Managements und verbessertes visuelles Feedback für die KI-Inhaltsgenerierung im CityWhisper-Frontend.

**Architecture:** Erweiterung des bestehenden Modals um eine Offline-Sektion, Einführung einer zentralen Download-Steuerung mit Progress-Tracking und CSS-basierten Status-Animationen für den Audio-Player.

**Tech Stack:** Vanilla JS, Tailwind CSS (via CDN), IndexedDB, Service Worker (Cache API).

---

## Chunk 1: UI-Infrastruktur & CSS-Animationen

### Task 1: CSS für Pulse-Effekt und Progress-Bar
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: CSS-Klassen hinzufügen**
Füge im `<style>` Bereich folgende Klassen hinzu:
```css
@keyframes pulse-blue {
    0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.7); }
    70% { box-shadow: 0 0 0 15px rgba(14, 165, 233, 0); }
    100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
}
.pulse-blue {
    animation: pulse-blue 2s infinite;
    border-color: #0ea5e9 !important;
}
.download-progress-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 12px;
    margin-top: 10px;
}
```

- [ ] **Step 2: Visuelle Prüfung**
Öffne die Datei im Browser und prüfe (via DevTools), ob die Animation korrekt aussieht, wenn man `.pulse-blue` manuell zum `playPauseBtn` hinzufügt.

- [ ] **Step 3: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: add pulse-blue animation and download UI styles"
```

### Task 2: Offline-Sektion im Preferences-Modal
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: HTML-Struktur im `preferencesModal` ergänzen**
Füge nach dem `categoryGrid` folgenden Bereich ein:
```html
<div class="mt-8 pt-8 border-t border-white/10">
    <h3 class="text-lg font-bold mb-4 flex items-center gap-2">💾 Offline-Daten</h3>
    <div id="storageInfo" class="text-xs opacity-50 mb-4">Speicher wird berechnet...</div>
    <div class="space-y-3" id="downloadControls">
        <div class="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
            <div>
                <div class="font-bold text-sm">Mannheim</div>
                <div class="text-[10px] opacity-40 uppercase" id="status-Mannheim">Bereit</div>
            </div>
            <button onclick="startCityDownload('Mannheim')" id="btn-Mannheim" class="bg-[#0ea5e9]/20 text-[#0ea5e9] px-4 py-2 rounded-xl text-xs font-bold border border-[#0ea5e9]/30">Download</button>
        </div>
        <div class="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
            <div>
                <div class="font-bold text-sm">Schönau</div>
                <div class="text-[10px] opacity-40 uppercase" id="status-Schoenau">Bereit</div>
            </div>
            <button onclick="startCityDownload('Schoenau')" id="btn-Schoenau" class="bg-[#0ea5e9]/20 text-[#0ea5e9] px-4 py-2 rounded-xl text-xs font-bold border border-[#0ea5e9]/30">Download</button>
        </div>
    </div>
    <button onclick="clearOfflineData()" class="w-full mt-4 text-[10px] opacity-30 uppercase font-bold tracking-widest hover:opacity-100 transition-opacity">Alle Offline-Daten löschen</button>
</div>
```

- [ ] **Step 2: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: add offline data section to preferences modal"
```

---

## Chunk 2: Offline-Manager & Download-Logik

### Task 3: Speicherberechnung & City-Status
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Funktion `updateStorageInfo` implementieren**
```javascript
async function updateStorageInfo() {
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = Math.round(estimate.usage / (1024 * 1024));
        document.getElementById('storageInfo').innerText = `Aktuell belegter Speicher: ca. ${usedMB} MB`;
    }
}
```

- [ ] **Step 2: Initialisierung in `loadData` aufrufen**
Rufe `updateStorageInfo()` am Ende von `loadData()` auf.

- [ ] **Step 3: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: implement storage usage display"
```

### Task 4: Download-Manager Logik
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: `startCityDownload` Funktion implementieren**
Die Funktion soll durch alle POIs der Stadt iterieren und `/audio` aufrufen.
```javascript
async function startCityDownload(city) {
    const cityPois = pois.filter(p => p.city === city);
    const btn = document.getElementById(`btn-${city}`);
    const statusText = document.getElementById(`status-${city}`);
    
    btn.disabled = true;
    btn.classList.add('opacity-50');
    
    let count = 0;
    for (const poi of cityPois) {
        count++;
        statusText.innerText = `Lade: ${count}/${cityPois.length} POIs...`;
        try {
            const catParam = selectedCategories.join(',');
            await fetch(`${BACKEND_URL}/poi/${poi.id}/audio?persona=${selectedPersona}&categories=${catParam}`);
        } catch (e) { console.error(`Failed to download ${poi.name}`, e); }
    }
    
    statusText.innerText = "Offline verfügbar";
    btn.innerText = "Aktualisieren";
    btn.disabled = false;
    btn.classList.remove('opacity-50');
    updateStorageInfo();
}
```

- [ ] **Step 2: `clearOfflineData` implementieren**
```javascript
async function clearOfflineData() {
    if (confirm("Möchtest du wirklich alle heruntergeladenen Audios und Bilder löschen?")) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
            await caches.delete(name);
        }
        alert("Speicher geleert.");
        updateStorageInfo();
    }
}
```

- [ ] **Step 3: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: implement city download and cache clear logic"
```

---

## Chunk 3: Audio-Status & Bild-Optimierung

### Task 5: AI-Status Feedback & Animation
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: `openSheet` anpassen**
Ergänze die Logik um die `.pulse-blue` Klasse und das Timeout-Handling.
```javascript
// In openSheet(poi, isManual):
const playBtn = document.getElementById('playPauseBtn');
playBtn.classList.add('pulse-blue');
document.getElementById('audioStatus').innerText = "KI erzählt...";

const timeoutId = setTimeout(() => {
    if (document.getElementById('audioStatus').innerText === "KI erzählt...") {
        document.getElementById('audioStatus').innerText = "Verbindung langsam...";
        playBtn.classList.remove('pulse-blue');
    }
}, 12000);

// Nach erfolgreichem fetch:
clearTimeout(timeoutId);
playBtn.classList.remove('pulse-blue');
```

- [ ] **Step 2: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: add visual feedback for AI generation state"
```

### Task 6: Bild-Priorisierung (Cached > Proxied > Direct)
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: `loadPoiImage` optimieren**
Stelle sicher, dass `cached` und `proxied` bevorzugt werden, um CORS-Probleme zu vermeiden.
```javascript
// loadPoiImage(imgElement, imageData)
// Die Logik ist bereits vorhanden, aber wir stellen sicher, dass sie robust ist:
const tryUrls = [imageData.cached, imageData.proxied, imageData.direct].filter(u => u);
// ... Rest der Funktion bleibt gleich ...
```

- [ ] **Step 2: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "fix: prioritize cached and proxied images in frontend"
```

### Task 7: Verifizierung & Test
- [ ] **Step 1: Manueller Test der Offline-Funktion**
    - Öffne App, gehe in Einstellungen.
    - Klicke auf "Download" für Schönau.
    - Trenne Internetverbindung.
    - Klicke auf einen POI in Schönau.
    - **Erwartet:** Audio spielt ab, Bild wird angezeigt.

- [ ] **Step 2: Finaler Commit & Abschluss**
```bash
git commit -m "docs: finalize frontend hardening implementation"
```
