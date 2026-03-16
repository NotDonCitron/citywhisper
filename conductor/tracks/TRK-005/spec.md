# Specification: Automated Image Discovery & Caching (TRK-005)

## 🎯 Goal
Implement a robust image discovery and caching system to handle missing or blocked POI images.

## 📝 Requirements
1. **Multi-Source Discovery:**
   - Integrate Unsplash API as primary/fallback source.
   - Use Wikipedia REST API for authoritative historical images.
2. **Local Caching:**
   - Download and store images in `backend/static/images/`.
   - Use a `cache.json` to map POI IDs to local file paths.
3. **Robust Proxy:**
   - Implement an image proxy to bypass CORS/OpaqueResponseBlocking issues.
   - Add exponential backoff for rate-limited (429) requests.
4. **Frontend Optimization:**
   - Prioritize local cached images.
   - Robustly handle loading errors with fallback to proxy or SVG.

## ✅ Success Criteria
- [x] All 11 Mannheim POIs have high-quality, correct images.
- [x] Images are cached locally on the server.
- [x] No more "OpaqueResponseBlocking" console errors.
- [x] Fallback system works if a source is down or rate-limited.
