import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinished }) => {
  const [phase, setPhase] = useState('logo'); // 'logo' → 'tagline' → 'fadeout' → done

  useEffect(() => {
    // Show tagline after 800ms
    const taglineTimer = setTimeout(() => setPhase('tagline'), 800);
    // Start fade-out at 2s
    const fadeTimer = setTimeout(() => setPhase('fadeout'), 2000);
    // Dismiss at 2.5s
    const dismissTimer = setTimeout(() => onFinished(), 2500);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [onFinished]);

  return (
    <div
      className={`fixed inset-0 z-[700] bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 ${
        phase === 'fadeout' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Logo */}
      <div className="animate-splash-logo flex items-baseline gap-0">
        <span className="text-5xl font-black text-[#0ea5e9] tracking-tight">City</span>
        <span className="text-5xl font-black text-white tracking-tight">Whisper</span>
      </div>

      {/* Tagline */}
      <p
        className={`mt-4 text-sm text-white/50 font-medium tracking-widest uppercase transition-opacity duration-700 ${
          phase === 'logo' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        Dein KI-Stadtf&uuml;hrer
      </p>

      {/* Subtle glow behind logo */}
      <div className="absolute w-64 h-64 rounded-full bg-sky-500/10 blur-3xl animate-splash-glow pointer-events-none" />
    </div>
  );
};

export default SplashScreen;
