import { useState, useCallback, useEffect, useRef } from 'react';
import { ACHIEVEMENTS, getDefaultAchievements, getDefaultStats } from '../utils/achievements';
import { showToast } from '../components/ToastContainer';

const STORAGE_KEY_ACHIEVEMENTS = 'cw_achievements';
const STORAGE_KEY_STATS = 'cw_stats';

/**
 * Load saved state from localStorage with fallback defaults.
 */
function loadFromStorage(key, defaultFactory) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[useAchievements] Failed to load ${key}:`, e);
  }
  return defaultFactory();
}

/**
 * Save state to localStorage and notify other hook instances.
 */
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('cw-storage', { detail: { key } }));
  } catch (e) {
    console.warn(`[useAchievements] Failed to save ${key}:`, e);
  }
}

/**
 * Merge saved achievements with the master definition list.
 * New achievements added later will appear as locked; removed ones are dropped.
 */
function mergeAchievements(saved) {
  const savedMap = {};
  (saved || []).forEach((a) => {
    savedMap[a.id] = a;
  });

  return ACHIEVEMENTS.map((def) => {
    if (savedMap[def.id]) {
      // Keep saved unlock state but refresh name/emoji/description from definition
      return {
        ...savedMap[def.id],
        name: def.name,
        emoji: def.emoji,
        description: def.description,
      };
    }
    return {
      id: def.id,
      name: def.name,
      emoji: def.emoji,
      description: def.description,
      unlocked: false,
      unlockedAt: null,
    };
  });
}

/**
 * Custom hook for the gamification / achievements system.
 *
 * Returns:
 * - achievements: array of achievement objects (with unlocked state)
 * - stats: the current progress stats
 * - recordTourComplete(tourData): call when a tour finishes
 * - recordAction(action): call for one-off events (e.g. 'offline_download')
 * - unlockedCount / totalCount: convenience counters
 */
export function useAchievements() {
  const [achievements, setAchievements] = useState(() =>
    mergeAchievements(loadFromStorage(STORAGE_KEY_ACHIEVEMENTS, getDefaultAchievements))
  );
  const [stats, setStats] = useState(() =>
    loadFromStorage(STORAGE_KEY_STATS, getDefaultStats)
  );

  // Guard against rapid duplicate toasts
  const lastToastRef = useRef(null);

  // Sync across hook instances: re-read localStorage when another instance writes
  useEffect(() => {
    const onSync = (e) => {
      if (e.detail?.key === STORAGE_KEY_ACHIEVEMENTS) {
        setAchievements(mergeAchievements(loadFromStorage(STORAGE_KEY_ACHIEVEMENTS, getDefaultAchievements)));
      }
      if (e.detail?.key === STORAGE_KEY_STATS) {
        setStats(loadFromStorage(STORAGE_KEY_STATS, getDefaultStats));
      }
    };
    window.addEventListener('cw-storage', onSync);
    return () => window.removeEventListener('cw-storage', onSync);
  }, []);

  /**
   * Check all achievement conditions against current stats.
   * Unlock any that are newly met and fire toasts.
   */
  const checkAndUnlock = useCallback(
    (currentStats, currentAchievements) => {
      let changed = false;
      const newlyUnlocked = [];

      const updated = currentAchievements.map((ach) => {
        if (ach.unlocked) return ach;

        const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
        if (!def) return ach;

        if (def.condition(currentStats)) {
          changed = true;
          const unlocked = {
            ...ach,
            unlocked: true,
            unlockedAt: new Date().toISOString(),
          };
          newlyUnlocked.push(unlocked);
          return unlocked;
        }
        return ach;
      });

      if (changed) {
        setAchievements(updated);
        saveToStorage(STORAGE_KEY_ACHIEVEMENTS, updated);

        // Show a toast for each newly unlocked achievement
        newlyUnlocked.forEach((ach) => {
          const key = ach.id;
          if (lastToastRef.current !== key) {
            lastToastRef.current = key;
            showToast(`${ach.emoji} Erfolg: ${ach.name}!`, 'success');
          }
        });
      }

      return newlyUnlocked;
    },
    []
  );

  /**
   * Record the completion of a tour and update stats.
   *
   * @param {Object} tourData
   * @param {Array}  tourData.poisVisited    - array of POI objects visited
   * @param {number} tourData.distanceKm     - total distance walked in km
   * @param {Date|string} tourData.startTime - when the tour was started
   * @param {number} tourData.durationMinutes - how long the tour took
   */
  const recordTourComplete = useCallback(
    (tourData) => {
      setStats((prev) => {
        const next = { ...prev };

        // Tours completed
        next.tours_completed = (prev.tours_completed || 0) + 1;

        // Unique POIs
        const visitedIds = (tourData.poisVisited || []).map((p) => p.id || p);
        const uniqueSet = new Set([...(prev.unique_pois_visited || []), ...visitedIds]);
        next.unique_pois_visited = Array.from(uniqueSet);

        // Distance
        const dist = tourData.distanceKm || 0;
        next.total_distance_km = (prev.total_distance_km || 0) + dist;
        next.max_distance_km = Math.max(prev.max_distance_km || 0, dist);

        // Categories
        const categories = (tourData.poisVisited || []).flatMap(
          (p) => (Array.isArray(p.categories) ? p.categories : p.category ? [p.category] : [])
        );
        const artCount = categories.filter(
          (c) => c && ['art', 'culture', 'kunst', 'kultur'].includes(c.toLowerCase())
        ).length;
        const historyCount = categories.filter(
          (c) => c && ['history', 'geschichte', 'historian'].includes(c.toLowerCase())
        ).length;
        next.art_pois = (prev.art_pois || 0) + artCount;
        next.history_pois = (prev.history_pois || 0) + historyCount;

        // Time-of-day checks
        const startTime = tourData.startTime ? new Date(tourData.startTime) : null;
        if (startTime) {
          const hour = startTime.getHours();
          if (hour >= 20 || hour < 4) next.night_tour = true;
          if (hour >= 4 && hour < 8) next.early_tour = true;
        }

        // Max POIs in single tour
        const poisCount = visitedIds.length;
        next.max_pois_in_tour = Math.max(prev.max_pois_in_tour || 0, poisCount);

        // Fastest tour
        const duration = tourData.durationMinutes || null;
        if (duration !== null) {
          if (prev.fastest_tour_minutes === null || duration < prev.fastest_tour_minutes) {
            next.fastest_tour_minutes = duration;
          }
        }

        saveToStorage(STORAGE_KEY_STATS, next);

        // Check achievements with the updated stats (using functional approach)
        // We need to defer this slightly so state is committed
        setTimeout(() => {
          setAchievements((currentAch) => {
            const newlyUnlocked = [];
            let changed = false;
            const updated = currentAch.map((ach) => {
              if (ach.unlocked) return ach;
              const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
              if (!def) return ach;
              if (def.condition(next)) {
                changed = true;
                const unlocked = {
                  ...ach,
                  unlocked: true,
                  unlockedAt: new Date().toISOString(),
                };
                newlyUnlocked.push(unlocked);
                return unlocked;
              }
              return ach;
            });

            if (changed) {
              saveToStorage(STORAGE_KEY_ACHIEVEMENTS, updated);
              newlyUnlocked.forEach((a) => {
                showToast(`${a.emoji} Erfolg: ${a.name}!`, 'success');
              });
              return updated;
            }
            return currentAch;
          });
        }, 100);

        return next;
      });
    },
    []
  );

  /**
   * Record a one-off action (e.g. offline_download).
   */
  const recordAction = useCallback(
    (action) => {
      setStats((prev) => {
        const next = { ...prev };

        if (action === 'offline_download') {
          next.offline_download = true;
        }

        saveToStorage(STORAGE_KEY_STATS, next);

        // Check achievements
        setTimeout(() => {
          setAchievements((currentAch) => {
            const newlyUnlocked = [];
            let changed = false;
            const updated = currentAch.map((ach) => {
              if (ach.unlocked) return ach;
              const def = ACHIEVEMENTS.find((d) => d.id === ach.id);
              if (!def) return ach;
              if (def.condition(next)) {
                changed = true;
                const unlocked = {
                  ...ach,
                  unlocked: true,
                  unlockedAt: new Date().toISOString(),
                };
                newlyUnlocked.push(unlocked);
                return unlocked;
              }
              return ach;
            });

            if (changed) {
              saveToStorage(STORAGE_KEY_ACHIEVEMENTS, updated);
              newlyUnlocked.forEach((a) => {
                showToast(`${a.emoji} Erfolg: ${a.name}!`, 'success');
              });
              return updated;
            }
            return currentAch;
          });
        }, 100);

        return next;
      });
    },
    []
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return {
    achievements,
    stats,
    recordTourComplete,
    recordAction,
    checkAndUnlock,
    unlockedCount,
    totalCount,
  };
}
