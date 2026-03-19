import React from 'react';
import { useTourContext } from '../context/TourContext';
import { X, Save } from 'lucide-react';
import { showToast } from './ToastContainer';

const ALL_CATEGORIES = ['History', 'Art', 'Subculture', 'Architecture', 'Nature', 'Food', 'Nightlife', 'Religion', 'Urban', 'Views', 'Family', 'Culture'];

const ProfileOverlay = ({ isOpen, onClose }) => {
  const { selectedCategories, toggleCategory, persona, changePersona } = useTourContext();

  if (!isOpen) return null;

  const handleSave = () => {
    showToast(`Profil gespeichert: ${persona === 'insider' ? 'Insiderin' : 'Historiker'}, ${selectedCategories.length} Interessen`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-md flex flex-col p-6 pointer-events-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Dein Profil <span className="text-sky-500">👤</span>
        </h2>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-10 pr-1 py-4">
        {/* Erzählstil Section */}
        <section>
          <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase mb-6 px-1">Dein Guide-Stil</h3>
          <div className="grid grid-cols-1 gap-4">
            <div
              onClick={() => changePersona('insider')}
              className={`p-6 rounded-[28px] flex items-center gap-5 cursor-pointer transition-all active:scale-[0.98] ${
                persona === 'insider'
                  ? 'bg-sky-500/10 border-2 border-sky-500/50'
                  : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🕶️</div>
              <div>
                <div className="font-bold text-lg text-white">Insiderin</div>
                <div className="text-xs opacity-50 text-slate-300">Locker, modern & geheimnisvoll</div>
              </div>
            </div>
            <div
              onClick={() => changePersona('historian')}
              className={`p-6 rounded-[28px] flex items-center gap-5 cursor-pointer transition-all active:scale-[0.98] ${
                persona === 'historian'
                  ? 'bg-amber-500/10 border-2 border-amber-500/50'
                  : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📜</div>
              <div>
                <div className="font-bold text-lg text-white">Historiker</div>
                <div className="text-xs opacity-50 text-slate-300">Faktisch, präzise & lehrreich</div>
              </div>
            </div>
          </div>
        </section>

        {/* Interessen Section */}
        <section>
          <div className="flex justify-between items-end mb-6 px-1">
            <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase">Deine Interessen</h3>
            <span className="text-[10px] font-bold text-white/30 uppercase">{selectedCategories.length} gewählt</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {ALL_CATEGORIES.map(cat => (
              <div
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-6 py-4 rounded-2xl border-2 text-[13px] font-bold text-center cursor-pointer transition-all active:scale-90 ${
                  selectedCategories.includes(cat)
                    ? 'bg-sky-500 border-sky-400 text-white shadow-xl shadow-sky-500/30'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                {cat}
              </div>
            ))}
          </div>
        </section>

        {/* Offline Section Placeholder */}
        <section className="pb-10">
          <h3 className="text-[11px] font-black tracking-[0.25em] text-sky-500 uppercase mb-6 px-1">System</h3>
          <div className="p-6 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div>
                <div className="text-sm text-white font-bold">Offline-Modus</div>
                <div className="text-[10px] text-white/40 font-medium">Alle Audio-Daten geladen</div>
              </div>
            </div>
            <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black tracking-widest border border-emerald-500/30">BEREIT</div>
          </div>
        </section>
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <Save size={18} /> Speichern
        </button>
      </div>
    </div>
  );
};

export default ProfileOverlay;
