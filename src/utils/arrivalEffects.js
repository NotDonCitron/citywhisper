/**
 * Arrival Effects — haptic feedback and synthetic sound
 * triggered when the user reaches a POI geofence.
 */

/**
 * Triggers a short vibration pattern on supported devices.
 * Pattern: buzz (100ms) – pause (50ms) – buzz (100ms)
 */
export function triggerArrivalHaptics() {
  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}

/**
 * Plays a short synthetic "arrival" chime using the Web Audio API.
 * Two-tone sine wave: 440 Hz → 880 Hz, 200ms total.
 */
export function playArrivalSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    // Clean up after playback
    osc.onended = () => ctx.close();
  } catch (e) {
    console.warn('[ArrivalEffects] Could not play arrival sound:', e);
  }
}
