import { useState, useEffect, useRef } from 'react';
import { useTourContext } from '../context/TourContext';
import { getDistance } from '../utils/geo';

/**
 * Hook that tracks live tour statistics:
 * - Total distance walked (metres, accumulated from userLocation changes)
 * - Tour duration (seconds, via interval timer)
 * - POIs visited (unique activeDisplayPoi count)
 * - Steps estimate (distance / 0.7m per step)
 *
 * Resets automatically when the tour stops.
 */
export const useTourStats = () => {
  const { userLocation, isTourActive, activeDisplayPoi } = useTourContext();

  const [distanceWalked, setDistanceWalked] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [visitedPoiIds, setVisitedPoiIds] = useState(new Set());

  const prevLocationRef = useRef(null);
  const timerRef = useRef(null);

  // Start / reset when tour becomes active or inactive
  useEffect(() => {
    if (isTourActive) {
      const now = Date.now();
      setStartTime(now);
      setDistanceWalked(0);
      setVisitedPoiIds(new Set());
      setDuration(0);
      prevLocationRef.current = null;

      // Tick duration every second
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - now) / 1000));
      }, 1000);
    } else {
      // Tour stopped — keep final values, stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTourActive]);

  // Accumulate distance from location changes
  useEffect(() => {
    if (!isTourActive || !userLocation) return;

    if (prevLocationRef.current) {
      const dist = getDistance(prevLocationRef.current, userLocation);
      // Filter out GPS jumps (>100m) and negligible movement (<1m)
      if (dist > 1 && dist < 100) {
        setDistanceWalked((prev) => prev + dist);
      }
    }
    prevLocationRef.current = userLocation;
  }, [userLocation, isTourActive]);

  // Track unique POI visits
  useEffect(() => {
    if (!isTourActive || !activeDisplayPoi) return;

    setVisitedPoiIds((prev) => {
      if (prev.has(activeDisplayPoi.id)) return prev;
      const next = new Set(prev);
      next.add(activeDisplayPoi.id);
      return next;
    });
  }, [activeDisplayPoi, isTourActive]);

  const poisVisited = visitedPoiIds.size;
  const stepsEstimate = Math.round(distanceWalked / 0.7);

  return {
    distanceWalked,
    duration,
    poisVisited,
    stepsEstimate,
    startTime,
  };
};
