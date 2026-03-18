# Design Spec: Living Cockpit (TRK-010)

## 🎯 Goal
Transform the tour experience from a static map-and-info UI into an immersive, reactive storytelling journey. The "Living Cockpit" should provide clear feedback on arrival and create a seamless transition to the POI story.

## 📐 Architecture & Stages

### 1. Approach Phase (Visual Pulse)
- **Threshold:** Distance to current POI < 150m.
- **Visuals:** The `activeTourCockpit` background pulses slowly (opacity 0.8 -> 1.0).
- **Category Color Mapping:**
    - `History`: `#f59e0b` (Amber)
    - `Art`: `#ec4899` (Pink)
    - `Architecture`: `#0ea5e9` (Sky)
    - `Subculture`: `#8b5cf6` (Violet)
    - `Default`: `#334155` (Slate)
- **Goal:** Build anticipation without being intrusive.

### 2. Arrival Event (The Reveal)
- **Trigger:** Entering the 50m geofence radius.
- **Haptics:** Sequential vibration pattern `[100, 50, 100]`.
- **Audio Signaling:** Play a synthetic beep (using `Web Audio API`) if `arrival.mp3` is not found.
- **Map Interaction:** 
    - Smooth pan to POI coordinates.
    - Zoom-in to level 18.
- **Morphing (CSS Transitions):** 
    - **Container:** Height `120px` -> `80vh`, border-radius `32px` -> `32px 32px 0 0`.
    - **Title (poiName):** Move from center-left to top-center of the sheet, font-size `18px` -> `28px`.
    - **Distance Badge:** Fade-out during the morph.

### 3. Presentation Phase (Immersion)
- **Asset Loading:** 
    - The POI image uses a CSS `filter: blur(10px) -> blur(0px)` and `opacity: 0 -> 1` transition.
    - **Text Animation:** The script text fades in **line-by-word** (CSS `line-height` transition or simple opacity fade per paragraph).
- **Ambient Lighting:**
    - A large, subtle radial gradient (Glow) is injected behind the text content, matching the category color defined in Section 1.
- **Audio Delivery:**
    - Audio starts with a 500ms fade-in.
    - The playback button shows a "Waveform" animation while active.

## 🛠️ Technical Requirements
- **Web APIs:** `navigator.vibrate`, `AudioContext` (for fade-in/out), Leaflet `flyTo`.
- **CSS:** Tailwind transition classes, Custom Keyframe Animations for pulsing.
- **State Management:** New state `arrivalAnimationActive` to prevent double triggers during the morph.

## ✅ Success Criteria
- User receives tactile feedback exactly when entering the radius.
- The UI transition from "Mini-Cockpit" to "Full-Sheet" is fluid (< 600ms).
- The map zoom doesn't feel jerky (use `flyTo` with ease-in-out).
