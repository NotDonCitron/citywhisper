import { PermissionManager } from './PermissionManager';
import { Geolocation } from '@capacitor/geolocation';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
  },
}));

describe('PermissionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check geolocation status', async () => {
    Geolocation.checkPermissions.mockResolvedValue({ location: 'granted' });
    const status = await PermissionManager.checkGeolocationStatus();
    expect(status).toBe('granted');
    expect(Geolocation.checkPermissions).toHaveBeenCalled();
  });

  it('should request geolocation permissions', async () => {
    Geolocation.requestPermissions.mockResolvedValue({ location: 'granted' });
    const status = await PermissionManager.requestGeolocation();
    expect(status).toBe('granted');
    expect(Geolocation.requestPermissions).toHaveBeenCalled();
  });

  it('should ensure geolocation (granted)', async () => {
    Geolocation.checkPermissions.mockResolvedValue({ location: 'granted' });
    const result = await PermissionManager.ensureGeolocation();
    expect(result).toBe(true);
    expect(Geolocation.requestPermissions).not.toHaveBeenCalled();
  });

  it('should ensure geolocation (prompt -> granted)', async () => {
    Geolocation.checkPermissions.mockResolvedValue({ location: 'prompt' });
    Geolocation.requestPermissions.mockResolvedValue({ location: 'granted' });
    const result = await PermissionManager.ensureGeolocation();
    expect(result).toBe(true);
    expect(Geolocation.requestPermissions).toHaveBeenCalled();
  });

  it('should ensure geolocation (denied)', async () => {
    Geolocation.checkPermissions.mockResolvedValue({ location: 'denied' });
    const result = await PermissionManager.ensureGeolocation();
    expect(result).toBe(false);
    expect(Geolocation.requestPermissions).not.toHaveBeenCalled();
  });
});
