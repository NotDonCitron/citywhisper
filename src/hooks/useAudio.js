import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { api, API_BASE_URL } from '../services/api';

/**
 * useAudio Hook
 * 
 * Manages audio playback, pre-fetching, filesystem caching,
 * and smooth crossfade transitions between POI audios.
 */
export const useAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioStatus, setAudioStatus] = useState('Bereit');
  const [isCaching, setIsCaching] = useState(false);
  const [currentScript, setCurrentScript] = useState('');
  
  const audioRef = useRef(new Audio());
  const cacheDir = 'audio_cache';
  const scriptCache = useRef({}); // Temporary in-memory cache for scripts
  const fadeIntervalRef = useRef(null); // Track fade-out interval for cleanup

  // Ensure cache directory exists
  useEffect(() => {
    const ensureDir = async () => {
      try {
        await Filesystem.mkdir({
          path: cacheDir,
          directory: Directory.Data,
          recursive: true
        });
      } catch (e) {
        // Directory might already exist
      }
    };
    ensureDir();
  }, []);

  // Update progress during playback
  useEffect(() => {
    const audio = audioRef.current;
    
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onTimeUpdate = () => {
      const pct = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(pct) ? 0 : pct);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setAudioStatus('Beendet');
    };

    const onPause = () => {
      setIsPlaying(false);
      setAudioStatus('Pause');
    };

    const onPlay = () => {
      setIsPlaying(true);
      setAudioStatus('Wiedergabe...');
    };

    const onError = (e) => {
      console.error("Audio error:", e);
      setAudioStatus('Fehler');
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('error', onError);
    };
  }, []);

  /**
   * Fade out currently playing audio over ~500ms, then start the new source.
   * If nothing is playing, immediately starts the new audio.
   */
  const fadeOutAndPlay = useCallback(async (newSrc, script) => {
    const audio = audioRef.current;

    // Clear any lingering fade interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    // Fade out if something is currently playing
    if (!audio.paused && audio.src) {
      await new Promise((resolve) => {
        const steps = 10;
        const stepTime = 50; // 10 steps × 50ms = 500ms total fade
        let currentStep = steps;
        fadeIntervalRef.current = setInterval(() => {
          currentStep--;
          audio.volume = Math.max(0, currentStep / steps);
          if (currentStep <= 0) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            audio.pause();
            resolve();
          }
        }, stepTime);
      });
    }

    // Start new audio at zero volume and fade in over 500ms
    audio.volume = 0;
    setCurrentScript(script || '');
    audio.src = newSrc;
    await audio.play();
    setIsPlaying(true);
    setAudioStatus('Wiedergabe...');

    // Fade in: 0 → 1 over 500ms (10 steps × 50ms)
    let fadeStep = 0;
    const fadeSteps = 10;
    fadeIntervalRef.current = setInterval(() => {
      fadeStep++;
      audio.volume = Math.min(1, fadeStep / fadeSteps);
      if (fadeStep >= fadeSteps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, 50);
  }, []);

  /**
   * Caches a single audio file by POI ID.
   */
  const cacheAudio = useCallback(async (poiId, persona = 'insider', categories = []) => {
    // Ensure categories are sorted for consistent hashing
    const sortedCats = Array.isArray(categories) ? [...categories].sort() : [categories];
    const catString = sortedCats.join(',');
    
    // Simple hash function to create CAT_HASH
    let hashValue = 0;
    for (let i = 0; i < catString.length; i++) {
        const char = catString.charCodeAt(i);
        hashValue = ((hashValue << 5) - hashValue) + char;
        hashValue |= 0; // Convert to 32bit integer
    }
    const catHash = Math.abs(hashValue).toString(16);
    const cacheKey = `${poiId}_${persona}_${catHash}`;
    const fileName = `${cacheKey}.mp3`;
    const filePath = `${cacheDir}/${fileName}`;

    try {
      const isWeb = Capacitor.getPlatform() === 'web';

      // 1. Check in-memory script cache
      let script = scriptCache.current[cacheKey];

      // 2. On Web, just return the direct API URL to avoid complex filesystem issues
      if (isWeb) {
        const data = await api.fetchAudio(poiId, persona, categories);
        const fullUrl = data.audio_url.startsWith('http') ? data.audio_url : `${API_BASE_URL}${data.audio_url}`;
        return { url: fullUrl, script: data.script };
      }

      // 3. Check if file already exists (Native only)
      try {
        const stat = await Filesystem.stat({
          path: filePath,
          directory: Directory.Data
        });
        if (stat.size > 0 && script) {
          console.log(`Audio and script for ${poiId} already cached.`);
          const uri = await Filesystem.getUri({
            path: filePath,
            directory: Directory.Data
          });
          return { url: Capacitor.convertFileSrc(uri.uri), script };
        }
      } catch (e) {
        // File or script missing, proceed to fetch
      }

      // 3. Fetch audio info from backend
      const data = await api.fetchAudio(poiId, persona, categories);
      if (!data.audio_url) throw new Error("No audio_url returned");
      
      script = data.script || '';
      scriptCache.current[cacheKey] = script;

      // 4. Download audio blob
      const fullAudioUrl = data.audio_url.startsWith('http') 
        ? data.audio_url 
        : `${API_BASE_URL}${data.audio_url}`;
        
      const response = await fetch(fullAudioUrl);
      const blob = await response.blob();
      
      // Convert blob to base64 for Capacitor Filesystem
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });

      // 5. Save to filesystem
      await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.Data
      });

      console.log(`Audio and script for ${poiId} cached successfully.`);
      
      const uri = await Filesystem.getUri({
        path: filePath,
        directory: Directory.Data
      });
      
      return { url: Capacitor.convertFileSrc(uri.uri), script };
    } catch (err) {
      console.error(`Failed to cache audio for ${poiId}:`, err);
      return null;
    }
  }, []);

  /**
   * Pre-fetches audio for all provided POI IDs.
   */
  const preFetchAll = useCallback(async (poiIds, persona, categories) => {
    setIsCaching(true);
    setAudioStatus('Lade Audio...');
    
    const promises = poiIds.map(id => cacheAudio(id, persona, categories));
    await Promise.all(promises);
    
    setIsCaching(false);
    setAudioStatus('Bereit');
  }, [cacheAudio]);

  /**
   * Play audio for a specific POI.
   * Uses crossfade: if audio is already playing, fades it out smoothly
   * before starting the new one.
   */
  const playPoiAudio = useCallback(async (poiId, persona, categories) => {
    try {
      setAudioStatus('Bereite vor...');
      const result = await cacheAudio(poiId, persona, categories);
      
      if (!result || !result.url) {
        throw new Error("Could not get local audio URL");
      }

      // Use fadeOutAndPlay for smooth crossfade transition
      await fadeOutAndPlay(result.url, result.script);
    } catch (err) {
      console.error("Playback failed:", err);
      setAudioStatus('Wiedergabe fehlgeschlagen');
    }
  }, [cacheAudio, fadeOutAndPlay]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio.src) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        setAudioStatus('Pause');
      } else {
        audio.play();
        setIsPlaying(true);
        setAudioStatus('Wiedergabe...');
      }
    }
  }, [isPlaying]);

  return useMemo(() => ({
    isPlaying,
    progress,
    duration,
    audioStatus,
    isCaching,
    currentScript,
    playPoiAudio,
    togglePlayback,
    preFetchAll
  }), [
    isPlaying,
    progress,
    duration,
    audioStatus,
    isCaching,
    currentScript,
    playPoiAudio,
    togglePlayback,
    preFetchAll
  ]);
};
