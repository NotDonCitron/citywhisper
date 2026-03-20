import React, { useState, useEffect, useCallback } from 'react';
import { TourProvider, useTourContext } from './context/TourContext';
import { api } from './services/api';
import MapContainer from './components/MapContainer';
import TourCockpit from './components/TourCockpit';
import DiscoveryOverlay from './components/DiscoveryOverlay';
import ProfileOverlay from './components/ProfileOverlay';
import TourOverlay from './components/TourOverlay';
import ToastContainer, { showToast } from './components/ToastContainer';
import PoiPreview from './components/PoiPreview';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';

// PWA Install Banner component
const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install prompt outcome:', outcome);
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDeferredPrompt(null);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-auto animate-slide-down">
      <div className="mx-4 mt-3 bg-slate-800/95 backdrop-blur-xl border border-sky-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-sky-400">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <span className="text-white/90 text-sm font-medium truncate">CityWhisper installieren</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Installieren
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/40 hover:text-white/70 p-1.5 transition-colors"
            aria-label="Schliessen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Internal component to handle the Auto-Demo logic with access to TourContext
const AutoDemoButton = () => {
  const { setSelectedPois, startTour, pois } = useTourContext();
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const runAutoDemo = async () => {
    if (isAutoLoading) return;
    setIsAutoLoading(true);
    console.log("[Auto-Demo] Starting automated test sequence...");

    // UNLOCK AUDIO: Play a tiny silent sound to satisfy browser autoplay policies
    try {
      const audio = new Audio();
      audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA== ";
      await audio.play();
    } catch (e) {
      console.warn("[Auto-Demo] Audio unlock failed (expected in some environments):", e);
    }

    try {
      // 1. Ensure we have POIs
      let testPois = pois;
      if (testPois.length === 0) {
        testPois = await api.fetchPois();
      }
      
      // 2. Select first 3 POIs
      const selected = testPois.slice(0, 3);
      setSelectedPois(selected);
      console.log(`[Auto-Demo] Selected ${selected.length} POIs`);

      // 3. Fetch Route
      const routeData = await api.fetchRoute(selected.map(p => p.id));
      console.log("[Auto-Demo] Route fetched successfully");

      // 4. Start Tour with Simulation
      await startTour(routeData, true);
      console.log("[Auto-Demo] Simulation started! Enjoy the ride.");
    } catch (err) {
      console.error("[Auto-Demo] Failed:", err);
      showToast("Auto-Demo fehlgeschlagen: " + err.message);
    } finally {
      setIsAutoLoading(false);
    }
  };

  return (
    <button 
      onClick={runAutoDemo}
      disabled={isAutoLoading}
      className="bg-orange-500 hover:bg-orange-400 text-white p-2.5 rounded-full shadow-lg border border-white/20 pointer-events-auto transition-all active:scale-90 flex items-center gap-2 group"
      title="Quick Test: Auto Demo"
    >
      <span className={isAutoLoading ? 'animate-spin' : ''}>
        {isAutoLoading ? '⏳' : '🚀'}
      </span>
      <span className="text-[10px] font-black uppercase tracking-tighter hidden group-hover:inline">Auto Demo</span>
    </button>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('map');

  // Onboarding flow state: 'splash' → 'onboarding' → 'app'
  const isOnboarded = localStorage.getItem('cw_onboarded') === 'true';
  const [appPhase, setAppPhase] = useState(isOnboarded ? 'app' : 'splash');

  const handleSplashFinished = useCallback(() => {
    setAppPhase('onboarding');
  }, []);

  const handleOnboardingFinished = useCallback(() => {
    setAppPhase('app');
  }, []);

  return (
    <TourProvider>
      <div className="relative h-screen w-full overflow-hidden bg-slate-950">
        {/* Splash Screen — first-time only */}
        {appPhase === 'splash' && (
          <SplashScreen onFinished={handleSplashFinished} />
        )}

        {/* Onboarding — after splash, before app */}
        {appPhase === 'onboarding' && (
          <Onboarding onFinished={handleOnboardingFinished} />
        )}

        {/* PWA Install Banner */}
        <PwaInstallBanner />
        {/* Toast notifications */}
        <ToastContainer />
        {/* Map Layer */}
        <MapContainer />

        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-[100] pointer-events-none">
          {/* Top Bar */}
          <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-[100] pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2">
              <span className="font-bold text-[#0ea5e9]">City</span><span className="text-white">Whisper</span>
            </div>
            
            {/* Auto-Demo Button */}
            <AutoDemoButton />
          </div>

          {/* Active Tour Cockpit */}
          <div className="pointer-events-auto">
            <TourCockpit />
          </div>

          {/* POI Preview (tap on map marker) */}
          <PoiPreview />

          {/* Overlays */}
          <DiscoveryOverlay
            isOpen={activeTab === 'discover'}
            onClose={() => setActiveTab('map')}
            onNavigateToTour={() => setActiveTab('tour')}
          />
          
          <TourOverlay
            isOpen={activeTab === 'tour'} 
            onClose={() => setActiveTab('map')} 
          />
          
          <ProfileOverlay 
            isOpen={activeTab === 'profile'} 
            onClose={() => setActiveTab('map')} 
          />

          {/* Bottom Nav */}
          <div className="fixed bottom-6 left-6 right-6 h-[80px] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] flex justify-around items-center z-[500] pointer-events-auto shadow-2xl shadow-black/50">
            <button 
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'map' ? 'text-sky-400 scale-110' : 'text-white/30 hover:text-white/60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${activeTab === 'map' ? 'bg-sky-500/20 shadow-lg shadow-sky-500/10' : ''}`}>
                <span className="text-2xl">📍</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em]">Karte</span>
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'discover' ? 'text-sky-400 scale-110' : 'text-white/30 hover:text-white/60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${activeTab === 'discover' ? 'bg-sky-500/20 shadow-lg shadow-sky-500/10' : ''}`}>
                <span className="text-2xl">✨</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em]">Entdecken</span>
            </button>
            <button 
              onClick={() => setActiveTab('tour')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'tour' ? 'text-sky-400 scale-110' : 'text-white/30 hover:text-white/60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${activeTab === 'tour' ? 'bg-sky-500/20 shadow-lg shadow-sky-500/10' : ''}`}>
                <span className="text-2xl">🗺️</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em]">Tour</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'profile' ? 'text-sky-400 scale-110' : 'text-white/30 hover:text-white/60'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-sky-500/20 shadow-lg shadow-sky-500/10' : ''}`}>
                <span className="text-2xl">👤</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.1em]">Profil</span>
            </button>
          </div>
        </div>
      </div>
    </TourProvider>
  );
}

export default App;
