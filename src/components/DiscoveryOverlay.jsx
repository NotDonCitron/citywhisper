import React, { useState, useEffect } from 'react';
import { useTourContext } from '../context/TourContext';
import { api } from '../services/api';
import { X, Plus, Check } from 'lucide-react';

const DiscoveryOverlay = ({ isOpen, onClose }) => {
  const { selectedCategories, togglePoiSelection, selectedPois } = useTourContext();
  const [suggestedPois, setSuggestedPois] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadDiscovery = async () => {
        setLoading(true);
        try {
          // In a real app we'd use the discover endpoint, but for now we filter all pois
          const data = await api.fetchPois();
          if (selectedCategories.length > 0) {
            const filtered = data.filter(poi => 
              poi.categories.some(cat => selectedCategories.includes(cat))
            );
            setSuggestedPois(filtered);
          } else {
            setSuggestedPois(data);
          }
        } catch (err) {
          console.error("Discovery fetch failed:", err);
        } finally {
          setLoading(false);
        }
      };
      loadDiscovery();
    }
  }, [isOpen, selectedCategories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-md flex flex-col p-6 pointer-events-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Entdeckungen <span className="text-sky-500">✨</span>
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
          <X size={20} />
        </button>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Basierend auf deinen Interessen haben wir diese Orte für dich gefunden:
      </p>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="text-center py-10 opacity-50 text-sm text-white">Suche nach passenden Orten...</div>
        ) : suggestedPois.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-sm text-white">Keine passenden Orte gefunden.</div>
        ) : (
          suggestedPois.map(poi => {
            const isSelected = selectedPois.some(p => p.id === poi.id);
            return (
              <div 
                key={poi.id}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePoiSelection(poi);
                }}
                className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                  isSelected ? 'bg-sky-500/20 border-sky-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{poi.emoji || '📍'}</div>
                  <div>
                    <div className="font-bold text-sm text-white">{poi.name}</div>
                    <div className="text-[10px] opacity-40 uppercase tracking-wider text-slate-300">
                      {poi.categories?.slice(0, 2).join(' • ')}
                    </div>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-sky-500 text-white' : 'bg-sky-500/10 text-sky-500'
                }`}>
                  {isSelected ? <Check size={18} /> : <Plus size={18} />}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 space-y-3">
        <button 
          onClick={onClose}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          Auswahl bestätigen
        </button>
      </div>
    </div>
  );
};

export default DiscoveryOverlay;
