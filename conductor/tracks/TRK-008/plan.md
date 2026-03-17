# Implementation Plan: Core Hardening & Mannheim Deep-Dive (TRK-008)

## 📋 Steps

### Phase 1: Database & Data Quality
- [ ] Verify Mannheim POI migration (`migrate_pois.py`).
- [ ] Implement database unit tests (`backend/test_db.py`).
    - CRUD operations.
    - Haversine distance filtering.
    - Category filtering.

### Phase 2: 0-Cost AI Stack Verification
- [ ] Create `backend/test_ai_pipeline.py`.
    - **Groq Test**: Verify Llama-3.3-70b-versatile returns meaningful scripts.
    - **Edge-TTS Test**: Verify audio files are correctly generated and saved.
    - **Image Proxy Test**: Verify Wikipedia/Unsplash discovery works with the proxy endpoint.

### Phase 3: Integrated API Testing
- [ ] Update `backend/test_api.py`.
    - Test `/pois` and `/discover`.
    - Test `/route` with Mannheim POIs.
    - Test `/poi/{id}/audio` (full pipeline: Groq -> edge-tts).

### Phase 4: Frontend Validation
- [ ] Use `chrome-devtools` to verify the frontend:
    - Loads Mannheim POIs on the Leaflet map.
    - Triggers audio generation correctly.
    - Displays images correctly (proxied/cached).

## 🧪 Testing Strategy
- **pytest**: Run all backend tests.
- **Manual UI Check**: Ensure the "vibe" in Mannheim is correct (correct POIs, good audio quality).
