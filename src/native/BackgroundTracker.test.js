import { BackgroundTracker } from './BackgroundTracker';
import { registerPlugin } from "@capacitor/core";
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/core', () => ({
  registerPlugin: vi.fn(() => ({
    addWatcher: vi.fn(),
    removeWatcher: vi.fn(),
  })),
}));

describe('BackgroundTracker', () => {
  let mockBackgroundGeolocation;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBackgroundGeolocation = registerPlugin("BackgroundGeolocation");
  });

  it('should start tracking', async () => {
    mockBackgroundGeolocation.addWatcher.mockResolvedValue('watcher-id');
    const onLocationUpdate = vi.fn();
    
    const watcherId = await BackgroundTracker.startTracking(onLocationUpdate);
    
    expect(watcherId).toBe('watcher-id');
    expect(mockBackgroundGeolocation.addWatcher).toHaveBeenCalled();
  });

  it('should not start tracking if already active', async () => {
    mockBackgroundGeolocation.addWatcher.mockResolvedValue('watcher-id');
    await BackgroundTracker.startTracking(vi.fn());
    
    const watcherId = await BackgroundTracker.startTracking(vi.fn());
    
    expect(watcherId).toBe('watcher-id');
    expect(mockBackgroundGeolocation.addWatcher).toHaveBeenCalledTimes(1);
  });

  it('should stop tracking', async () => {
    mockBackgroundGeolocation.addWatcher.mockResolvedValue('watcher-id');
    await BackgroundTracker.startTracking(vi.fn());
    
    await BackgroundTracker.stopTracking();
    
    expect(mockBackgroundGeolocation.removeWatcher).toHaveBeenCalledWith({ id: 'watcher-id' });
    expect(BackgroundTracker.watcherId).toBe(null);
  });

  it('should call onLocationUpdate when a location is received', async () => {
    let callback;
    mockBackgroundGeolocation.addWatcher.mockImplementation((options, cb) => {
      callback = cb;
      return Promise.resolve('watcher-id');
    });

    const onLocationUpdate = vi.fn();
    await BackgroundTracker.startTracking(onLocationUpdate);

    const mockLocation = {
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      bearing: 180,
      speed: 1.5,
      time: 123456789
    };

    callback(mockLocation, null);

    expect(onLocationUpdate).toHaveBeenCalledWith({
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      heading: 180,
      speed: 1.5,
      timestamp: 123456789
    });
  });
});
