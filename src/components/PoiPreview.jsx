import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTourContext } from '../context/TourContext';
import { api, API_BASE_URL } from '../services/api';
import { offlineCache } from '../utils/offlineCache';
import { X, Play, Pause, Plus, Check, MapPin } from 'lucide-react';

const PoiPreview = () => {
  const {
    previewPoi,
    setPreviewPoi,
    selectedPois,
    togglePoiSelection,
    persona,
    selectedCategories
  } = useTourContext();

  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const audioRef = useRef(new Audio());
  const [audioUrl, setAudioUrl] = useState(null);

  // Fetch script + audio URL when preview POI changes
  useEffect(() => {
    if (!previewPoi) {
      // Cleanup
      audioRef.current.pause();
      audioRef.current.src = '';
      setScript('');
      setAudioUrl(null);
      setIsPlaying(false);
      setImageLoaded(false);
      setImageFailed(false);
      return;
    }

    setLoading(true);
    setScript('');
    setAudioUrl(null);
    setImageLoaded(false);
    setImageFailed(false);

    // Check offline cache first
    const cachedScript = offlineCache.getScript(previewPoi.id, persona);
    const cachedAudioUrl = offlineCache.getAudioUrl(previewPoi.id, persona);
    if (cachedScript) {
      setScript(cachedScript);
      if (cachedAudioUrl) setAudioUrl(cachedAudioUrl);
      setLoading(false);
      return;
    }

    api.fetchAudio(previewPoi.id, persona, selectedCategories)
      .then(data => {
        setScript(data.script || '');
        if (data.audio_url) {
          const url = data.audio_url.startsWith('http') ? data.audio_url : `${API_BASE_URL}${data.audio_url}`;
          setAudioUrl(url);
          offlineCache.set(previewPoi.id, persona, { script: data.script, audioUrl: url });
        }
      })
      .catch(err => {
        console.error('Failed to fetch POI preview:', err);
        setScript('Informationen konnten nicht geladen werden.');
      })
      .finally(() => setLoading(false));
  }, [previewPoi?.id, persona, selectedCategories]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    const onEnded = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, []);

  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else if (audioUrl) {
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
      }
      audio.play().catch(console.error);
    }
  }, [isPlaying, audioUrl]);

  const handleClose = () => {
    audioRef.current.pause();
    setPreviewPoi(null);
  };

  const handleToggleTour = () => {
    if (previewPoi) togglePoiSelection(previewPoi);
  };

  if (!previewPoi) return null;

  const isInTour = selectedPois.some(p => p.id === previewPoi.id);

  // Strip markdown
  const stripMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1');
  };

  const displayText = stripMarkdown(script);

  // Image source
  const resolveImageSrc = (img) => {
    if (!img) return null;
    if (typeof img === 'string') return img.startsWith('http') ? img : `${API_BASE_URL}${img}`;
    const url = img.direct || img.cached || img.fallback;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };
  const imageSrc = resolveImageSrc(previewPoi.image);

  // Category info
  const getCategoryInfo = (cat) => {
    const key = (cat || '').toLowerCase();
    const map = {
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

  const primaryCat = Array.isArray(previewPoi.categories) ? previewPoi.categories[0] : null;
  const catInfo = getCategoryInfo(primaryCat);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[550] pointer-events-auto animate-slide-up">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 -z-10" onClick={handleClose} />

      {/* Bottom Sheet */}
      <div className="bg-slate-900 border-t border-white/10 rounded-t-[28px] max-h-[75vh] flex flex-col shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Hero Image */}
        <div className="relative h-44 mx-4 rounded-2xl overflow-hidden mb-4">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={previewPoi.name}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
            />
          ) : null}
          {(!imageSrc || imageFailed) && (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${catInfo.bg} 0%, #1e293b 100%)` }}>
              <MapPin size={48} style={{ color: catInfo.color, opacity: 0.4 }} />
            </div>
          )}
          {!imageLoaded && !imageFailed && imageSrc && (
            <div className="absolute inset-0 bg-slate-800 animate-pulse" />
          )}

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm"
          >
            <X size={16} />
          </button>

          {/* Category badge */}
          {primaryCat && (
            <div
              className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: catInfo.bg, color: catInfo.color }}
            >
              {catInfo.label}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-5 flex-1 overflow-y-auto pb-4">
          {/* Title row */}
          <div className="mb-1">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{previewPoi.city || 'Mannheim'}</div>
            <h2 className="text-xl font-black text-white">{previewPoi.name}</h2>
          </div>

          {/* Categories */}
          {Array.isArray(previewPoi.categories) && previewPoi.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {previewPoi.categories.map(cat => {
                const ci = getCategoryInfo(cat);
                return (
                  <span key={cat} className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: ci.bg, color: ci.color }}>
                    {ci.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Text */}
          <div className="mt-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
              </div>
            ) : displayText ? (
              <p className="text-sm text-white/70 leading-relaxed">{displayText}</p>
            ) : null}
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-4 border-t border-white/5 flex gap-3">
          {/* Play Button */}
          <button
            onClick={handleTogglePlay}
            disabled={!audioUrl}
            className={`p-4 rounded-2xl transition-all active:scale-95 ${
              audioUrl
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-white/5 text-white/20 border border-white/5'
            }`}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Add/Remove from Tour */}
          <button
            onClick={handleToggleTour}
            className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isInTour
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
            }`}
          >
            {isInTour ? (
              <><Check size={18} /> In deiner Tour</>
            ) : (
              <><Plus size={18} /> Zur Tour hinzufügen</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoiPreview;
