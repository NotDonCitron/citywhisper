import { useState, useEffect, useCallback, useMemo } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { useTourContext } from '../context/TourContext';
import { getDistance } from '../utils/geo';

export const TourPhases = {
  IDLE: 'IDLE',
  ROUTING: 'ROUTING',
  ACTIVE: 'ACTIVE'
};

const GEOFENCE_RADIUS = 50; // meters

/**
 * useTour Hook
 * 
 * Manages the tour state machine and persistence.
 */
export const useTour = () => {
  const context = useTourContext();
  const [phase, setPhase] = useState(TourPhases.IDLE);
  const [lastTriggeredPoiId, setLastTriggeredPoiId] = useState(null);

  // Load saved phase on mount
  useEffect(() => {
    const loadPhase = async () => {
      const { value } = await Preferences.get({ key: 'tour_phase' });
      if (value && Object.values(TourPhases).includes(value)) {
        setPhase(value);
        // Sync context if needed
        if (value === TourPhases.ACTIVE) {
          context.setIsTourActive(true);
        }
      }
    };
    loadPhase();
  }, [context]);

  // Monitor location for POI triggers
  useEffect(() => {
    if (context.isTourActive && context.userLocation && context.selectedPois.length > 0) {
      const userPos = {
        lat: context.userLocation.lat,
        lng: context.userLocation.lng
      };

      for (const poi of context.selectedPois) {
        const dist = getDistance(userPos, { lat: poi.lat, lng: poi.lng });
        if (dist < GEOFENCE_RADIUS && lastTriggeredPoiId !== poi.id) {
          setLastTriggeredPoiId(poi.id);
          Haptics.notification({ type: NotificationType.Success });
          console.log(`POI Reached: ${poi.name}. Triggering haptics.`);
          // Note: Audio triggering should be handled by the context or a dedicated effect
        }
      }
    }
  }, [context.isTourActive, context.userLocation, context.selectedPois, lastTriggeredPoiId]);

  // Transition to Routing
  const startRouting = useCallback(async (pois) => {
    context.setSelectedPois(pois);
    setPhase(TourPhases.ROUTING);
    await Preferences.set({ key: 'tour_phase', value: TourPhases.ROUTING });
  }, [context]);

  // Transition to Active
  const startActive = useCallback(async (route) => {
    await context.startTour(route);
    setPhase(TourPhases.ACTIVE);
    await Preferences.set({ key: 'tour_phase', value: TourPhases.ACTIVE });
  }, [context]);

  // Transition back to Idle
  const stopTour = useCallback(async () => {
    await context.stopTour();
    setPhase(TourPhases.IDLE);
    await Preferences.set({ key: 'tour_phase', value: TourPhases.IDLE });
    // Also clear other tour related preferences if necessary
    await Preferences.remove({ key: 'active_route' });
  }, [context]);

  return useMemo(() => ({
    ...context,
    phase,
    startRouting,
    startActive,
    stopTour
  }), [context, phase, startRouting, startActive, stopTour]);
};
