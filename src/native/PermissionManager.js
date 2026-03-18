import { Geolocation } from '@capacitor/geolocation';

/**
 * Central handling for GPS and Notification permissions.
 */
export const PermissionManager = {
  /**
   * Checks the current status of geolocation permissions.
   * @returns {Promise<string>} 'granted', 'denied', or 'prompt'
   */
  async checkGeolocationStatus() {
    const status = await Geolocation.checkPermissions();
    return status.location;
  },

  /**
   * Requests geolocation permissions from the user.
   * @returns {Promise<string>} 'granted' or 'denied'
   */
  async requestGeolocation() {
    const status = await Geolocation.requestPermissions();
    return status.location;
  },

  /**
   * Comprehensive check and request flow.
   * @returns {Promise<boolean>} True if granted, false otherwise.
   */
  async ensureGeolocation() {
    let status = await this.checkGeolocationStatus();
    
    if (status === 'prompt' || status === 'prompt-with-rationale') {
      status = await this.requestGeolocation();
    }
    
    return status === 'granted';
  }
};
