/**
 * Utility for geographic calculations.
 */

/**
 * Calculates the distance between two points in metres using the Haversine formula.
 * @param {Object} p1 - First point {lat, lng}
 * @param {Object} p2 - Second point {lat, lng}
 * @returns {number} Distance in metres
 */
export const getDistance = (p1, p2) => {
  if (!p1 || !p2) return Infinity;
  
  const R = 6371e3; // Earth radius in metres
  const φ1 = p1.lat * Math.PI / 180;
  const φ2 = p2.lat * Math.PI / 180;
  const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
  const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculates the initial compass bearing from point A to point B.
 * @param {Object} from - Start point {lat, lng}
 * @param {Object} to   - End point {lat, lng}
 * @returns {number} Bearing in degrees (0–360), where 0 = North
 */
export const getBearing = (from, to) => {
  if (!from || !to) return 0;

  const φ1 = from.lat * Math.PI / 180;
  const φ2 = to.lat * Math.PI / 180;
  const Δλ = (to.lng - from.lng) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0–360
};

/**
 * Finds the next relevant turn instruction from Mapbox route steps.
 * Skips maneuvers that are behind the user (< 10m away) and "arrive" types.
 * @param {Object} userLocation - {lat, lng}
 * @param {Array} steps - Flattened array of Mapbox step objects with maneuver.location
 * @returns {Object|null} { instruction, distance, location: {lat, lng} } or null
 */
export const findNextStep = (userLocation, steps) => {
  if (!userLocation || !steps || steps.length === 0) return null;

  let best = null;
  let bestDist = Infinity;

  for (const step of steps) {
    if (!step.maneuver || !step.maneuver.location) continue;
    // Skip "arrive" type maneuvers (destination reached)
    if (step.maneuver.type === 'arrive') continue;

    const stepPos = {
      lat: step.maneuver.location[1],
      lng: step.maneuver.location[0]
    };
    const dist = getDistance(userLocation, stepPos);

    // Only consider steps that are ahead (> 10m away) and closer than current best
    if (dist > 10 && dist < bestDist) {
      bestDist = dist;
      best = {
        instruction: (step.maneuver.instruction || '').replace(/\bFahren\b/g, 'Gehen'),
        distance: Math.round(dist),
        location: stepPos
      };
    }
  }

  return best;
};

