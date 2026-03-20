/**
 * Pre-built tour templates for Mannheim.
 * Each template is a curated collection of POIs that users can start with 1 tap.
 * POI IDs reference real entries from the database (see backend/migrate_pois.py).
 */

const tourTemplates = [
  {
    id: 'mannheim-klassiker',
    name: 'Mannheim Klassiker',
    emoji: '🏛️',
    description: 'Die Top-Sehenswürdigkeiten der Quadratestadt — vom Wasserturm bis zum Barockschloss.',
    color: '#0ea5e9', // sky-500
    estimatedMinutes: 90,
    poiIds: [
      'wasserturm',
      'schloss_mannheim',
      'paradeplatz',
      'marktplatz',
      'kunsthalle',
      'nationaltheater',
      'luisenpark',
    ],
  },
  {
    id: 'kunst-kultur-walk',
    name: 'Kunst & Kultur Walk',
    emoji: '🎨',
    description: 'Museen, Theater und kreative Orte — Mannheims kulturelle Seele entdecken.',
    color: '#a855f7', // purple-500
    estimatedMinutes: 75,
    poiIds: [
      'kunsthalle',
      'nationaltheater',
      'rem',
      'zeughaus',
      'rosengarten',
      'teehaus',
      'popakademie',
    ],
  },
  {
    id: 'hidden-gems',
    name: 'Hidden Gems',
    emoji: '💎',
    description: 'Abseits der Touristenpfade — Subkultur, Streetart und urbane Entdeckungen.',
    color: '#f59e0b', // amber-500
    estimatedMinutes: 60,
    poiIds: [
      'jungbusch',
      'popakademie',
      'hafen',
      'collini_center',
      'planetarium',
      'moschee',
      'teehaus',
    ],
  },
  {
    id: 'architektur-tour',
    name: 'Architektur Tour',
    emoji: '🏗️',
    description: 'Barock trifft Brutalismus — ein Streifzug durch Mannheims Baugeschichte.',
    color: '#10b981', // emerald-500
    estimatedMinutes: 80,
    poiIds: [
      'schloss_mannheim',
      'jesuitenkirche',
      'wasserturm',
      'rosengarten',
      'kunsthalle',
      'friedrichsplatz',
      'fernmeldeturm',
      'kurpfalzbruecke',
    ],
  },
];

export default tourTemplates;
