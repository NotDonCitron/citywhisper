import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { BackgroundTracker } from '../native/BackgroundTracker';
import { api } from '../services/api';
import { useSimulation } from '../hooks/useSimulation';
import { triggerArrivalHaptics, playArrivalSound } from '../utils/arrivalEffects';
import { showToast } from '../components/ToastContainer';

const TourContext = createContext();

export const TourProvider = ({ children }) => {
  const [pois, setPois] = useState([]);
  const [selectedPois, setSelectedPois] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cw_categories') || '[]'); } catch { return []; }
  });
  const [persona, setPersona] = useState(() => localStorage.getItem('cw_persona') || 'insider');
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [simSpeed, setSimSpeed] = useState(20); // Dynamic speed in km/h

  // --- Non-Stop Demo Walk: activeDisplayPoi ---
  // This is the POI whose content (audio/text/image) is currently shown in the cockpit.
  // It changes ONLY when the simulation reaches a new POI, not based on geographic proximity.
  const [activeDisplayPoi, setActiveDisplayPoi] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);

  // Callback fired by useSimulation when the sim-point arrives at a POI (25m radius)
  const handlePoiReached = useCallback((poi) => {
    console.log(`[TourContext] POI reached: ${poi.name}`);
    triggerArrivalHaptics();
    playArrivalSound();
    setActiveDisplayPoi(poi);
  }, []);

  // Initialize Simulation
  const onSimulationUpdate = useCallback((pos) => {
    setUserLocation(pos);
  }, []);

  const { startSimulation, stopSimulation, pauseSimulation } = useSimulation(
    activeRoute,
    onSimulationUpdate,
    { speedKmH: simSpeed, pois: selectedPois, onPoiReached: handlePoiReached }
  );

  // Fetch POIs on mount
  useEffect(() => {
    const loadPois = async () => {
      try {
        const data = await api.fetchPois();
        setPois(data);
      } catch (err) {
        console.error("Failed to load initial POIs:", err);
        showToast("POIs konnten nicht geladen werden. Ist das Backend erreichbar?");
      }
    };
    loadPois();
  }, []);

  const togglePoiSelection = (poi) => {
    setSelectedPois((prevSelected) => {
      const isAlreadySelected = prevSelected.some((p) => p.id === poi.id);
      if (isAlreadySelected) {
        return prevSelected.filter((p) => p.id !== poi.id);
      } else {
        return [...prevSelected, poi];
      }
    });
  };

  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      const next = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      localStorage.setItem('cw_categories', JSON.stringify(next));
      return next;
    });
  };

  const changePersona = (p) => {
    setPersona(p);
    localStorage.setItem('cw_persona', p);
  };

  const startTour = useCallback(async (route, useSimulationMode = false) => {
    console.log("[TourContext] startTour called with route:", route);
    setActiveRoute(route);
    setIsTourActive(true);
    // Reset display POI for new tour
    setActiveDisplayPoi(null);

    // Flatten all steps from all legs for turn-by-turn navigation
    if (route && route.legs) {
      console.log(`[TourContext] Found ${route.legs.length} legs in route.`);
      const allSteps = route.legs.flatMap(leg => leg.steps || []);
      setRouteSteps(allSteps);
      console.log(`[TourContext] Loaded ${allSteps.length} route steps for navigation.`);
    } else {
      console.warn("[TourContext] No legs found in route object!");
      setRouteSteps([]);
    }
    
    if (useSimulationMode) {
      setIsSimulationActive(true);
      startSimulation();
    } else {
      setIsSimulationActive(false);
      // Automatically start background tracking when real tour starts
      try {
        await BackgroundTracker.startTracking((location) => {
          setUserLocation(location);
        });
      } catch (err) {
        console.error("Failed to start background tracking on tour start:", err);
      }
    }
  }, [startSimulation]);

  const stopTour = useCallback(async () => {
    setActiveRoute(null);
    setIsTourActive(false);
    setActiveDisplayPoi(null);
    setRouteSteps([]);
    
    if (isSimulationActive) {
      stopSimulation();
      setIsSimulationActive(false);
    } else {
      // Stop background tracking when tour stops
      await BackgroundTracker.stopTracking();
    }
  }, [isSimulationActive, stopSimulation]);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      BackgroundTracker.stopTracking();
      stopSimulation();
    };
  }, [stopSimulation]);

  const value = React.useMemo(() => ({
    pois,
    setPois,
    selectedPois,
    setSelectedPois,
    togglePoiSelection,
    selectedCategories,
    setSelectedCategories,
    toggleCategory,
    persona,
    changePersona,
    userLocation,
    setUserLocation,
    activeRoute,
    setActiveRoute,
    isTourActive,
    setIsTourActive,
    isSimulationActive,
    setIsSimulationActive,
    pauseSimulation,
    startTour,
    stopTour,
    // Non-Stop Demo Walk
    activeDisplayPoi,
    setActiveDisplayPoi,
    simSpeed,
    setSimSpeed,
    // Turn-by-turn navigation steps
    routeSteps,
  }), [
    pois,
    selectedPois,
    selectedCategories,
    persona,
    userLocation,
    activeRoute,
    isTourActive,
    isSimulationActive,
    pauseSimulation,
    startTour,
    stopTour,
    activeDisplayPoi,
    simSpeed,
    routeSteps,
  ]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
};
