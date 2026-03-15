# Implementation Plan: Dynamic Routing Implementation (TRK-001)

## 📋 Steps

### Phase 1: Preparation (🏃 In Progress)
- [x] Create the `conductor` directory structure.
- [x] Update `tech-stack.md` with FastAPI and Python.
- [ ] Research Mapbox Optimization API vs. Google Routes API (cost/usability).

### Phase 2: Backend Integration (⏳ Not Started)
- [ ] Create a minimal FastAPI endpoint (`/route`) in Python.
- [ ] Implement a function to call the Routing API with POIs.
- [ ] Return the optimized path (waypoints and polylines) to the frontend.

### Phase 3: Frontend Update (⏳ Not Started)
- [ ] Add a "Destination Selector" UI component to `citywhisper_prototype.html`.
- [ ] Write the fetch call to the `/route` endpoint.
- [ ] Use Leaflet to clear the old route and draw the new one.

### Phase 4: Validation (⏳ Not Started)
- [ ] Test with at least 3 distinct routes in Mannheim.
- [ ] Verify the "optimized order" actually works (TSP check).

## 🧪 Testing Strategy
- **Manual Verification:** Use the browser to select different POIs and check the route.
- **API Response Check:** Log the JSON response from the backend to ensure data integrity.
