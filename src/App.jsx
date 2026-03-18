import React from 'react';
import { TourProvider } from './context/TourContext';
import MapContainer from './components/MapContainer';
import TourCockpit from './components/TourCockpit';

function App() {
  return (
    <TourProvider>
      <div className="relative h-screen w-full overflow-hidden bg-slate-950">
        {/* Map Layer */}
        <MapContainer />

        {/* UI Overlay Layer */}
        <div className="absolute inset-0 z-[100] pointer-events-none">
          {/* Top Bar (Simplified for now) */}
          <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-[100] pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 pointer-events-auto flex items-center gap-2">
              <span className="font-bold text-[#0ea5e9]">City</span>Whisper
            </div>
          </div>

          {/* Active Tour Cockpit */}
          <div className="pointer-events-auto">
            <TourCockpit />
          </div>

          {/* Bottom Nav Placeholder */}
          <div className="fixed bottom-0 left-0 right-0 h-[70px] bg-slate-900/85 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-[500] pointer-events-auto">
            <div className="flex flex-col items-center gap-1 text-sky-500">
              <span className="text-xl">📍</span>
              <span className="text-[10px] font-bold uppercase">Karte</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/40">
              <span className="text-xl">✨</span>
              <span className="text-[10px] font-bold uppercase">Entdecken</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/40">
              <span className="text-xl">🗺️</span>
              <span className="text-[10px] font-bold uppercase">Tour</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/40">
              <span className="text-xl">👤</span>
              <span className="text-[10px] font-bold uppercase">Profil</span>
            </div>
          </div>
        </div>
      </div>
    </TourProvider>
  );
}

export default App;
