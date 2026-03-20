/**
 * CityWhisper Achievement Definitions
 * Each achievement has an id, name, emoji, description, and a condition function
 * that receives the user's stats object and returns true if the achievement is unlocked.
 */

export const ACHIEVEMENTS = [
  {
    id: 'first_tour',
    name: 'Erster Schritt',
    emoji: '\u{1F463}',
    description: 'Schliesse deine erste Tour ab',
    condition: (stats) => stats.tours_completed >= 1,
  },
  {
    id: 'mannheim_explorer',
    name: 'Mannheim-Entdecker',
    emoji: '\u{1F9ED}',
    description: 'Besuche 10 verschiedene POIs',
    condition: (stats) => (stats.unique_pois_visited?.length || 0) >= 10,
  },
  {
    id: 'culture_buff',
    name: 'Kulturbanause',
    emoji: '\u{1F3AD}',
    description: 'Besuche 5 Kunst- oder Kultur-POIs',
    condition: (stats) => (stats.art_pois || 0) >= 5,
  },
  {
    id: 'history_fan',
    name: 'Geschichtsfan',
    emoji: '\u{1F4DC}',
    description: 'Besuche 5 Geschichts-POIs',
    condition: (stats) => (stats.history_pois || 0) >= 5,
  },
  {
    id: 'night_walker',
    name: 'Nachtwanderer',
    emoji: '\u{1F319}',
    description: 'Starte eine Tour nach 20:00 Uhr',
    condition: (stats) => stats.night_tour === true,
  },
  {
    id: 'early_bird',
    name: 'Fr\u00FChaufsteher',
    emoji: '\u{1F305}',
    description: 'Starte eine Tour vor 8:00 Uhr',
    condition: (stats) => stats.early_tour === true,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    emoji: '\u{1F3C3}',
    description: 'Laufe mehr als 5 km in einer Tour',
    condition: (stats) => (stats.max_distance_km || 0) >= 5,
  },
  {
    id: 'collector',
    name: 'Sammler',
    emoji: '\u{1F4E6}',
    description: 'F\u00FCge 10+ POIs zu einer einzigen Tour hinzu',
    condition: (stats) => (stats.max_pois_in_tour || 0) >= 10,
  },
  {
    id: 'offline_pro',
    name: 'Offline-Profi',
    emoji: '\u{1F4F6}',
    description: 'Lade eine Stadt f\u00FCr die Offline-Nutzung herunter',
    condition: (stats) => stats.offline_download === true,
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    emoji: '\u{26A1}',
    description: 'Schliesse eine Tour in unter 15 Minuten ab',
    condition: (stats) => stats.fastest_tour_minutes !== null && stats.fastest_tour_minutes < 15,
  },
];

/**
 * Create a fresh achievement state entry (locked by default)
 */
export const createAchievementState = (achievement) => ({
  id: achievement.id,
  name: achievement.name,
  emoji: achievement.emoji,
  description: achievement.description,
  unlocked: false,
  unlockedAt: null,
});

/**
 * Build the default achievement state map from all definitions
 */
export const getDefaultAchievements = () =>
  ACHIEVEMENTS.map(createAchievementState);

/**
 * Default stats object
 */
export const getDefaultStats = () => ({
  tours_completed: 0,
  unique_pois_visited: [],
  total_distance_km: 0,
  max_distance_km: 0,
  art_pois: 0,
  history_pois: 0,
  night_tour: false,
  early_tour: false,
  max_pois_in_tour: 0,
  offline_download: false,
  fastest_tour_minutes: null,
});
