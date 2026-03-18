# UX Improvements: Discover & GPS

**Objective:** Enhancing the discovery workflow and ensuring accurate tour starting points.

## Changes

### 1. Discovery UI (Toggles & Feedback)
- Modify `renderDiscovery()` in `citywhisper_prototype.html`:
    - Tapping a POI in discovery now toggles its selection state instead of just adding it.
    - Selected POIs get a visual "highlight" (blue border/background).
    - Button icon changes from `➕` to `✅` when selected.
- Update `discoveryModal` footer:
    - Add "Tour mit Auswahl starten" button.
    - Rename "Alle hinzufügen" to "Alle Ergebnisse hinzufügen".

### 2. GPS Start Location
- Update `generateRoute()` in `citywhisper_prototype.html`:
    - Attempt to fetch current user coordinates via Geolocation API.
    - Send these coordinates as `start_location` to the backend `/route` endpoint.
    - Ensure the route calculation logically begins where the user is currently standing.

## Verification
- Open "Discover" tab, select/deselect POIs, verify visual feedback.
- Click "Tour mit Auswahl starten", verify the route starts at current location (use DevTools Sensors to simulate).
