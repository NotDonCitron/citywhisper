import React, { useState, useEffect, useRef } from 'react';
import { useTourContext } from '../context/TourContext';
import { api } from '../services/api';
import { X, Plus, Check, Clock, MapPin, ChevronRight } from 'lucide-react';
import tourTemplates from '../data/tourTemplates';

/**
 * Horizontally scrollable card for a single tour template.
 */
const TemplateCard = ({ template, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(template)}
      className="flex-shrink-0 w-56 rounded-2xl border border-white/10 overflow-hidden
                 transition-all active:scale-95 hover:border-white/20 text-left group"
      style={{
        background: `linear-gradient(135deg, ${template.color}22 0%, ${template.color}08 100%)`,
      }}
    >
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: template.color }} />

      <div className="p-4 space-y-2.5">
        {/* Emoji + Name */}
        <div className="flex items-start gap-2">
          <span className="text-2xl leading-none">{template.emoji}</span>
          <h3 className="text-sm font-bold text-white leading-tight">{template.name}</h3>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
          {template.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {template.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={10} />
            {template.poiIds.length} Orte
          </span>
        </div>

        {/* CTA */}
        <div
          className="flex items-center gap-1 text-[11px] font-semibold mt-1 transition-colors"
          style={{ color: template.color }}
        >
          Tour starten <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
};

const DiscoveryOverlay = ({ isOpen, onClose, onNavigateToTour }) => {
  const { selectedCategories, togglePoiSelection, selectedPois, pois, setSelectedPois } = useTourContext();
  const [suggestedPois, setSuggestedPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

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

  /**
   * When a template card is tapped:
   * 1. Resolve POI IDs to full POI objects from the loaded pois array.
   * 2. Set them as selected POIs in TourContext.
   * 3. Close Discovery and navigate to the Tour tab.
   */
  const handleTemplateSelect = (template) => {
    // Build a lookup map for O(1) access
    const poiMap = {};
    pois.forEach(p => { poiMap[p.id] = p; });

    const resolved = template.poiIds
      .map(id => poiMap[id])
      .filter(Boolean); // skip any IDs not found in loaded data

    if (resolved.length === 0) {
      console.warn('[DiscoveryOverlay] No matching POIs found for template', template.id);
      return;
    }

    setSelectedPois(resolved);
    onClose();
    if (onNavigateToTour) {
      onNavigateToTour();
    }
  };

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

      {/* ── Tour Templates Section ── */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Fertige Touren
        </h3>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {tourTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleTemplateSelect}
            />
          ))}
        </div>
      </div>

      {/* ── Individual POI list ── */}
      <p className="text-slate-400 text-sm mb-4">
        Oder wähle einzelne Orte aus:
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
