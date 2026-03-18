import React, { useState, useEffect } from 'react';
import { useTour } from '../hooks/useTour';
import { useAudio } from '../hooks/useAudio';
import AudioHUD from './AudioHUD';
import { X, Map as MapIcon, ChevronUp } from 'lucide-react';

const TourCockpit = () => {
  const { 
    isTourActive, 
    activeRoute, 
    userLocation, 
    stopTour,
    selectedPois,
    phase,
    selectedCategories
  } = useTour();

  const {
    isPlaying,
    progress: audioProgress,
    audioStatus,
    playPoiAudio,
    togglePlayback,
    preFetchAll
  } = useAudio();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [nextPoi, setNextPoi] = useState(null);
  const [distance, setDistance] = useState(0);
  const [progress, setProgress] = useState(0);

  // Pre-fetch assets when tour starts (ACTIVE phase)
  useEffect(() => {
    if (phase === 'ACTIVE' && selectedPois.length > 0) {
      const poiIds = selectedPois.map(p => p.id);
      preFetchAll(poiIds, 'insider', selectedCategories);
    }
  }, [phase, selectedPois, selectedCategories, preFetchAll]);

  useEffect(() => {
    if (isTourActive && selectedPois.length > 0) {
      // For now, just take the first selected POI as "next"
      setNextPoi(selectedPois[0]);
    } else {
      setNextPoi(null);
    }
  }, [isTourActive, selectedPois]);

  useEffect(() => {
    if (nextPoi && userLocation) {
      // Simple distance calculation (Haversine or similar would be better)
      const dx = userLocation.lng - nextPoi.lng;
      const dy = userLocation.lat - nextPoi.lat;
      const dist = Math.sqrt(dx * dx + dy * dy) * 111320; // very rough approximation in meters
      setDistance(Math.round(dist));
      
      // Update progress bar based on distance (example logic)
      const maxDist = 500;
      const p = Math.max(0, Math.min(100, (1 - dist / maxDist) * 100));
      setProgress(p);
    }
  }, [nextPoi, userLocation]);

  if (!isTourActive || !nextPoi) return null;

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <div 
      className={`fixed bottom-24 left-4 right-4 z-[500] bg-slate-900/90 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden ${
        isExpanded ? 'bottom-5 max-h-[85vh] p-0' : 'p-5 max-h-[180px]'
      } ${distance < 150 ? 'pulse-active' : ''}`}
      style={{ 
        '--pulse-color': nextPoi.category === 'historian' ? 'var(--cat-history)' : 'var(--cat-architecture)',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {/* Ambient Glow */}
      <div 
        className={`absolute inset-0 z-[-1] opacity-0 transition-opacity duration-1000 ${isExpanded ? 'opacity-100' : ''}`}
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${nextPoi.category === 'historian' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(14, 165, 233, 0.15)'} 0%, transparent 70%)` 
        }}
      />

      {isExpanded && (
        <div 
          className="w-10 h-1 bg-white/20 rounded-full mx-auto my-3 cursor-pointer" 
          onClick={toggleExpand}
        />
      )}

      {isExpanded && (
        <div className="w-full h-60 overflow-hidden bg-slate-800">
          <img 
            src={nextPoi.image || `https://api.placeholder.com/600/400?text=${nextPoi.name}`} 
            alt={nextPoi.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={`${isExpanded ? 'p-6 pt-2' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">
              {isExpanded ? nextPoi.city || 'Mannheim' : 'Nächster Halt'}
            </p>
            <h3 className={`font-bold transition-all duration-500 ${isExpanded ? 'text-3xl' : 'text-xl'}`}>
              {nextPoi.name}
            </h3>
          </div>
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            ~ {distance}m
          </div>
        </div>

        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-sky-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>

        {isExpanded ? (
          <div className="detail-content overflow-y-auto max-h-[40vh]">
            <AudioHUD 
              isPlaying={isPlaying} 
              onTogglePlay={togglePlayback}
              audioStatus={audioStatus}
              progress={audioProgress}
              waveformActive={isPlaying}
            />
            <div className="text-white/70 leading-relaxed font-medium pb-8">
              {nextPoi.description || 'Keine Beschreibung verfügbar.'}
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-1">
            <button 
              onClick={stopTour}
              className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-2xl text-xs font-bold border border-red-500/20 active:scale-95 transition-transform"
            >
              TOUR BEENDEN
            </button>
            <button 
              onClick={toggleExpand}
              className="flex-1 bg-white/5 text-white py-3 rounded-2xl text-xs font-bold border border-white/10 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              DETAILS <ChevronUp size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourCockpit;
