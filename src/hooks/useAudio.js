import { useState, useEffect, useCallback, useRef } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { api } from '../services/api';

/**
 * useAudio Hook
 * 
 * Manages audio playback, pre-fetching and filesystem caching.
 */
export const useAudio = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioStatus, setAudioStatus] = useState('Bereit');
  const [isCaching, setIsCaching] = useState(false);
  
  const audioRef = useRef(new Audio());
  const cacheDir = 'audio_cache';

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

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('error', onError);
    };
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

    const fileName = `${poiId}_${persona}_${catHash}.mp3`;
    const filePath = `${cacheDir}/${fileName}`;

    try {
      // Check if file already exists
      try {
        const stat = await Filesystem.stat({
          path: filePath,
          directory: Directory.Data
        });
        if (stat.size > 0) {
          console.log(`Audio for ${poiId} (persona: ${persona}, hash: ${catHash}) already cached.`);
          const uri = await Filesystem.getUri({
            path: filePath,
            directory: Directory.Data
          });
          return Capacitor.convertFileSrc(uri.uri);
        }
      } catch (e) {
        // File does not exist, proceed to download
      }

      // Fetch audio info from backend
      const data = await api.fetchAudio(poiId, persona, categories);
      if (!data.audio_url) throw new Error("No audio_url returned");

      // Download audio blob
      const response = await fetch(data.audio_url);
      const blob = await response.blob();
      
      // Convert blob to base64 for Capacitor Filesystem
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });

      // Save to filesystem
      await Filesystem.writeFile({
        path: filePath,
        data: base64,
        directory: Directory.Data
      });

      console.log(`Audio for ${poiId} (persona: ${persona}, hash: ${catHash}) cached successfully.`);
      
      const uri = await Filesystem.getUri({
        path: filePath,
        directory: Directory.Data
      });
      
      return Capacitor.convertFileSrc(uri.uri);
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
   */
  const playPoiAudio = useCallback(async (poiId, persona, categories) => {
    try {
      setAudioStatus('Bereite vor...');
      const localUrl = await cacheAudio(poiId, persona, categories);
      
      if (!localUrl) {
        throw new Error("Could not get local audio URL");
      }

      const audio = audioRef.current;
      audio.src = localUrl;
      await audio.play();
      setIsPlaying(true);
      setAudioStatus('Wiedergabe...');
    } catch (err) {
      console.error("Playback failed:", err);
      setAudioStatus('Wiedergabe fehlgeschlagen');
    }
  }, [cacheAudio]);

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

  return {
    isPlaying,
    progress,
    audioStatus,
    isCaching,
    playPoiAudio,
    togglePlayback,
    preFetchAll
  };
};
