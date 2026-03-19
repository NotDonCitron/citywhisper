import { registerPlugin, Capacitor } from "@capacitor/core";

const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

/**
 * Background tracking using @capacitor-community/background-geolocation.
 */
export const BackgroundTracker = {
  watcherId: null,

  /**
   * Starts persistent GPS tracking in the background.
   * @param {Function} onLocationUpdate Callback function for location updates.
   * @returns {Promise<string>} The watcher ID.
   */
  async startTracking(onLocationUpdate) {
    if (Capacitor.getPlatform() === 'web') {
      console.warn("Background tracking is not supported on web.");
      return null;
    }

    if (this.watcherId) {
      console.warn("Background tracking is already active.");
      return this.watcherId;
    }

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
              latitude: location.latitude,
              longitude: location.longitude,
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
   * Stops the background tracking.
   */
  async stopTracking() {
    if (this.watcherId) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
        console.log("Background tracking stopped.");
        this.watcherId = null;
      } catch (err) {
        console.error("Failed to stop background tracking:", err);
      }
    }
  }
};
