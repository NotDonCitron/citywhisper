import React from 'react';
import { Play, Pause, Mic } from 'lucide-react';

const AudioHUD = ({ 
  isPlaying, 
  onTogglePlay, 
  audioStatus, 
  progress, 
  waveformActive = false 
}) => {
  return (
    <div className="audio-player bg-white/5 border border-white/10 rounded-[24px] p-4 my-5 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-sky-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-sky-500/30">
            <Mic size={24} />
          </div>
          <div>
            <div className="flex items-center">
              <div className="text-[10px] font-black uppercase tracking-[0.15em] opacity-30 mb-0.5">Guide Audio</div>
              <div className={`waveform flex items-center gap-[2px] h-3 ml-2 transition-opacity duration-300 ${waveformActive ? 'opacity-100' : 'opacity-0'}`}>
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className="waveform-bar w-[2px] h-1 bg-sky-500 rounded-[1px] animate-wave" 
                    style={{ animationDelay: `${i * 0.1}s`, animationPlayState: waveformActive ? 'running' : 'paused' }}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm font-bold text-white/90">{audioStatus || 'Bereit'}</div>
          </div>
        </div>
        <button 
          onClick={onTogglePlay} 
          className="bg-white text-black w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
      </div>
      <div className="h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
        <div 
          className="h-full bg-sky-500 transition-all duration-100 linear" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default AudioHUD;
