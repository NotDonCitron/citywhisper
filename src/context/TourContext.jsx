import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { BackgroundTracker } from '../native/BackgroundTracker';

const TourContext = createContext();

export const TourProvider = ({ children }) => {
  const [pois, setPois] = useState([]);
  const [selectedPois, setSelectedPois] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);

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

  const startTour = useCallback(async (route) => {
    setActiveRoute(route);
    setIsTourActive(true);
    
    // Automatically start background tracking when tour starts
    try {
      await BackgroundTracker.startTracking((location) => {
        setUserLocation(location);
      });
    } catch (err) {
      console.error("Failed to start background tracking on tour start:", err);
    }
  }, []);

  const stopTour = useCallback(async () => {
    setActiveRoute(null);
    setIsTourActive(false);
    
    // Stop background tracking when tour stops
    await BackgroundTracker.stopTracking();
  }, []);

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      BackgroundTracker.stopTracking();
    };
  }, []);

  const value = {
    pois,
    setPois,
    selectedPois,
    setSelectedPois,
    togglePoiSelection,
    userLocation,
    setUserLocation,
    activeRoute,
    setActiveRoute,
    isTourActive,
    setIsTourActive,
    startTour,
    stopTour,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider');
  }
  return context;
};
