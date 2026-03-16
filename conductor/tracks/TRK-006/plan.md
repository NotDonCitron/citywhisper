# Implementation Plan: Offline Mode & Data Sync (TRK-006)

## 📋 Steps

### Phase 1: Storage Layer (✅ Completed)
- [x] Implement IndexedDB storage for POIs and Routes.
- [x] Create `backend/static/js/db.js` for database abstraction.
- [x] Integrate persistence into `loadData`, `selectPersona`, `gotoCity`, and `generateRoute`.

### Phase 2: Assets Pre-download (✅ Completed)
- [x] Create a "Download Tour" UI button in Route Builder.
- [x] Implement `downloadTour()` function using `CacheStorage API`.
- [x] Fetch and cache all POI audio and images for the selected route.

### Phase 3: Offline Map Caching (✅ Completed)
- [x] Update `sw.js` with Cache-First strategies for static assets and map tiles.
- [x] Implement specific caching for CartoDB dark matter tiles.
- [x] Handle API fallbacks in the service worker.

### Phase 4: UI Updates & Verification (✅ Completed)
- [x] Add online/offline status indicators.
- [x] Verify data persistence across page reloads.
- [x] Test Offline capability for selected routes.
