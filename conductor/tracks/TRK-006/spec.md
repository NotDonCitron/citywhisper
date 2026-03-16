# Specification: Offline Mode & Data Sync (TRK-006)

## 🎯 Goal
Enable the app to function fully offline after a tour has been "downloaded."

## 📝 Anforderungen
1. **Audio & Image Prefetching:**
   - Mechanism to download all audio files and images for a selected route.
2. **Offline Map Support:**
   - Use Leaflet caching or Mapbox offline tiles to show the map without connection.
3. **Data Persistence:**
   - Use IndexedDB or localStorage to store POI data and route information.
4. **Offline UI State:**
   - Clear indicators for "Offline Ready" status.
   - Graceful handling of API failures when offline.

## ✅ Erfolgskriterien
- [ ] User can click "Download Tour" and see progress.
- [ ] App works in Airplane Mode (Map, Audio, POI info).
- [ ] Stored data survives app restarts.
