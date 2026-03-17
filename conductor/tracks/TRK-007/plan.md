# Implementation Plan: Preference Selection & Discovery (TRK-007)

## 📋 Steps

### Phase 1: Preference UI & Storage (✅ Completed)
- [x] Design a category selection screen (Modal or Slide-over).
- [x] Add categories to POI data structure (Art, History, Food, etc.).
- [x] Store selected user preferences in IndexedDB.

### Phase 2: Backend Categorization (✅ Completed)
- [x] Add category tags to `CURRENT_POIS` in `backend/main.py`.
- [x] Implement a `/discover` endpoint that returns POIs filtered by category.
- [ ] Integrate categorization into the existing `/pois` and `/poi/{id}/audio` endpoints for persona-preference alignment.

### Phase 3: Interest-Driven Routing (✅ Completed)
- [x] Update `generateRoute` to optionally prioritize POIs of certain categories.
- [x] Visual highlighting of "Matched" POIs on the map.

### Phase 4: Validation (⏳ In Progress)
- [ ] Test the full discovery-to-route flow with different category combinations.
- [x] Verify persistence of preferences.
