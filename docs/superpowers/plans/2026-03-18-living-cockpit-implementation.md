# Living Cockpit Implementation Plan (TRK-010)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static tour UI into a reactive, immersive experience that responds to user proximity with animations, haptics, and smooth transitions.

**Architecture:** We use a state-based approach (`arrivalAnimationActive`) to manage transitions. CSS Grid/Flexbox and absolute positioning will be used for the morphing effect, while Leaflet's `flyTo` handles the map immersion.

**Tech Stack:** Tailwind CSS, Vanilla JS, Leaflet.js, Web Audio API, Navigator Vibrate API.

---

### Task 1: Approach Phase (Visual Pulse & Category Colors)

**Files:**
- Modify: `citywhisper_prototype.html` (CSS & Proximity Logic)

- [ ] **Step 1: Add Category Color CSS Variables & Pulse Keyframes**
Add to `<style>`:
```css
:root {
    --cat-history: #f59e0b;
    --cat-art: #ec4899;
    --cat-architecture: #0ea5e9;
    --cat-subculture: #8b5cf6;
    --cat-default: #334155;
}
@keyframes cockpitPulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.02); box-shadow: 0 0 20px var(--pulse-color); }
}
.pulse-active { animation: cockpitPulse 2s infinite ease-in-out; }
```

- [ ] **Step 2: Update `updateCockpitUI` to handle pulsing**
Implement color selection based on `poi.categories[0]` and toggle the `pulse-active` class when `dist < 150`.

- [ ] **Step 3: Verify Visual Pulse**
Run Stress-Test, observe if Cockpit starts pulsing when approaching a POI (150m threshold).

- [ ] **Step 4: Commit**
`git commit -m "feat: add visual pulse and category colors to cockpit"`

---

### Task 2: Arrival Event (Haptics, Sound & Map Zoom)

**Files:**
- Modify: `citywhisper_prototype.html` (JS Logic)

- [ ] **Step 1: Implement Haptic Feedback Utility**
```javascript
function triggerArrivalHaptics() {
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
}
```

- [ ] **Step 2: Implement Synthetic Arrival Sound (Web Audio API)**
Create a `playArrivalSound()` function that generates a clean "sine-wave" beep as a fallback for `arrival.mp3`.

- [ ] **Step 3: Integrate into `checkGeofences`**
Trigger Haptics, Sound, and `map.flyTo([poi.lat, poi.lng], 18)` when `dist < 50`.

- [ ] **Step 4: Verify Arrival Event**
Run Stress-Test, check console for sound triggers and observe map zoom.

- [ ] **Step 5: Commit**
`git commit -m "feat: implement haptics and map zoom on arrival"`

---

### Task 3: Morphing Animation (Cockpit to Full Sheet)

**Files:**
- Modify: `citywhisper_prototype.html` (HTML & CSS)

- [ ] **Step 1: Prep HTML Structure for Morphing**
Ensure `activeTourCockpit` and `bottomSheet` share similar data structures or can transition smoothly. We will animate the `activeTourCockpit` directly to become the sheet.

- [ ] **Step 2: Implement Height and Radius Transition**
Apply `transition: all 0.6s cubic-bezier(0.32, 0.72, 0, 1)` to the cockpit. On arrival, change height to `80vh`.

- [ ] **Step 3: Title & Badge Animation**
Animate the `poiName` font-size and position. Use `transform: translate()` for better performance.

- [ ] **Step 4: Verify Morph**
Run Stress-Test, observe the fluid growth of the cockpit into the detail view.

- [ ] **Step 5: Commit**
`git commit -m "feat: implement morphing animation from cockpit to sheet"`

---

### Task 4: Presentation Polish (Image & Text Fade)

**Files:**
- Modify: `citywhisper_prototype.html` (JS & CSS)

- [ ] **Step 1: Add Image Blur-In Effect**
Add `.blur-in { filter: blur(10px); opacity: 0; transition: all 1s; }` and toggle it when the image loads.

- [ ] **Step 2: Implement Line-by-Line Text Fade**
Wrap script text paragraphs in spans and apply a staggered opacity transition.

- [ ] **Step 3: Implement Audio Fade-In**
Use `audio.volume` and a `setInterval` to ramp up volume from 0 to 1 over 500ms.

- [ ] **Step 4: Final Verification**
Run full tour simulation. Verify that all animations feel synchronized.

- [ ] **Step 5: Commit**
`git commit -m "feat: add final presentation polish and audio fade-in"`
