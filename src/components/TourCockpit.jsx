import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTour } from '../hooks/useTour';
import { useAudio } from '../hooks/useAudio';
import { useTourContext } from '../context/TourContext';
import { getDistance, getBearing, findNextStep } from '../utils/geo';
import { API_BASE_URL } from '../services/api';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { X, Map as MapIcon, ChevronUp, Navigation, Play, Pause, Maximize2, MapPin } from 'lucide-react';

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
    preFetchAll
  } = useAudio();

  const { 
    activeDisplayPoi, 
    isSimulationActive, 
    setSimSpeed,
    setActiveDisplayPoi,
    routeSteps
  } = useTourContext();

  const [cockpitState, setCockpitState] = useState(CockpitState.NAV_HUD);
  const [lastPlayedPoiId, setLastPlayedPoiId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isArriving, setIsArriving] = useState(false);
  
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
      playPoiAudio(activeDisplayPoi.id, 'insider', selectedCategories);

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
      preFetchAll(poiIds, 'insider', selectedCategories);
    }
  }, [phase, selectedPois, selectedCategories, preFetchAll]);

  // Reset image state when display POI changes
  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [activeDisplayPoi?.id]);

  if (!isTourActive) return null;

  const handleFocusMap = (e) => {
    e.stopPropagation();
    setCockpitState(CockpitState.NAV_HUD);
  };

  const handleToggleExpand = () => {
    setCockpitState(cockpitState === CockpitState.EXPANDED ? CockpitState.NAV_HUD : CockpitState.EXPANDED);
  };

  // Determine display data
  const displayPoi = activeDisplayPoi || nearestPoi;
  if (!displayPoi) return null;

  // Category helper
  const getCategoryInfo = (cat) => {
    const map = {
      historian: { label: 'Geschichte', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      art: { label: 'Kunst', color: '#ec4899', bg: 'rgba(236,72,153,0.2)' },
      architecture: { label: 'Architektur', color: '#0ea5e9', bg: 'rgba(14,165,233,0.2)' },
      subculture: { label: 'Subkultur', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
    };
    return map[cat] || { label: 'Ort', color: '#94a3b8', bg: 'rgba(148,163,184,0.2)' };
  };

  const categoryInfo = getCategoryInfo(displayPoi.category);

  // Split text into lead paragraph and body
  const fullText = currentScript || displayPoi.description || '';
  const splitIndex = fullText.indexOf('\n');
  const leadText = splitIndex > 0 ? fullText.slice(0, splitIndex).trim() : (fullText.length > 120 ? fullText.slice(0, fullText.indexOf('.', 80) + 1) : fullText);
  const bodyText = splitIndex > 0 ? fullText.slice(splitIndex).trim() : (fullText.length > 120 ? fullText.slice(leadText.length).trim() : '');

  // Image source
  const imageSrc = displayPoi.image && typeof displayPoi.image === 'string'
    ? (displayPoi.image.startsWith('http') ? displayPoi.image : `${API_BASE_URL}${displayPoi.image}`)
    : null;

  // Waveform bar heights (deterministic, no random)
  const waveformHeights = useMemo(() =>
    Array.from({ length: 40 }, (_, i) =>
      Math.max(4, Math.sin(i * 0.7) * 12 + Math.cos(i * 0.4) * 6 + 14)
    ), []
  );

  // Extract a callout sentence from body text
  const calloutSentence = useMemo(() => {
    if (!bodyText) return null;
    const sentences = bodyText.split(/(?<=[.!?])\s+/).filter(s => s.length > 30 && s.length < 150);
    return sentences.length > 1 ? sentences[1] : sentences[0] || null;
  }, [bodyText]);

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
        <>
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
        </>
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
          <div className={`detail-content overflow-y-auto max-h-[30vh] custom-scrollbar ${isArriving ? 'morph-reveal morph-reveal-delay-2' : ''}`}>
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
    </div>
  );
};

export default TourCockpit;

