import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useTourContext } from '../context/TourContext';

export const TourPhases = {
  IDLE: 'IDLE',
  ROUTING: 'ROUTING',
  ACTIVE: 'ACTIVE'
};

/**
 * useTour Hook
 * 
 * Manages the tour state machine and persistence.
 */
export const useTour = () => {
  const context = useTourContext();
  const [phase, setPhase] = useState(TourPhases.IDLE);

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

  return {
    ...context,
    phase,
    startRouting,
    startActive,
    stopTour
  };
};
