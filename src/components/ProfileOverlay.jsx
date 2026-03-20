import React, { useState, useMemo } from 'react';
import { useTourContext } from '../context/TourContext';
import { X, Save, Download, CheckCircle, Loader2, Trophy } from 'lucide-react';
import { showToast } from './ToastContainer';
import { api, API_BASE_URL } from '../services/api';
import { offlineCache } from '../utils/offlineCache';
import { useAchievements } from '../hooks/useAchievements';

const ALL_CATEGORIES = ['History', 'Art', 'Subculture', 'Architecture', 'Nature', 'Food', 'Nightlife', 'Religion', 'Urban', 'Views', 'Family', 'Culture'];

const ProfileOverlay = ({ isOpen, onClose }) => {
  const { selectedCategories, toggleCategory, persona, changePersona, markerStyle, changeMarkerStyle, pois } = useTourContext();
  const { achievements, recordAction, unlockedCount, totalCount } = useAchievements();

  const [downloadingCity, setDownloadingCity] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadTotal, setDownloadTotal] = useState(0);
  const [downloadedCities, setDownloadedCities] = useState(() => offlineCache.getDownloadedCities());

  // Extract unique cities from POIs
  const cities = useMemo(() => {
    const cityMap = {};
    pois.forEach(poi => {
      const city = poi.city || 'Unbekannt';
      if (!cityMap[city]) cityMap[city] = 0;
      cityMap[city]++;
    });
    return Object.entries(cityMap).sort((a, b) => b[1] - a[1]); // Sort by count desc
  }, [pois]);

  if (!isOpen) return null;

  const handleDownloadCity = async (cityName) => {
    const cityPois = pois.filter(p => p.city === cityName);
    if (cityPois.length === 0) return;

    setDownloadingCity(cityName);
    setDownloadTotal(cityPois.length);
    setDownloadProgress(0);

    try {
      for (let i = 0; i < cityPois.length; i++) {
        setDownloadProgress(i);
        const poi = cityPois[i];
        try {
          // Fetch audio + script from backend (triggers AI generation + TTS if needed)
          const data = await api.fetchAudio(poi.id, persona, selectedCategories);
          const audioUrl = data.audio_url
            ? (data.audio_url.startsWith('http') ? data.audio_url : `${API_BASE_URL}${data.audio_url}`)
            : null;

          // Store in offline cache
          offlineCache.set(poi.id, persona, { script: data.script, audioUrl });

          // Pre-fetch actual audio file into browser cache
          if (audioUrl) {
            await fetch(audioUrl).catch(() => {});
          }

          // Pre-fetch image into browser cache
          if (poi.image) {
            const imgSrc = typeof poi.image === 'string'
              ? poi.image
              : poi.image.cached || poi.image.direct || poi.image.fallback;
            if (imgSrc) {
              const imgUrl = imgSrc.startsWith('http') ? imgSrc : `${API_BASE_URL}${imgSrc}`;
              await fetch(imgUrl).catch(() => {});
            }
          }
        } catch (e) {
          console.warn(`Offline download failed for ${poi.name}:`, e);
        }
      }

      setDownloadProgress(cityPois.length);
      offlineCache.markCityDownloaded(cityName);
      setDownloadedCities(offlineCache.getDownloadedCities());
      recordAction('offline_download');
      showToast(`${cityName}: ${cityPois.length} POIs offline bereit!`, 'success');
    } catch (err) {
      console.error('City download failed:', err);
      showToast('Download fehlgeschlagen', 'error');
    } finally {
      setDownloadingCity(null);
    }
  };

  const handleSave = () => {
    showToast(`Profil gespeichert: ${persona === 'insider' ? 'Insiderin' : 'Historiker'}, ${selectedCategories.length} Interessen`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-md flex flex-col p-6 pointer-events-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Dein Profil <span className="text-sky-500">👤</span>
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-10 pr-1 py-4">
        {/* Erzählstil Section */}
        <section>
          <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase mb-6 px-1">Dein Guide-Stil</h3>
          <div className="grid grid-cols-1 gap-4">
            <div
              onClick={() => changePersona('insider')}
              className={`p-6 rounded-[28px] flex items-center gap-5 cursor-pointer transition-all active:scale-[0.98] ${
                persona === 'insider'
                  ? 'bg-sky-500/10 border-2 border-sky-500/50'
                  : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🕶️</div>
              <div>
                <div className="font-bold text-lg text-white">Insiderin</div>
                <div className="text-xs opacity-50 text-slate-300">Locker, modern & geheimnisvoll</div>
              </div>
            </div>
            <div
              onClick={() => changePersona('historian')}
              className={`p-6 rounded-[28px] flex items-center gap-5 cursor-pointer transition-all active:scale-[0.98] ${
                persona === 'historian'
                  ? 'bg-amber-500/10 border-2 border-amber-500/50'
                  : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📜</div>
              <div>
                <div className="font-bold text-lg text-white">Historiker</div>
                <div className="text-xs opacity-50 text-slate-300">Faktisch, präzise & lehrreich</div>
              </div>
            </div>
          </div>
        </section>

        {/* Interessen Section */}
        <section>
          <div className="flex justify-between items-end mb-6 px-1">
            <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase">Deine Interessen</h3>
            <span className="text-[10px] font-bold text-white/30 uppercase">{selectedCategories.length} gewählt</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {ALL_CATEGORIES.map(cat => (
              <div
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-6 py-4 rounded-2xl border-2 text-[13px] font-bold text-center cursor-pointer transition-all active:scale-90 ${
                  selectedCategories.includes(cat)
                    ? 'bg-sky-500 border-sky-400 text-white shadow-xl shadow-sky-500/30'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                {cat}
              </div>
            ))}
          </div>
        </section>

        {/* Kartenstil Section */}
        <section>
          <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase mb-6 px-1">Karten-Marker</h3>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => changeMarkerStyle('minimal')}
              className={`p-5 rounded-2xl flex flex-col items-center gap-3 cursor-pointer transition-all active:scale-95 ${
                markerStyle === 'minimal'
                  ? 'bg-sky-500/10 border-2 border-sky-500/50'
                  : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-500/60 flex items-center justify-center text-sm">⛲</div>
                <div className="w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-500/60 flex items-center justify-center text-sm">🎨</div>
              </div>
              <span className="text-xs font-bold text-white">Schlicht</span>
            </div>
            <div
              onClick={() => changeMarkerStyle('colorful')}
              className={`p-5 rounded-2xl flex flex-col items-center gap-3 cursor-pointer transition-all active:scale-95 ${
                markerStyle === 'colorful'
                  ? 'bg-sky-500/10 border-2 border-sky-500/50'
                  : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-sm">⛲</div>
                <div className="w-8 h-8 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center text-sm">🎨</div>
              </div>
              <span className="text-xs font-bold text-white">Bunt</span>
            </div>
          </div>
        </section>

        {/* Erfolge / Achievements Section */}
        <section>
          <div className="flex justify-between items-end mb-6 px-1">
            <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase flex items-center gap-2">
              <Trophy size={14} className="text-sky-500" /> Erfolge
            </h3>
            <span className="text-[10px] font-bold text-white/30 uppercase">{unlockedCount}/{totalCount} freigeschaltet</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  ach.unlocked
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}
              >
                <div className="text-2xl mb-2">
                  {ach.unlocked ? ach.emoji : '?'}
                </div>
                <div className={`text-xs font-bold mb-1 ${ach.unlocked ? 'text-white' : 'text-white/40'}`}>
                  {ach.unlocked ? ach.name : '???'}
                </div>
                <div className="text-[10px] text-white/30 leading-tight">
                  {ach.unlocked
                    ? new Date(ach.unlockedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : ach.description
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offline Download Section */}
        <section className="pb-10">
          <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase mb-6 px-1">Offline-Download</h3>
          <p className="text-xs text-white/40 mb-4 px-1">Lade Audio, Texte & Bilder einer Stadt herunter, um sie ohne Internet zu nutzen.</p>

          <div className="space-y-3">
            {cities.map(([city, count]) => {
              const isDownloaded = downloadedCities.includes(city);
              const isDownloading = downloadingCity === city;

              return (
                <div key={city} className="rounded-[20px] bg-white/5 border border-white/10 overflow-hidden">
                  <div
                    onClick={() => !isDownloading && handleDownloadCity(city)}
                    className={`p-5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                      isDownloading ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {isDownloaded ? (
                        <CheckCircle size={22} className="text-emerald-400" />
                      ) : isDownloading ? (
                        <Loader2 size={22} className="text-sky-400 animate-spin" />
                      ) : (
                        <Download size={22} className="text-sky-400" />
                      )}
                      <div>
                        <div className="text-sm text-white font-bold">{city}</div>
                        <div className="text-[10px] text-white/40 font-medium">
                          {isDownloading
                            ? `Lade POI ${downloadProgress + 1}/${downloadTotal}...`
                            : isDownloaded
                              ? `${count} POIs offline bereit`
                              : `${count} POIs verfügbar`
                          }
                        </div>
                      </div>
                    </div>
                    {!isDownloading && !isDownloaded && (
                      <div className="px-4 py-1.5 bg-sky-500/20 text-sky-400 rounded-full text-[10px] font-black tracking-widest border border-sky-500/30">
                        LADEN
                      </div>
                    )}
                    {isDownloaded && (
                      <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black tracking-widest border border-emerald-500/30">
                        BEREIT
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {isDownloading && downloadTotal > 0 && (
                    <div className="px-5 pb-4">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${(downloadProgress / downloadTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {cities.length === 0 && (
              <div className="text-center py-8 text-white/20 text-sm">
                Keine POIs geladen
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <Save size={18} /> Speichern
        </button>
      </div>
    </div>
  );
};

export default ProfileOverlay;
