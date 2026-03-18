import React, { createContext, useState, useContext } from 'react';

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

  const startTour = (route) => {
    setActiveRoute(route);
    setIsTourActive(true);
  };

  const stopTour = () => {
    setActiveRoute(null);
    setIsTourActive(false);
  };

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

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
