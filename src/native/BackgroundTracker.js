import { registerPlugin, Capacitor } from "@capacitor/core";

const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

/**
 * Background tracking using @capacitor-community/background-geolocation.
 * Falls back to navigator.geolocation.watchPosition on web.
 */
export const BackgroundTracker = {
  watcherId: null,

  /**
   * Starts persistent GPS tracking.
   * On native: uses Capacitor BackgroundGeolocation plugin.
   * On web: uses navigator.geolocation.watchPosition.
   * Location format is always normalized to {lat, lng, accuracy, heading, speed, timestamp}.
   * @param {Function} onLocationUpdate Callback function for location updates.
   * @returns {Promise<string|number>} The watcher ID.
   */
  async startTracking(onLocationUpdate) {
    if (this.watcherId) {
      console.warn("Background tracking is already active.");
      return this.watcherId;
    }

    // Web fallback: use navigator.geolocation
    if (Capacitor.getPlatform() === 'web') {
      if (!navigator.geolocation) {
        console.error("Geolocation API not available in this browser.");
        return null;
      }

      try {
        this.watcherId = navigator.geolocation.watchPosition(
          (position) => {
            onLocationUpdate({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: position.timestamp
            });
          },
          (error) => {
            console.error("Web geolocation error:", error.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 15000
          }
        );
        console.log("Web geolocation tracking started with ID:", this.watcherId);
        return this.watcherId;
      } catch (err) {
        console.error("Failed to start web geolocation:", err);
        return null;
      }
    }

    // Native: use Capacitor BackgroundGeolocation plugin
    try {
      this.watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "Tracking your tour for location-based audio.",
          backgroundTitle: "CityWhisper Active",
          requestPermissions: true,
          stale: false,
          distanceFilter: 5 // 5 meters
        },
        (location, error) => {
          if (error) {
            console.error("Background tracking error:", error);
            return;
          }
          if (location) {
            onLocationUpdate({
              lat: location.latitude,
              lng: location.longitude,
              accuracy: location.accuracy,
              heading: location.bearing,
              speed: location.speed,
              timestamp: location.time
            });
          }
        }
      );
      console.log("Background tracking started with ID:", this.watcherId);
      return this.watcherId;
    } catch (err) {
      console.error("Failed to start background tracking:", err);
      throw err;
    }
  },

  /**
   * Stops the tracking (web or native).
   */
  async stopTracking() {
    if (this.watcherId != null) {
      try {
        if (Capacitor.getPlatform() === 'web') {
          navigator.geolocation.clearWatch(this.watcherId);
        } else {
          await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
        }
        console.log("Tracking stopped.");
        this.watcherId = null;
      } catch (err) {
        console.error("Failed to stop tracking:", err);
      }
    }
  }
};
