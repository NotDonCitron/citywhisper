# Specification: Dynamic Routing Implementation (TRK-001)

## 🎯 Goal
Replace the hardcoded routes in the prototype with a dynamic routing system that calculates the optimal path between user-selected points of interest (POIs) in Mannheim.

## 📝 Requirements
1. **POI Selection:**
   - Add a UI element to select multiple destinations (e.g., Wasserturm, Schloss Mannheim, Jungbusch, Luisenpark).
2. **Routing Integration:**
   - Use Mapbox Optimization API or Google Routes API.
   - Send selected POIs to the backend/API and receive the optimized path.
3. **Visualization:**
   - Render the returned route (Polylines) on the Leaflet map.
   - Display markers for the optimized sequence of stops.

## ✅ Success Criteria
- [x] User can pick 3-4 spots in Mannheim on the map/list.
- [x] Clicking "Generate Route" fetches an optimized path.
- [x] The map updates instantly with the new route.
