import { useState, useEffect, useRef, useCallback } from 'react';
import { getDistance } from '../utils/geo';

/**
 * useSimulation Hook
 * 
 * Handles route-following simulation by interpolating between waypoints.
 * Detects when the simulated position reaches a POI and fires onPoiReached
 * WITHOUT stopping or pausing the simulation.
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
    currentIndex: 0, // Current waypoint index
    currentPos: null, // Current {lat, lng}
    routePoints: [], // All points from geometry
    lastUpdate: 0
  });

  const timerRef = useRef(null);
  const visitedPoisRef = useRef(new Set());

  // POI arrival detection radius in metres
  const POI_ARRIVAL_RADIUS = 25;

  // Initialize route points when activeRoute changes
  useEffect(() => {
    if (activeRoute?.geometry?.coordinates) {
      // Mapbox/GeoJSON uses [lng, lat]
      const points = activeRoute.geometry.coordinates.map(c => ({
        lng: c[0],
        lat: c[1]
      }));
      stateRef.current.routePoints = points;
      stateRef.current.currentIndex = 0;
      
      // Reset visited POIs when route changes
      visitedPoisRef.current = new Set();

      if (points.length > 0) {
        stateRef.current.currentPos = points[0];
        onUpdate(points[0]); // Initial position push
        
        // If a start was requested while points were loading, trigger it now
        if (pendingStart) {
          setIsActive(true);
          setIsPaused(false);
          setPendingStart(false);
          stateRef.current.lastUpdate = Date.now();
        }
      }
    }
  }, [activeRoute, onUpdate, pendingStart]);

  const startSimulation = useCallback(() => {
    if (!stateRef.current.routePoints.length) {
      // Points not ready yet, set a flag to start once they are
      setPendingStart(true);
      return;
    }
    setIsActive(true);
    setIsPaused(false);
    setPendingStart(false);
    visitedPoisRef.current = new Set();
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
        const deltaTime = (now - stateRef.current.lastUpdate) / 1000; // seconds
        stateRef.current.lastUpdate = now;

        const speedMS = (speedKmH * 1000) / 3600;
        let distanceToMove = speedMS * deltaTime;

        while (distanceToMove > 0 && stateRef.current.currentIndex < stateRef.current.routePoints.length - 1) {
          const nextPoint = stateRef.current.routePoints[stateRef.current.currentIndex + 1];
          const distToNext = getDistance(stateRef.current.currentPos, nextPoint);

          if (distanceToMove >= distToNext) {
            // Move to next waypoint
            distanceToMove -= distToNext;
            stateRef.current.currentIndex++;
            stateRef.current.currentPos = nextPoint;
          } else {
            // Interpolate towards next waypoint
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

          // --- POI proximity detection (Non-Stop) ---
          // Check if we've arrived at any POI, fire callback, but NEVER stop.
          if (pois.length > 0 && onPoiReached) {
            for (const poi of pois) {
              if (!visitedPoisRef.current.has(poi.id)) {
                const dist = getDistance(stateRef.current.currentPos, { lat: poi.lat, lng: poi.lng });
                if (dist < POI_ARRIVAL_RADIUS) {
                  visitedPoisRef.current.add(poi.id);
                  onPoiReached(poi);
                }
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
