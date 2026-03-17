# Specification: Preference Selection & Discovery (TRK-007)

## 🎯 Goal
Implement a category-based discovery system that personalizes the POI list based on user interests.

## 📝 Requirements
1. **Preference UI:**
   - A selection screen or modal allowing users to pick categories: `Art`, `History`, `Food`, `Subculture`, `Nature`.
   - Visual feedback for selected categories.
2. **Preference Persistence:**
   - Save selected categories to IndexedDB (Settings).
3. **Dynamic POI Discovery:**
   - Backend logic to filter and categorize existing POIs.
   - Future: Logic to discover new POIs via external APIs (OSM/Google Places) based on tags.
4. **Weighted Routing:**
   - Prioritize selected categories when generating the optimal route if a user has "too many" POIs selected.

## ✅ Success Criteria
- [ ] User can select at least 3 different interest categories.
- [ ] The POI list on the map updates or highlights items matching these categories.
- [ ] Selected preferences persist across app restarts.
