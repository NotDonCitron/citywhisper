import React, { useState } from 'react';
import { useTourContext } from '../context/TourContext';
import { useAudio } from '../hooks/useAudio';
import { api, API_BASE_URL } from '../services/api';
import { showToast } from './ToastContainer';
import { X, Play, Trash2, Download, CheckCircle, Loader2 } from 'lucide-react';
import tourTemplates from '../data/tourTemplates';

const TourOverlay = ({ isOpen, onClose }) => {
  const { selectedPois, setSelectedPois, togglePoiSelection, startTour, persona, selectedCategories, pois } = useTourContext();
  const { preFetchAll } = useAudio();
  const [loading, setLoading] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [isRoundtrip, setIsRoundtrip] = useState(true);

  // Offline pre-load state
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadTotal, setPreloadTotal] = useState(0);
  const [preloadDone, setPreloadDone] = useState(false);

  if (!isOpen) return null;

  const handlePreload = async () => {
    if (selectedPois.length === 0) return;
    setIsPreloading(true);
    setPreloadDone(false);
    const total = selectedPois.length;
    setPreloadTotal(total);
    setPreloadProgress(0);

    try {
      // 1. Pre-fetch audio sequentially (each needs AI generation + TTS)
      for (let i = 0; i < selectedPois.length; i++) {
        setPreloadProgress(i);
        try {
          const poiId = selectedPois[i].id;
          const catParam = Array.isArray(selectedCategories) ? selectedCategories.join(',') : '';
          await fetch(`${API_BASE_URL}/poi/${poiId}/audio?persona=${persona}&categories=${catParam}`);
        } catch (e) {
          console.warn(`Pre-load audio failed for ${selectedPois[i].name}:`, e);
        }
      }

      // 2. Pre-fetch images (parallel, fast)
      const imagePromises = selectedPois.map(poi => {
        if (poi.image) {
          const src = typeof poi.image === 'string'
            ? poi.image
            : poi.image.cached || poi.image.direct || poi.image.fallback;
          if (src) {
            const url = src.startsWith('http') ? src : `${API_BASE_URL}${src}`;
            return fetch(url).catch(() => {});
          }
        }
        return Promise.resolve();
      });
      await Promise.all(imagePromises);

      setPreloadProgress(total);
      setPreloadDone(true);
      showToast(`${total} POIs offline bereit!`, 'success');
    } catch (err) {
      console.error('Preload failed:', err);
      showToast('Offline-Vorbereitung fehlgeschlagen', 'error');
    } finally {
      setIsPreloading(false);
    }
  };

  const handleStartTour = async () => {
    if (selectedPois.length < 2) {
      showToast("Bitte wähle mindestens 2 Orte für eine Tour aus.");
      return;
    }

    setLoading(true);
    try {
      const poiIds = selectedPois.map(p => p.id);
      const routeData = await api.fetchRoute(poiIds, isRoundtrip);
      await startTour(routeData, useSimulation);
      onClose();
    } catch (err) {
      console.error("Failed to start tour:", err);
      showToast("Fehler beim Berechnen der Route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-md flex flex-col p-6 pointer-events-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Deine Tour <span className="text-sky-500">🗺️</span>
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Route Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setIsRoundtrip(true)}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${isRoundtrip ? 'bg-sky-500/20 border-sky-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            <span className="text-2xl">🔄</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Rundkurs</span>
          </button>
          <button
            onClick={() => setIsRoundtrip(false)}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${!isRoundtrip ? 'bg-sky-500/20 border-sky-500 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            <span className="text-2xl">📍</span>
            <span className="text-[10px] font-black uppercase tracking-widest">A zu B</span>
          </button>
        </div>

        {selectedPois.length === 0 ? (
          <div className="py-6">
            <h3 className="text-[11px] font-black tracking-[0.2em] text-sky-500 uppercase mb-4 px-1">Fertige Touren</h3>
            <div className="grid grid-cols-1 gap-3">
              {tourTemplates.map(t => {
                const resolvedCount = t.poiIds.filter(id => pois.some(p => p.id === id)).length;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      const resolved = t.poiIds.map(id => pois.find(p => p.id === id)).filter(Boolean);
                      if (resolved.length > 0) setSelectedPois(resolved);
                    }}
                    className="rounded-2xl border border-white/10 overflow-hidden cursor-pointer transition-all active:scale-[0.98] hover:border-white/20"
                    style={{ background: `linear-gradient(135deg, ${t.color}15 0%, #0f172a 100%)` }}
                  >
                    <div className="h-1 w-full" style={{ background: t.color }} />
                    <div className="p-4 flex items-center gap-4">
                      <div className="text-3xl">{t.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white">{t.name}</div>
                        <div className="text-[10px] text-white/40 line-clamp-1 mt-0.5">{t.description}</div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-white/30 mt-1.5">
                          <span>{resolvedCount} Orte</span>
                          <span>~{t.estimatedMinutes} Min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[10px] text-white/20 mt-6">
              Oder wähle einzelne Orte unter "Entdecken"
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black tracking-widest text-sky-500 uppercase">Gewählte Orte ({selectedPois.length})</span>
              <button
                onClick={() => setSelectedPois([])}
                className="text-[10px] font-bold text-red-400 uppercase flex items-center gap-1"
              >
                <Trash2 size={12} /> Alle löschen
              </button>
            </div>

            <div className="space-y-2">
              {selectedPois.map((poi, index) => (
                <div
                  key={poi.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{poi.name}</div>
                      <div className="text-[10px] opacity-40 text-slate-300 capitalize">{poi.city}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePoiSelection(poi)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Offline Pre-Load */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <button
                onClick={handlePreload}
                disabled={isPreloading || preloadDone}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  preloadDone
                    ? 'bg-emerald-500/10 border-emerald-500/50'
                    : isPreloading
                      ? 'bg-sky-500/10 border-sky-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-4">
                  {preloadDone ? (
                    <CheckCircle size={24} className="text-emerald-400" />
                  ) : isPreloading ? (
                    <Loader2 size={24} className="text-sky-400 animate-spin" />
                  ) : (
                    <Download size={24} className="text-sky-400" />
                  )}
                  <div className="text-left">
                    <div className="font-bold text-sm text-white">
                      {preloadDone ? 'Offline bereit!' : isPreloading ? `Lade POI ${preloadProgress + 1}/${preloadTotal}...` : 'Offline vorbereiten'}
                    </div>
                    <div className="text-[10px] opacity-40 text-slate-300">
                      {preloadDone ? 'Audio + Bilder heruntergeladen' : isPreloading ? selectedPois[preloadProgress]?.name || '' : 'Audio & Bilder vorladen für unterwegs'}
                    </div>
                  </div>
                </div>
                {isPreloading && preloadTotal > 0 && (
                  <div className="text-xs font-bold text-sky-400">{Math.round((preloadProgress / preloadTotal) * 100)}%</div>
                )}
              </button>

              {/* Progress bar */}
              {(isPreloading || preloadDone) && (
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${preloadDone ? 'bg-emerald-500' : 'bg-sky-500'}`}
                    style={{ width: `${preloadTotal > 0 ? (preloadProgress / preloadTotal) * 100 : 0}%` }}
                  />
                </div>
              )}
            </div>

            {/* Simulation toggle */}
            <div className="mt-4">
              <div
                onClick={() => setUseSimulation(!useSimulation)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  useSimulation ? 'bg-sky-500/10 border-sky-500/50' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">🏃</div>
                  <div>
                    <div className="font-bold text-sm text-white">Demo-Modus</div>
                    <div className="text-[10px] opacity-40 text-slate-300">Virtueller Spaziergang entlang der Route</div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  useSimulation ? 'border-sky-500 bg-sky-500' : 'border-white/20'
                }`}>
                  {useSimulation && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleStartTour}
          disabled={loading || selectedPois.length < 2}
          className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${
            selectedPois.length < 2
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
          }`}
        >
          {loading ? (
            <span className="animate-pulse">BERECHNE ROUTE...</span>
          ) : (
            <>
              <Play size={24} fill="currentColor" /> TOUR STARTEN
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TourOverlay;
