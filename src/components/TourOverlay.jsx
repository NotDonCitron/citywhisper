import React, { useState } from 'react';
import { useTourContext } from '../context/TourContext';
import { api } from '../services/api';
import { X, Map as MapIcon, Play, Trash2 } from 'lucide-react';

const TourOverlay = ({ isOpen, onClose }) => {
  const { selectedPois, setSelectedPois, togglePoiSelection, startTour, userLocation } = useTourContext();
  const [loading, setLoading] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [isRoundtrip, setIsRoundtrip] = useState(true);

  if (!isOpen) return null;

  const handleStartTour = async () => {
    if (selectedPois.length < 2) {
      alert("Bitte wähle mindestens 2 Orte für eine Tour aus.");
      return;
    }

    setLoading(true);
    try {
      const poiIds = selectedPois.map(p => p.id);
      const routeData = await api.fetchRoute(poiIds, isRoundtrip);
      await startTour(routeData, useSimulation);
      onClose(); // Close overlay when tour starts
    } catch (err) {
      console.error("Failed to start tour:", err);
      alert("Fehler beim Berechnen der Route.");
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
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-20">🏙️</div>
            <p className="text-slate-400 text-sm">
              Noch keine Orte ausgewählt.<br/>
              Gehe auf "Entdecken", um deine Tour zu planen.
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

            <div className="mt-8 pt-6 border-t border-white/5">
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
