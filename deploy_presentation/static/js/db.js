/**
 * CityWhisper Database Layer (IndexedDB)
 * Handles offline persistence for POIs, Routes, and Settings.
 */

const DB_NAME = 'CityWhisperDB';
const DB_VERSION = 1;

let db = null;

/**
 * Initialize the database
 */
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Store for Points of Interest
            if (!db.objectStoreNames.contains('pois')) {
                db.createObjectStore('pois', { keyPath: 'id' });
            }

            // Store for Routes
            if (!db.objectStoreNames.contains('routes')) {
                db.createObjectStore('routes', { keyPath: 'id', autoIncrement: true });
            }

            // Store for App Settings / State
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB initialized successfully');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Save POIs to database
 */
async function savePOIs(pois) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pois'], 'readwrite');
        const store = transaction.objectStore('pois');

        pois.forEach(poi => {
            store.put(poi);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Get all POIs from database
 */
async function getAllPOIs() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pois'], 'readonly');
        const store = transaction.objectStore('pois');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Save a route to database
 */
async function saveRoute(routeData) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['routes'], 'readwrite');
        const store = transaction.objectStore('routes');
        
        // Add timestamp
        routeData.timestamp = Date.now();
        
        const request = store.put(routeData);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get the last saved route
 */
async function getLastRoute() {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['routes'], 'readonly');
        const store = transaction.objectStore('routes');
        const request = store.getAll();

        request.onsuccess = () => {
            const routes = request.result;
            if (routes.length === 0) return resolve(null);
            // Sort by timestamp descending
            routes.sort((a, b) => b.timestamp - a.timestamp);
            resolve(routes[0]);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Save a setting
 */
async function saveSetting(key, value) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a setting
 */
async function getSetting(key) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(request.error);
    });
}
