import { useState, useEffect, useRef, useCallback } from 'react';
import { getDistance } from '../utils/geo';

/**
 * useSimulation Hook
 *
 * Handles route-following simulation by interpolating between waypoints.
 * Detects when the simulated position reaches a POI and fires onPoiReached
 * WITHOUT stopping or pausing the simulation.
 *
 * Uses adaptive POI detection: computes each POI's closest route approach
 * distance, then triggers when the sim enters that zone after being outside.
 *
 * @param {Object} activeRoute - The GeoJSON route object
 * @param {Function} onUpdate - Callback called with new {lat, lng}
 * @param {Object} options - { speedKmH, updateIntervalMs, pois, onPoiReached }
 */
export const useSimulation = (activeRoute, onUpdate, options = {}) => {
  const {
    speedKmH = 5,
    updateInterval = 100,
    pois = [],
    onPoiReached
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);

  const stateRef = useRef({
    currentIndex: 0,
    currentPos: null,
    routePoints: [],
    lastUpdate: 0
  });

  const timerRef = useRef(null);
  const visitedPoisRef = useRef(new Set());
  const outsidePoisRef = useRef(new Set());
  const poiRadiiRef = useRef({});

  /**
   * Compute per-POI trigger radius based on route geometry.
   * For each POI, find the closest point on the route and set the trigger
   * radius to max(closestDistance + 20m, 50m). This handles POIs in parks
   * or plazas where the road (and route) may be 50-100m from the POI center.
   */
  const computePoiRadii = useCallback((routePoints, poisList) => {
    const radii = {};
    for (const poi of poisList) {
      const poiPos = { lat: poi.lat, lng: poi.lng };
      let minDist = Infinity;
      for (let i = 0; i < routePoints.length; i += 3) {
        const d = getDistance(routePoints[i], poiPos);
        if (d < minDist) minDist = d;
      }
      // Refine around the coarse minimum
      const nearIdx = routePoints.findIndex((_, idx) => idx % 3 === 0 && getDistance(routePoints[idx], poiPos) === minDist);
      if (nearIdx > 0) {
        for (let j = Math.max(0, nearIdx - 3); j <= Math.min(routePoints.length - 1, nearIdx + 3); j++) {
          const d = getDistance(routePoints[j], poiPos);
          if (d < minDist) minDist = d;
        }
      }
      radii[poi.id] = Math.max(Math.round(minDist) + 20, 50);
    }
    return radii;
  }, []);

  // Initialize route points when activeRoute changes
  useEffect(() => {
    if (activeRoute?.geometry?.coordinates) {
      const points = activeRoute.geometry.coordinates.map(c => ({
        lng: c[0],
        lat: c[1]
      }));
      stateRef.current.routePoints = points;
      stateRef.current.currentIndex = 0;

      visitedPoisRef.current = new Set();

      if (pois.length > 0) {
        poiRadiiRef.current = computePoiRadii(points, pois);
      }

      if (points.length > 0) {
        stateRef.current.currentPos = points[0];
        onUpdate(points[0]);

        if (pendingStart) {
          setIsActive(true);
          setIsPaused(false);
          setPendingStart(false);
          outsidePoisRef.current = new Set();
          stateRef.current.lastUpdate = Date.now();
        }
      }
    }
  }, [activeRoute, onUpdate, pendingStart, pois, computePoiRadii]);

  const startSimulation = useCallback(() => {
    if (!stateRef.current.routePoints.length) {
      setPendingStart(true);
      return;
    }
    setIsActive(true);
    setIsPaused(false);
    setPendingStart(false);
    visitedPoisRef.current = new Set();
    outsidePoisRef.current = new Set();
    stateRef.current.lastUpdate = Date.now();
  }, []);

  const stopSimulation = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const pauseSimulation = useCallback((paused = true) => {
    setIsPaused(paused);
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - stateRef.current.lastUpdate) / 1000;
        stateRef.current.lastUpdate = now;

        const speedMS = (speedKmH * 1000) / 3600;
        let distanceToMove = speedMS * deltaTime;

        while (distanceToMove > 0 && stateRef.current.currentIndex < stateRef.current.routePoints.length - 1) {
          const nextPoint = stateRef.current.routePoints[stateRef.current.currentIndex + 1];
          const distToNext = getDistance(stateRef.current.currentPos, nextPoint);

          if (distanceToMove >= distToNext) {
            distanceToMove -= distToNext;
            stateRef.current.currentIndex++;
            stateRef.current.currentPos = nextPoint;
          } else {
            const ratio = distanceToMove / distToNext;
            const newPos = {
              lat: stateRef.current.currentPos.lat + (nextPoint.lat - stateRef.current.currentPos.lat) * ratio,
              lng: stateRef.current.currentPos.lng + (nextPoint.lng - stateRef.current.currentPos.lng) * ratio
            };
            stateRef.current.currentPos = newPos;
            distanceToMove = 0;
          }
        }

        if (stateRef.current.currentIndex >= stateRef.current.routePoints.length - 1) {
          stopSimulation();
        }

        if (stateRef.current.currentPos) {
          onUpdate(stateRef.current.currentPos);

          // --- POI proximity detection (Entry-based with adaptive radius) ---
          // Each POI has its own trigger radius based on the route's closest approach.
          // Only triggers when ENTERING the radius (must have been outside first).
          // This prevents the start-POI from triggering instantly.
          if (pois.length > 0 && onPoiReached) {
            for (const poi of pois) {
              if (visitedPoisRef.current.has(poi.id)) continue;
              const dist = getDistance(stateRef.current.currentPos, { lat: poi.lat, lng: poi.lng });
              const radius = poiRadiiRef.current[poi.id] || 100;
              if (dist >= radius) {
                outsidePoisRef.current.add(poi.id);
              } else if (outsidePoisRef.current.has(poi.id)) {
                visitedPoisRef.current.add(poi.id);
                onPoiReached(poi);
              }
            }
          }
        }
      }, updateInterval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, speedKmH, updateInterval, onUpdate, stopSimulation, pois, onPoiReached]);

  return {
    isActive,
    isPaused,
    startSimulation,
    stopSimulation,
    pauseSimulation
  };
};
