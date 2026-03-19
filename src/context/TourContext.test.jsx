import { renderHook, act } from '@testing-library/react';
import { TourProvider, useTourContext } from './TourContext';
import { describe, it, expect } from 'vitest';
import React from 'react';

describe('TourContext', () => {
  it('should update selectedPois when setSelectedPois is called', () => {
    const wrapper = ({ children }) => <TourProvider>{children}</TourProvider>;
    const { result } = renderHook(() => useTourContext(), { wrapper });

    const newPoi = { id: 1, name: 'Test POI' };

    act(() => {
      result.current.setSelectedPois([newPoi]);
    });

    expect(result.current.selectedPois).toEqual([newPoi]);
  });

  it('should toggle POI selection correctly', () => {
    const wrapper = ({ children }) => <TourProvider>{children}</TourProvider>;
    const { result } = renderHook(() => useTourContext(), { wrapper });

    const poi = { id: 1, name: 'Test POI' };

    act(() => {
      result.current.togglePoiSelection(poi);
    });
    expect(result.current.selectedPois).toEqual([poi]);

    act(() => {
      result.current.togglePoiSelection(poi);
    });
    expect(result.current.selectedPois).toEqual([]);
  });

  it('should update activeRoute and isTourActive when startTour is called', () => {
    const wrapper = ({ children }) => <TourProvider>{children}</TourProvider>;
    const { result } = renderHook(() => useTourContext(), { wrapper });

    const route = { type: 'Feature', geometry: {} };

    act(() => {
      result.current.startTour(route);
    });

    expect(result.current.activeRoute).toEqual(route);
    expect(result.current.isTourActive).toBe(true);
  });
});
