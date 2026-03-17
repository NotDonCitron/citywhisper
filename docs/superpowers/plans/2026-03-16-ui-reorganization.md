# UI Reorganization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Umstrukturierung der CityWhisper-UI in ein modernes Mobile-First Layout mit Tab-Bar Navigation und einem kombinierten Dashboard.

**Architecture:** Einführung einer festen `nav-bar` am unteren Rand, einer dezenten `top-bar` für Status-Infos und Umbau der Modals zur Vermeidung von Überlappungen.

**Tech Stack:** Vanilla JS, Tailwind CSS.

---

## Chunk 1: Bottom Navigation & CSS Refactoring

### Task 1: CSS für Bottom Navigation
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: CSS-Klassen für Nav-Bar hinzufügen**
```css
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: rgba(20, 24, 39, 0.85);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 500;
    padding-bottom: env(safe-area-inset-bottom);
}
.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: rgba(255, 255, 255, 0.4);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
}
.nav-item.active {
    color: #0ea5e9;
}
.nav-icon {
    font-size: 20px;
}
```

- [ ] **Step 2: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: add CSS for bottom navigation"
```

### Task 2: HTML-Struktur der Bottom-Nav & Top-Bar
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Nav-Bar & Top-Bar im Body einfügen**
Ersetze die alte Header-Struktur durch:
```html
<!-- Top Bar -->
<div class="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-[100] pointer-events-none">
    <div class="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2">
        <span class="font-bold text-[#0ea5e9]">City</span>Whisper
        <span id="activePersonaBadge" class="ml-1 opacity-50 text-xs">📜</span>
    </div>
    <div id="statusIndicators" class="flex gap-1 pointer-events-auto">
        <span id="offlineIndicator" class="w-2 h-2 rounded-full bg-red-500 hidden animate-pulse"></span>
        <span id="onlineIndicator" class="w-2 h-2 rounded-full bg-green-500"></span>
    </div>
</div>

<!-- Bottom Nav -->
<div class="bottom-nav pointer-events-auto">
    <div class="nav-item active" onclick="switchTab('map')">
        <span class="nav-icon">📍</span>
        <span>Karte</span>
    </div>
    <div class="nav-item" onclick="switchTab('discover')">
        <span class="nav-icon">✨</span>
        <span>Entdecken</span>
    </div>
    <div class="nav-item" onclick="switchTab('tour')">
        <span class="nav-icon">🗺️</span>
        <span>Tour</span>
    </div>
    <div class="nav-item" onclick="switchTab('prefs')">
        <span class="nav-icon">👤</span>
        <span>Profil</span>
    </div>
</div>
```

- [ ] **Step 2: Alte Floating Buttons entfernen**
Entferne `personaSelector`, `prefsBtn`, `discoverBtn` und die alte Header-Div.

- [ ] **Step 3: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: implement bottom nav and top bar structure"
```

---

## Chunk 2: Unified Preferences Modal

### Task 3: Umbau des Preferences-Modals zum Dashboard
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: Modal-Inhalt neu strukturieren**
Das Modal soll nun Sektionen für Persona, Kategorien und Offline-Daten haben.
```html
<div id="preferencesModal" class="app-modal">
    <div class="modal-content !pb-24"> <!-- Extra padding for bottom nav -->
        <div class="sheet-handle mb-4"></div>
        <h2 class="text-2xl font-bold mb-6">Dein Profil 👤</h2>

        <!-- Section 1: Persona -->
        <div class="mb-8">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">Erzähl-Stil</h3>
            <div class="grid grid-cols-2 gap-3">
                <div onclick="selectPersona('historian')" id="p-historian" class="p-4 rounded-2xl border-2 border-white/5 bg-white/5 transition-all cursor-pointer">
                    <div class="text-2xl mb-2">📜</div>
                    <div class="font-bold text-sm">Historiker</div>
                    <div class="text-[10px] opacity-50">Faktisch & Präzise</div>
                </div>
                <div onclick="selectPersona('insider')" id="p-insider" class="p-4 rounded-2xl border-2 border-white/5 bg-white/5 transition-all cursor-pointer">
                    <div class="text-2xl mb-2">🕶️</div>
                    <div class="font-bold text-sm">Insiderin</div>
                    <div class="text-[10px] opacity-50">Locker & Modern</div>
                </div>
            </div>
        </div>

        <!-- Section 2: Kategorien -->
        <div class="mb-8">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">Interessen</h3>
            <div id="categoryGrid" class="grid grid-cols-2 gap-2"></div>
        </div>

        <!-- Section 3: System / Offline -->
        <div class="mb-8">
            <h3 class="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">System & Offline</h3>
            <!-- Hier die bestehende Offline-Sektion einfügen -->
        </div>

        <button onclick="savePreferences()" class="w-full bg-[#0ea5e9] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#0ea5e9]/20">Speichern</button>
    </div>
</div>
```

- [ ] **Step 2: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: redesign preferences modal as a unified dashboard"
```

---

## Chunk 3: Logic Migration & Final Polish

### Task 4: `switchTab` Logik & State Management
**Files:**
- Modify: `citywhisper_prototype.html`

- [ ] **Step 1: `switchTab` Funktion implementieren**
```javascript
function switchTab(tab) {
    // Reset all nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Close all modals
    document.getElementById('discoveryModal').classList.remove('open');
    document.getElementById('preferencesModal').classList.remove('open');
    document.getElementById('routeBuilder').classList.add('hidden');
    document.getElementById('backdrop').classList.remove('open');

    // Activate specific tab
    const items = document.querySelectorAll('.nav-item');
    if (tab === 'map') items[0].classList.add('active');
    if (tab === 'discover') {
        items[1].classList.add('active');
        toggleDiscovery();
    }
    if (tab === 'tour') {
        items[2].classList.add('active');
        toggleRouteBuilder();
    }
    if (tab === 'prefs') {
        items[3].classList.add('active');
        togglePreferences();
    }
}
```

- [ ] **Step 2: Persona UI-Update anpassen**
```javascript
function updatePersonaUI() {
    document.getElementById('p-historian').classList.toggle('border-[#0ea5e9]', selectedPersona === 'historian');
    document.getElementById('p-historian').classList.toggle('bg-[#0ea5e9]/10', selectedPersona === 'historian');
    document.getElementById('p-insider').classList.toggle('border-[#0ea5e9]', selectedPersona === 'insider');
    document.getElementById('p-insider').classList.toggle('bg-[#0ea5e9]/10', selectedPersona === 'insider');
    document.getElementById('activePersonaBadge').innerText = selectedPersona === 'historian' ? '📜' : '🕶️';
}
```

- [ ] **Step 3: Commit**
```bash
git add citywhisper_prototype.html
git commit -m "feat: implement tab switching logic and persona UI updates"
```

### Task 5: Finaler UI Check & Mobile Fixes
- [ ] **Step 1: Padding-Bottom für Bottom-Sheet korrigieren**
Erhöhe das Bottom-Padding im Bottom-Sheet und in den Modals auf `padding-bottom: 90px`, damit sie über der Nav-Bar liegen.

- [ ] **Step 2: Verifizierung**
Prüfe alle Klickwege: Karte -> Entdecken -> Karte -> Tour -> Profil.

- [ ] **Step 3: Commit**
```bash
git commit -m "docs: finalize UI reorganization for CityWhisper 2.0"
```
