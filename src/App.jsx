import React, { useState } from 'react';
import { TourProvider, useTourContext } from './context/TourContext';
import { api } from './services/api';
import MapContainer from './components/MapContainer';
import TourCockpit from './components/TourCockpit';
import DiscoveryOverlay from './components/DiscoveryOverlay';
import ProfileOverlay from './components/ProfileOverlay';
import TourOverlay from './components/TourOverlay';
import ToastContainer, { showToast } from './components/ToastContainer';

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

  return (
    <TourProvider>
      <div className="relative h-screen w-full overflow-hidden bg-slate-950">
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

          {/* Overlays */}
          <DiscoveryOverlay 
            isOpen={activeTab === 'discover'} 
            onClose={() => setActiveTab('map')} 
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
