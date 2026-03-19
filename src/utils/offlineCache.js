/**
 * Global offline cache for POI audio scripts and URLs.
 * Persists scripts to localStorage, audio/image URLs in memory.
 * Browser HTTP cache handles the actual file data.
 */

const STORAGE_KEY = 'cw_offline_scripts';
const CITIES_KEY = 'cw_offline_cities';

// In-memory cache for audio URLs (populated during download, lost on reload but browser cache covers audio files)
const audioUrlCache = new Map();

// Load scripts from localStorage
const loadScripts = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveScripts = (scripts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
  } catch (e) {
    console.warn('Failed to save offline scripts:', e);
  }
};

export const offlineCache = {
  /** Store a POI's audio data */
  set(poiId, persona, data) {
    const key = `${poiId}_${persona}`;
    // Save script to localStorage (persists across reloads)
    const scripts = loadScripts();
    scripts[key] = data.script || '';
    saveScripts(scripts);
    // Save audio URL in memory
    if (data.audioUrl) {
      audioUrlCache.set(key, data.audioUrl);
    }
  },

  /** Get cached script for a POI */
  getScript(poiId, persona) {
    const key = `${poiId}_${persona}`;
    const scripts = loadScripts();
    return scripts[key] || null;
  },

  /** Get cached audio URL for a POI */
  getAudioUrl(poiId, persona) {
    const key = `${poiId}_${persona}`;
    return audioUrlCache.get(key) || null;
  },

  /** Check if a POI has cached data */
  has(poiId, persona) {
    const key = `${poiId}_${persona}`;
    const scripts = loadScripts();
    return key in scripts;
  },

  /** Mark a city as downloaded */
  markCityDownloaded(city) {
    try {
      const cities = JSON.parse(localStorage.getItem(CITIES_KEY) || '[]');
      if (!cities.includes(city)) {
        cities.push(city);
        localStorage.setItem(CITIES_KEY, JSON.stringify(cities));
      }
    } catch {}
  },

  /** Get list of downloaded cities */
  getDownloadedCities() {
    try {
      return JSON.parse(localStorage.getItem(CITIES_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /** Clear all cached data */
  clear() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CITIES_KEY);
    audioUrlCache.clear();
  }
};
