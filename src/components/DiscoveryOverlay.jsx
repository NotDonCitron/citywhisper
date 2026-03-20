import React, { useState, useMemo, useCallback } from 'react';
import { useTourContext } from '../context/TourContext';
import { API_BASE_URL } from '../services/api';
import { X, Search, Plus, Check, MapPin, Compass } from 'lucide-react';

// ── Category metadata ───────────────────────────────────────────────
const CATEGORY_META = {
  history:      { label: 'Geschichte',   emoji: '🏛️', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  art:          { label: 'Kunst',        emoji: '🎨', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  architecture: { label: 'Architektur',  emoji: '🏗️', color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
  nature:       { label: 'Natur',        emoji: '🌿', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  culture:      { label: 'Kultur',       emoji: '🎭', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  subculture:   { label: 'Subkultur',    emoji: '🎸', color: '#f43f5e', bg: 'rgba(244,63,94,0.15)' },
  religion:     { label: 'Religion',     emoji: '🕊️', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  urban:        { label: 'Urban',        emoji: '🏙️', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  views:        { label: 'Aussicht',     emoji: '👁️', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  nightlife:    { label: 'Nightlife',    emoji: '🌙', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  family:       { label: 'Familie',      emoji: '👨‍👩‍👧', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
};

const getCategoryInfo = (cat) => {
  const key = (cat || '').toLowerCase();
  return CATEGORY_META[key] || { label: cat || 'Ort', emoji: '📍', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
};

// ── Resolve POI image URL ───────────────────────────────────────────
const resolveImageSrc = (img) => {
  if (!img) return null;
  const raw = typeof img === 'string' ? img : (img.cached || img.direct || img.fallback);
  if (!raw) return null;
  return raw.startsWith('http') ? raw : `${API_BASE_URL}${raw}`;
};

// ── Haversine distance (meters) ─────────────────────────────────────
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Tiny image card component ───────────────────────────────────────
const PoiImage = React.memo(({ src, name, emoji, catInfo }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="w-full aspect-[4/3] rounded-xl flex items-center justify-center text-3xl"
        style={{ background: `linear-gradient(135deg, ${catInfo.bg} 0%, #0f172a 100%)` }}
      >
        {emoji || <MapPin size={28} style={{ color: catInfo.color, opacity: 0.5 }} />}
      </div>
    );
  }

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative bg-slate-800">
      {!loaded && <div className="absolute inset-0 bg-slate-800 animate-pulse" />}
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
});
PoiImage.displayName = 'PoiImage';

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
const DiscoveryOverlay = ({ isOpen, onClose }) => {
  const {
    pois,
    selectedPois,
    togglePoiSelection,
    setPreviewPoi,
    userLocation,
  } = useTourContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  const [sortMode, setSortMode] = useState('all'); // 'all' | 'nearby'

  // ── Derive the unique category list from all POIs ────────────────
  const allCategories = useMemo(() => {
    const set = new Set();
    pois.forEach((poi) => {
      if (Array.isArray(poi.categories)) {
        poi.categories.forEach((c) => set.add(c));
      }
    });
    // Return sorted by label
    return [...set].sort((a, b) => {
      const la = getCategoryInfo(a).label;
      const lb = getCategoryInfo(b).label;
      return la.localeCompare(lb);
    });
  }, [pois]);

  // ── Toggle a category chip ──────────────────────────────────────
  const toggleCat = useCallback((cat) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  // ── Filtered + sorted POIs ──────────────────────────────────────
  const filteredPois = useMemo(() => {
    let list = [...pois];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.city || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeCategories.length > 0) {
      list = list.filter((p) =>
        Array.isArray(p.categories) &&
        p.categories.some((c) => activeCategories.includes(c))
      );
    }

    // Sort: nearby (distance) or default (alphabetical)
    if (sortMode === 'nearby' && userLocation) {
      list = list.map((p) => ({
        ...p,
        _dist: haversine(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }));
      list.sort((a, b) => a._dist - b._dist);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [pois, searchQuery, activeCategories, sortMode, userLocation]);

  // ── Helpers ─────────────────────────────────────────────────────
  const isInTour = useCallback(
    (poiId) => selectedPois.some((p) => p.id === poiId),
    [selectedPois]
  );

  const handleCardTap = useCallback(
    (poi) => {
      setPreviewPoi(poi);
      onClose();
    },
    [setPreviewPoi, onClose]
  );

  const handleQuickAdd = useCallback(
    (e, poi) => {
      e.stopPropagation();
      togglePoiSelection(poi);
    },
    [togglePoiSelection]
  );

  // ── Format distance ─────────────────────────────────────────────
  const fmtDist = (m) => {
    if (m == null) return null;
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  };

  // ── Guard ───────────────────────────────────────────────────────
  if (!isOpen) return null;

  const tourCount = selectedPois.length;

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex flex-col pointer-events-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Entdecken
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Search bar ─────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ort suchen..."
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.07] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Sort toggle ────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setSortMode('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              sortMode === 'all'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setSortMode('nearby')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              sortMode === 'nearby'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}
          >
            <Compass size={12} />
            In der Nähe
          </button>
        </div>

        {/* ── Category chips (horizontal scroll) ─────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
          {allCategories.map((cat) => {
            const ci = getCategoryInfo(cat);
            const isActive = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCat(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border ${
                  isActive
                    ? 'border-transparent shadow-lg'
                    : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                style={
                  isActive
                    ? { background: ci.bg, color: ci.color, borderColor: ci.color + '40' }
                    : undefined
                }
              >
                <span className="text-sm">{ci.emoji}</span>
                {ci.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-2 flex items-center justify-between text-[11px] font-bold text-white/30 uppercase tracking-wider">
        <span>{filteredPois.length} POIs gefunden</span>
        <span className={tourCount > 0 ? 'text-sky-400' : ''}>
          {tourCount} in deiner Tour
        </span>
      </div>

      {/* ── POI cards grid (scrollable) ─────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {filteredPois.length === 0 ? (
          /* ── Empty state ──────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
              <Search size={32} className="text-white/15" />
            </div>
            <p className="text-white/50 text-sm font-medium mb-1">
              Keine Orte gefunden
            </p>
            <p className="text-white/25 text-xs max-w-[240px]">
              Versuch es mit einem anderen Suchbegriff oder entferne einige Filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPois.map((poi) => {
              const inTour = isInTour(poi.id);
              const imgSrc = resolveImageSrc(poi.image);
              const primaryCat = Array.isArray(poi.categories) ? poi.categories[0] : null;
              const catInfo = getCategoryInfo(primaryCat);
              const dist = poi._dist != null ? fmtDist(poi._dist) : null;

              return (
                <div
                  key={poi.id}
                  onClick={() => handleCardTap(poi)}
                  className={`group relative bg-white/5 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98] ${
                    inTour ? 'border-sky-500/40 ring-1 ring-sky-500/20' : 'border-white/10'
                  }`}
                >
                  {/* Image */}
                  <div className="relative">
                    <PoiImage
                      src={imgSrc}
                      name={poi.name}
                      emoji={poi.emoji}
                      catInfo={catInfo}
                    />

                    {/* Quick-add button */}
                    <button
                      onClick={(e) => handleQuickAdd(e, poi)}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                        inTour
                          ? 'bg-sky-500 text-white'
                          : 'bg-black/60 backdrop-blur-sm text-white/80 hover:bg-sky-500 hover:text-white'
                      }`}
                    >
                      {inTour ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                    </button>

                    {/* Distance badge */}
                    {dist && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white/80 flex items-center gap-1">
                        <MapPin size={10} />
                        {dist}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    {/* Emoji + Name */}
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-base flex-shrink-0 mt-0.5">{poi.emoji || '📍'}</span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
                          {poi.name}
                        </h3>
                        {poi.city && (
                          <p className="text-[10px] text-white/30 font-medium mt-0.5 uppercase tracking-wider">
                            {poi.city}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category badges */}
                    {Array.isArray(poi.categories) && poi.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {poi.categories.slice(0, 3).map((cat) => {
                          const ci = getCategoryInfo(cat);
                          return (
                            <span
                              key={cat}
                              className="px-2 py-0.5 rounded-md text-[9px] font-bold"
                              style={{ background: ci.bg, color: ci.color }}
                            >
                              {ci.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryOverlay;
