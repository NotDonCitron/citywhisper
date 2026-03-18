# Design Specification: Active Tour Prototype

**Date:** 2026-03-17
**Status:** Approved
**Topic:** Hardening the CityWhisper prototype for real-life testing in Mannheim.

## 1. Objective
Enable a "Sidewalk Test" in Mannheim where a team can walk a pre-defined route, receive audio triggers automatically via GPS, and maintain orientation through a dedicated "Active Tour" UI.

## 2. Architecture Overview
The system bridges the gap between a static map and an interactive walking guide.

### 2.1 Frontend Components
- **Smart Start Overlay:** A full-screen welcome overlay that requires a user click to "Start Tour". This unlocks the browser's `AudioContext` and initiates high-accuracy GPS tracking.
- **Active Tour Cockpit (Hybrid View):** A floating card over the Leaflet map showing:
    - Current destination (Next POI).
    - Real-time distance to target.
    - Audio playback status and manual controls.
    - "End Tour" button to return to free-roam mode.
- **Debug HUD:** A toggleable technical overlay for testers to see GPS precision (in meters), current coordinates, and geofence state.

### 2.2 Technical Logic
- **Geofence Manager:**
    - Uses the Haversine formula for distance calculation.
    - Trigger Radius: 50 meters (default, adjustable in debug).
    - Logic: Only triggers audio for the *next* POI in the active route sequence.
- **Audio Management:**
    - **Initial Gesture:** The "Start" button plays a short greeting (e.g., "Hi, I'm your guide...").
    - **Pre-fetching:** When a tour starts, the app attempts to pre-fetch the audio files for all POIs in the route to ensure offline reliability.
    - **Visibility API:** Detects if the app goes to the background and logs state to ensure tracking continues.

## 3. Data Flow
1. **Selection:** User picks 2-12 POIs and generates a route.
2. **Activation:** User clicks "Start Tour". Intro audio plays, GPS `watchPosition` begins.
3. **Tracking:** App calculates distance to POI #1. Map follows user.
4. **Trigger:** Distance < 50m. POI #1 audio plays. Cockpit updates to POI #2.
5. **Completion:** Last POI reached. Final "Thank You" audio. Show feedback screen.

## 4. Testing & Validation
- **GPS Reliability:** Test in "urban canyons" (narrow streets) in Mannheim.
- **Audio Autoplay:** Verify that the "Smart Start" gesture satisfies iOS/Android browser restrictions.
- **Battery Impact:** Monitor discharge rate during a 60-minute walk.
- **Offline Resilience:** Toggle Airplane Mode during a tour to verify pre-fetched audio playback.

## 5. Success Criteria
- [ ] Audio triggers within 10 meters of the intended 50m radius.
- [ ] No manual interaction required after the initial "Start" click.
- [ ] Map remains oriented and follows the user throughout the walk.
- [ ] Debug HUD accurately reflects GPS signal strength.
