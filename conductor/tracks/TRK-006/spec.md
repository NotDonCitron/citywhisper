# Specification: Offline Mode & Data Sync (TRK-006)

## 🎯 Goal
Enable the app to function fully offline after a tour has been "downloaded."

## 📝 Requirements
1. **Audio & Image Prefetching:**
   - Mechanism to download all audio files and images for a selected route.
2. **Offline Map Support:**
   - Use Service Worker to cache map tiles (CartoDB Dark Matter).
3. **Data Persistence:**
   - Use IndexedDB to store POI data, route information, and user settings (Persona, City).
4. **Offline UI State:**
   - Clear indicators (Green/Red dots) for Online/Offline status.
   - Graceful handling of API failures when offline.

## ✅ Success Criteria
- [x] User can click "Download Tour" and see progress.
- [x] App works in Airplane Mode (Map, Audio, POI info, Last Route).
- [x] Stored data (Persona, City) survives app restarts.
