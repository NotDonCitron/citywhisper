import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTour } from '../hooks/useTour';
import { useAudio } from '../hooks/useAudio';
import { useTourContext } from '../context/TourContext';
import { getDistance, getBearing, findNextStep } from '../utils/geo';
import { API_BASE_URL } from '../services/api';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { X, Map as MapIcon, ChevronUp, Navigation, Play, Pause, Maximize2, MapPin, Square, Loader2, Trophy, Route, Clock, Footprints } from 'lucide-react';
import { useTourStats } from '../hooks/useTourStats';
import { useAchievements } from '../hooks/useAchievements';

const CockpitState = {
  EXPANDED: 'EXPANDED',
  MINIMIZED: 'MINIMIZED',
  NAV_HUD: 'NAV_HUD'
};

const TourCockpit = () => {
  const { 
    isTourActive, 
    userLocation, 
    stopTour,
    selectedPois,
    phase,
    selectedCategories,
    activeRoute
  } = useTour();

  const {
    isPlaying,
    progress: audioProgress,
    duration: audioDuration,
    audioStatus,
    currentScript,
    playPoiAudio,
    togglePlayback,
    preFetchAll,
    isCaching
  } = useAudio();

  const {
    activeDisplayPoi,
    isSimulationActive,
    setSimSpeed,
    setActiveDisplayPoi,
    routeSteps,
    persona
  } = useTourContext();

  const [cockpitState, setCockpitState] = useState(CockpitState.NAV_HUD);
  const [lastPlayedPoiId, setLastPlayedPoiId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isArriving, setIsArriving] = useState(false);
  const [showTourComplete, setShowTourComplete] = useState(false);

  // Achievements
  const { recordTourComplete } = useAchievements();
  const tourStartTimeRef = useRef(null);

  // Navigation states
  const [nearestPoi, setNearestPoi] = useState(null);
  const [distanceToNearest, setDistanceToNearest] = useState(0);
  const [bearingToNearest, setBearingToNearest] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [nextInstruction, setNextInstruction] = useState(null);
  const prevInstructionRef = useRef(null);
  
  const collapseTimerRef = useRef(null);
  const morphTimerRef = useRef(null);
  const stateRef = useRef({ syncedPoiId: null });

  // Reset step index when a new tour starts or route changes
  useEffect(() => {
    setActiveStepIndex(0);
  }, [activeRoute]);

  // Track tour start time for achievements
  useEffect(() => {
    if (isTourActive && !tourStartTimeRef.current) {
      tourStartTimeRef.current = new Date();
    }
    if (!isTourActive) {
      tourStartTimeRef.current = null;
    }
  }, [isTourActive]);

  // Calculate navigation data (Nearest POI, distance, bearing)
  useEffect(() => {
    if (!userLocation || selectedPois.length === 0) {
      setNearestPoi(null);
      setDistanceToNearest(0);
      return;
    }

    // 1. POI Logic: Find the target POI
    let targetPoi = null;
    if (activeDisplayPoi) {
      const currentIndex = selectedPois.findIndex(p => p.id === activeDisplayPoi.id);
      targetPoi = selectedPois[currentIndex + 1];
    }
    
    if (!targetPoi) {
      let minDist = Infinity;
      for (const poi of selectedPois) {
        const d = getDistance(userLocation, { lat: poi.lat, lng: poi.lng });
        if (d < minDist) {
          minDist = d;
          targetPoi = poi;
        }
      }
    }

    if (targetPoi) {
      const distToPoi = getDistance(userLocation, { lat: targetPoi.lat, lng: targetPoi.lng });
      setNearestPoi(targetPoi);
      setDistanceToNearest(Math.round(distToPoi));

      // 2. Turn-by-Turn Logic (Sequential)
      if (routeSteps && routeSteps.length > 0) {
        const currentStep = routeSteps[activeStepIndex];
        
        if (currentStep && currentStep.maneuver?.location) {
          const stepPos = {
            lat: currentStep.maneuver.location[1],
            lng: currentStep.maneuver.location[0]
          };
          const distToStep = getDistance(userLocation, stepPos);

          // If we are close to a POI (<50m), prioritize POI info
          if (distToPoi < 50) {
            setNextInstruction(null);
            const bearing = getBearing(userLocation, { lat: targetPoi.lat, lng: targetPoi.lng });
            setBearingToNearest(Math.round(bearing));
          } else {
            // Otherwise show current instruction
            setNextInstruction({
              instruction: currentStep.maneuver.instruction,
              distance: Math.round(distToStep),
              location: stepPos
            });
            const bearing = getBearing(userLocation, stepPos);
            setBearingToNearest(Math.round(bearing));

            // ADVANCE LOGIC: If we reach the step point (<15m), move to next instruction
            if (distToStep < 15 && activeStepIndex < routeSteps.length - 1) {
              console.log(`[Navigation] Step ${activeStepIndex} reached. Advancing.`);
              setActiveStepIndex(prev => prev + 1);
            }
          }
        }
      } else {
        // Fallback if no steps: Bearing to POI
        setNextInstruction(null);
        const bearing = getBearing(userLocation, { lat: targetPoi.lat, lng: targetPoi.lng });
        setBearingToNearest(Math.round(bearing));
      }
    }
  }, [userLocation, selectedPois, activeDisplayPoi, routeSteps, activeStepIndex]);

  // Haptic feedback when instruction changes
  useEffect(() => {
    const currentText = nextInstruction?.instruction || null;
    if (currentText && currentText !== prevInstructionRef.current) {
      try {
        Haptics.impact({ style: ImpactStyle.Medium });
      } catch (e) {
        // Haptics not available (e.g. desktop browser)
      }
    }
    prevInstructionRef.current = currentText;
  }, [nextInstruction]);

  // Cinematic Sync: Adjust speed when audio starts
  useEffect(() => {
    if (isPlaying && isSimulationActive && activeDisplayPoi && audioDuration > 0) {
      if (lastPlayedPoiId === activeDisplayPoi.id && stateRef.current.syncedPoiId === activeDisplayPoi.id) {
        return;
      }

      const currentIndex = selectedPois.findIndex(p => p.id === activeDisplayPoi.id);
      const nextPoiInTour = selectedPois[currentIndex + 1];

      if (nextPoiInTour) {
        const distToNext = getDistance(userLocation, { lat: nextPoiInTour.lat, lng: nextPoiInTour.lng });
        const requiredSpeed = (distToNext / audioDuration) * 3.6;
        const clampedSpeed = Math.max(5, Math.min(40, requiredSpeed));
        
        console.log(`[CinematicSync] Syncing speed to ${Math.round(clampedSpeed)} km/h.`);
        setSimSpeed(clampedSpeed);
        stateRef.current.syncedPoiId = activeDisplayPoi.id;
      }
    }
  }, [isPlaying, audioDuration, activeDisplayPoi, selectedPois, isSimulationActive, userLocation, setSimSpeed, lastPlayedPoiId]);

  // Auto-trigger audio + morph-expand when a new POI is reached
  useEffect(() => {
    if (activeDisplayPoi && activeDisplayPoi.id !== lastPlayedPoiId) {
      console.log(`[TourCockpit] POI reached: ${activeDisplayPoi.name} — morphing`);
      setLastPlayedPoiId(activeDisplayPoi.id);
      playPoiAudio(activeDisplayPoi.id, persona, selectedCategories);

      // Clear any pending timers
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);

      // Start morph: set arriving flag, then switch to EXPANDED
      // The flag triggers CSS morph-reveal animations on content
      setIsArriving(true);
      setCockpitState(CockpitState.EXPANDED);

      // Clear arriving flag after morph animation completes (600ms)
      morphTimerRef.current = setTimeout(() => {
        setIsArriving(false);
      }, 650);
    }
  }, [activeDisplayPoi, lastPlayedPoiId, playPoiAudio, selectedCategories]);

  // Auto-collapse logic
  useEffect(() => {
    // If audio ends, start a timer to collapse to NAV_HUD
    if (!isPlaying && cockpitState === CockpitState.EXPANDED && lastPlayedPoiId) {
      collapseTimerRef.current = setTimeout(() => {
        setCockpitState(CockpitState.NAV_HUD);
      }, 5000); // 5 second delay
    }

    // If movement is significant (>50m from reached POI) and audio stopped
    if (!isPlaying && activeDisplayPoi) {
      const dist = getDistance(userLocation, { lat: activeDisplayPoi.lat, lng: activeDisplayPoi.lng });
      if (dist > 50 && cockpitState === CockpitState.EXPANDED) {
        setCockpitState(CockpitState.NAV_HUD);
      }
    }

    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
    };
  }, [isPlaying, cockpitState, userLocation, activeDisplayPoi, lastPlayedPoiId]);

  // Pre-fetch assets
  useEffect(() => {
    if (phase === 'ACTIVE' && selectedPois.length > 0) {
      const poiIds = selectedPois.map(p => p.id);
      preFetchAll(poiIds, persona, selectedCategories);
    }
  }, [phase, selectedPois, selectedCategories, preFetchAll]);

  // Reset image state when display POI changes
  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [activeDisplayPoi?.id]);

  // Tour completion detection: all POIs visited
  useEffect(() => {
    if (!isTourActive || selectedPois.length === 0 || !lastPlayedPoiId) return;
    const lastPoi = selectedPois[selectedPois.length - 1];
    if (lastPlayedPoiId === lastPoi.id && !isPlaying) {
      // Last POI audio finished — show completion after a short delay
      const timer = setTimeout(() => {
        setShowTourComplete(true);

        // Record tour completion for achievements
        const startTime = tourStartTimeRef.current;
        const durationMinutes = startTime
          ? (Date.now() - startTime.getTime()) / 60000
          : null;

        // Estimate distance from route metadata if available
        let distanceKm = 0;
        if (activeRoute && activeRoute.legs) {
          distanceKm = activeRoute.legs.reduce(
            (sum, leg) => sum + (leg.distance || 0), 0
          ) / 1000;
        }

        recordTourComplete({
          poisVisited: selectedPois,
          distanceKm,
          startTime: startTime ? startTime.toISOString() : null,
          durationMinutes: durationMinutes !== null ? Math.round(durationMinutes) : null,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastPlayedPoiId, isPlaying, selectedPois, isTourActive, activeRoute, recordTourComplete]);

  // Determine display data (before hooks that depend on it)
  const displayPoi = activeDisplayPoi || nearestPoi;

  // Strip markdown formatting from script text
  const stripMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/^#{1,6}\s+/gm, '')     // headers
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/\*(.+?)\*/g, '$1')     // italic
      .replace(/_(.+?)_/g, '$1')       // italic alt
      .replace(/`(.+?)`/g, '$1')       // inline code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // links
  };

  // Split text into lead paragraph and body
  const rawText = currentScript || displayPoi?.description || '';
  const fullText = stripMarkdown(rawText);
  const splitIndex = fullText.indexOf('\n');
  const leadText = splitIndex > 0 ? fullText.slice(0, splitIndex).trim() : (fullText.length > 120 ? fullText.slice(0, fullText.indexOf('.', 80) + 1) : fullText);
  const bodyText = splitIndex > 0 ? fullText.slice(splitIndex).trim() : (fullText.length > 120 ? fullText.slice(leadText.length).trim() : '');

  // Waveform bar heights (deterministic, no random) — must be called unconditionally
  const waveformHeights = useMemo(() =>
    Array.from({ length: 40 }, (_, i) =>
      Math.max(4, Math.sin(i * 0.7) * 12 + Math.cos(i * 0.4) * 6 + 14)
    ), []
  );

  // Extract a callout sentence from body text — must be called unconditionally
  const calloutSentence = useMemo(() => {
    if (!bodyText) return null;
    const sentences = bodyText.split(/(?<=[.!?])\s+/).filter(s => s.length > 30 && s.length < 150);
    return sentences.length > 1 ? sentences[1] : sentences[0] || null;
  }, [bodyText]);

  // Tour statistics (distance, duration, POIs visited, steps)
  const { distanceWalked, duration, poisVisited, stepsEstimate } = useTourStats();

  // Format helpers for stats display
  const formatDistance = (metres) => {
    if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
    return `${Math.round(metres)} m`;
  };
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  // Early returns AFTER all hooks
  if (!isTourActive) return null;
  if (!displayPoi) return null;

  const handleFocusMap = (e) => {
    e.stopPropagation();
    setCockpitState(CockpitState.NAV_HUD);
  };

  const handleToggleExpand = () => {
    setCockpitState(cockpitState === CockpitState.EXPANDED ? CockpitState.NAV_HUD : CockpitState.EXPANDED);
  };

  const handleStopTour = () => {
    setShowTourComplete(false);
    stopTour();
  };

  // Category helper
  const getCategoryInfo = (cat) => {
    const key = (cat || '').toLowerCase();
    const map = {
      historian: { label: 'Geschichte', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      history: { label: 'Geschichte', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      art: { label: 'Kunst', color: '#ec4899', bg: 'rgba(236,72,153,0.2)' },
      architecture: { label: 'Architektur', color: '#0ea5e9', bg: 'rgba(14,165,233,0.2)' },
      subculture: { label: 'Subkultur', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
      culture: { label: 'Kultur', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
      nature: { label: 'Natur', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
      religion: { label: 'Religion', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      urban: { label: 'Urban', color: '#64748b', bg: 'rgba(100,116,139,0.2)' },
    };
    return map[key] || { label: cat || 'Ort', color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' };
  };

  const primaryCategory = Array.isArray(displayPoi.categories) ? displayPoi.categories[0] : displayPoi.category;
  const categoryInfo = getCategoryInfo(primaryCategory);

  // Image source — handle both string and object {direct, proxied, cached, fallback}
  const resolveImageSrc = (img) => {
    if (!img) return null;
    if (typeof img === 'string') {
      return img.startsWith('http') ? img : `${API_BASE_URL}${img}`;
    }
    // Object format: try direct → cached → fallback
    const url = img.direct || img.cached || img.fallback;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };
  const imageSrc = resolveImageSrc(displayPoi.image);

  // Format time from progress percentage
  const formatTime = (progressPct, totalDuration) => {
    const secs = Math.floor((progressPct / 100) * totalDuration);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Determine CSS state class
  const stateClass = cockpitState === CockpitState.NAV_HUD
    ? 'cockpit-nav-hud'
    : cockpitState === CockpitState.EXPANDED
      ? 'cockpit-expanded'
      : 'cockpit-minimized';

  // Morph class: applied on arrival transitions for staggered content reveal
  const morphClass = isArriving ? 'morph-reveal' : '';

  // --- UNIFIED RENDERING ---
  return (
    <div
      className={`cockpit-base ${stateClass} cockpit-enter`}
      onClick={cockpitState === CockpitState.NAV_HUD ? () => setCockpitState(CockpitState.EXPANDED) : undefined}
    >
      {/* === NAV_HUD STATE === */}
      {cockpitState === CockpitState.NAV_HUD && (
        <div className="flex flex-col w-full gap-2">
          {/* Navigation row */}
          <div className="flex items-center w-full">
            <div className="bearing-arrow" style={{ transform: `rotate(${bearingToNearest}deg)` }}>
              <Navigation size={24} fill="#0ea5e9" className="text-sky-500" />
            </div>
            <div className="flex-1 ml-4 overflow-hidden">
              {nextInstruction ? (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 leading-none mb-1">Weghinweis</p>
                  <h3 className="font-bold text-white truncate text-sm tracking-tight">
                    {nextInstruction.instruction}
                  </h3>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 leading-none mb-1">Nächster Halt</p>
                  <h3 className="font-bold text-white truncate text-sm uppercase tracking-tight">
                    {nearestPoi?.name || 'Wird berechnet...'}
                  </h3>
                </>
              )}
            </div>
            <div className="bg-sky-500/20 text-sky-400 px-3 py-1.5 rounded-xl text-xs font-black border border-sky-500/30 ml-2">
              {nextInstruction ? `${nextInstruction.distance}m` : `${distanceToNearest}m`}
            </div>
          </div>

          {/* Live stats bar */}
          <div className="flex items-center gap-2 ml-1">
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
              <Route size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40 font-medium">{formatDistance(distanceWalked)}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
              <Clock size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40 font-medium">{formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
              <MapPin size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40 font-medium">{poisVisited}/{selectedPois.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* === EXPANDED STATE (with morph animations on arrival) === */}
      {cockpitState === CockpitState.EXPANDED && (
        <>
          {/* Drag Handle */}
          <div className="poi-drag-handle" onClick={handleToggleExpand} />

          {/* === HERO IMAGE SECTION === */}
          <div className={`poi-hero ${morphClass}`}>
            {/* Loading skeleton */}
            {!imageLoaded && !imageFailed && <div className="poi-hero-skeleton" />}

            {/* Image */}
            {imageSrc && !imageFailed ? (
              <img
                src={imageSrc}
                alt={displayPoi.name}
                className={`poi-hero-image blur-in${imageLoaded ? ' loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${categoryInfo.bg} 0%, #1e293b 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MapPin size={48} style={{ color: categoryInfo.color, opacity: 0.4 }} />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="poi-hero-gradient" />

            {/* Category badge */}
            <div
              className={`poi-category-badge ${isArriving ? 'morph-badge' : ''}`}
              style={{ background: categoryInfo.bg, color: categoryInfo.color }}
            >
              {categoryInfo.label}
            </div>

            {/* Action buttons (top-right) */}
            <div className="poi-hero-actions">
              <button onClick={handleFocusMap} className="poi-hero-action-btn" title="Karte fokussieren">
                <MapIcon size={16} />
              </button>
              <button onClick={handleToggleExpand} className="poi-hero-action-btn" title="Minimieren">
                <X size={16} />
              </button>
            </div>

            {/* Title floating over gradient */}
            <div className="poi-hero-title">
              <div className="poi-kicker-row">
                <div className="poi-kicker">{displayPoi.city || 'Mannheim'}</div>
                <div className="poi-distance-pill">~ {distanceToNearest}m</div>
              </div>
              <h2 className={`poi-name ${isArriving ? 'morph-title' : ''}`}>{displayPoi.name}</h2>
            </div>
          </div>

          {/* === INLINE WAVEFORM BAR === */}
          <div className={`poi-waveform ${isArriving ? 'morph-reveal morph-reveal-delay-1' : ''}`}>
            <button className="play-btn-waveform" onClick={togglePlayback}>
              {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
            </button>
            <div className="waveform-visual">
              {waveformHeights.map((h, i) => {
                const playedPct = (i / waveformHeights.length) * 100;
                return (
                  <div
                    key={i}
                    className={`wv-bar${playedPct < audioProgress ? ' wv-bar-played' : ''}${isPlaying ? ' wv-bar-active' : ''}`}
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.04}s`
                    }}
                  />
                );
              })}
            </div>
            <span className="waveform-time">
              {audioDuration > 0 ? formatTime(audioProgress, audioDuration) : '0:00'}
            </span>
          </div>

          {/* === SCROLLABLE CONTENT === */}
          <div className={`detail-content overflow-y-auto flex-1 custom-scrollbar ${isArriving ? 'morph-reveal morph-reveal-delay-2' : ''}`}>
            <div className="poi-content-area">
              {fullText ? (
                <>
                  {leadText && <p className="poi-lead-text">{leadText}</p>}

                  {/* Callout box */}
                  {calloutSentence && (
                    <div className={`callout-box ${isArriving ? 'morph-reveal morph-reveal-delay-3' : ''}`}>
                      <div className="callout-label">Wusstest du?</div>
                      <div className="callout-text">{calloutSentence}</div>
                    </div>
                  )}

                  {bodyText && (
                    <div className="poi-body-text">
                      {bodyText.split('\n').filter(Boolean).map((line, i) => (
                        <span
                          key={i}
                          className="text-line-fade"
                          style={{ animationDelay: `${500 + i * 120}ms` }}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="poi-lead-text" style={{ opacity: 0.5 }}>Bereite Guide-Informationen vor...</p>
              )}
            </div>
          </div>

          {/* === LOADING INDICATOR === */}
          {isCaching && (
            <div className="flex items-center gap-3 px-6 py-3 bg-sky-500/10 border-t border-sky-500/20">
              <Loader2 size={16} className="text-sky-400 animate-spin" />
              <span className="text-xs font-bold text-sky-400">{audioStatus || 'Lade Audio...'}</span>
            </div>
          )}

          {/* === STOP TOUR BUTTON === */}
          <div className="px-6 py-3 border-t border-white/5">
            <button
              onClick={handleStopTour}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 text-sm font-bold transition-all active:scale-95"
            >
              <Square size={14} /> Tour beenden
            </button>
          </div>
        </>
      )}

      {/* === MINIMIZED STATE === */}
      {cockpitState === CockpitState.MINIMIZED && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">Aktueller Halt</p>
              <h3 className="font-bold text-lg truncate">{displayPoi.name}</h3>
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
              ~ {distanceToNearest}m
            </div>
          </div>

          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-500 rounded-full"
              style={{ width: `${audioProgress}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={togglePlayback} className="p-4 bg-white/5 rounded-2xl text-white">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={handleToggleExpand} className="flex-1 bg-sky-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
              Details <Maximize2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* === TOUR COMPLETE OVERLAY === */}
      {showTourComplete && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center gap-5 z-50 rounded-[inherit] px-6">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <Trophy size={40} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-1">Tour abgeschlossen!</h2>
            <p className="text-sm text-white/50">Hier ist deine Zusammenfassung</p>
          </div>

          {/* Stat cards grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-sky-500/15 flex items-center justify-center">
                <Route size={18} className="text-sky-400" />
              </div>
              <span className="text-lg font-black text-white leading-tight">{formatDistance(distanceWalked)}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Distanz</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Clock size={18} className="text-amber-400" />
              </div>
              <span className="text-lg font-black text-white leading-tight">{formatDuration(duration)}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Dauer</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <MapPin size={18} className="text-emerald-400" />
              </div>
              <span className="text-lg font-black text-white leading-tight">{poisVisited}/{selectedPois.length}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Orte</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center">
                <Footprints size={18} className="text-purple-400" />
              </div>
              <span className="text-lg font-black text-white leading-tight">{stepsEstimate.toLocaleString()}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Schritte</span>
            </div>
          </div>

          <button
            onClick={handleStopTour}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/30 mt-1"
          >
            Zurück zur Karte
          </button>
        </div>
      )}
    </div>
  );
};

export default TourCockpit;

