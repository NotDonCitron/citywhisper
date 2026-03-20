import React, { useState, useCallback } from 'react';

const PAGES = [
  {
    emoji: '\u{1F3D9}\uFE0F',
    title: 'Entdecke deine Stadt',
    description: 'Tippe auf POIs auf der Karte und erfahre ihre Geschichte \u2014 mit KI-generierten Audio-Guides.',
  },
  {
    emoji: '\u{1F3AD}',
    title: 'Personalisiere',
    description: 'W\u00E4hle deinen Guide-Stil und deine Interessen. Die KI passt sich an.',
  },
  {
    emoji: '\u{1F6B6}',
    title: 'Lauf los',
    description: 'Plane eine Tour, lade sie offline herunter, und los geht\u2019s!',
  },
  {
    emoji: '\u2728',
    title: 'Bereit?',
    description: '',
  },
];

const Onboarding = ({ onFinished }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState('none'); // 'left' | 'none'
  const [isAnimating, setIsAnimating] = useState(false);

  const isLast = currentPage === PAGES.length - 1;

  const complete = useCallback(() => {
    localStorage.setItem('cw_onboarded', 'true');
    onFinished();
  }, [onFinished]);

  const goNext = useCallback(() => {
    if (isAnimating) return;
    if (isLast) {
      complete();
      return;
    }
    setIsAnimating(true);
    setSlideDirection('left');
    setTimeout(() => {
      setCurrentPage((p) => p + 1);
      setSlideDirection('none');
      setIsAnimating(false);
    }, 300);
  }, [isLast, isAnimating, complete]);

  const goToPage = useCallback(
    (idx) => {
      if (isAnimating || idx === currentPage) return;
      setIsAnimating(true);
      setSlideDirection('left');
      setTimeout(() => {
        setCurrentPage(idx);
        setSlideDirection('none');
        setIsAnimating(false);
      }, 300);
    },
    [isAnimating, currentPage]
  );

  const page = PAGES[currentPage];

  return (
    <div className="fixed inset-0 z-[700] bg-slate-950 flex flex-col animate-onboarding-fadein">
      {/* Skip link (not on last page) */}
      {!isLast && (
        <div className="flex justify-end p-6">
          <button
            onClick={complete}
            className="text-white/30 text-sm font-semibold hover:text-white/60 transition-colors"
          >
            &Uuml;berspringen
          </button>
        </div>
      )}
      {isLast && <div className="p-6" />}

      {/* Page content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div
          key={currentPage}
          className={`flex flex-col items-center text-center ${
            slideDirection === 'left'
              ? 'animate-onboarding-slideout'
              : 'animate-onboarding-slidein'
          }`}
        >
          {/* Big emoji */}
          <span className="text-8xl mb-8 drop-shadow-lg">{page.emoji}</span>

          {/* Title */}
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">{page.title}</h2>

          {/* Description */}
          {page.description && (
            <p className="text-base text-white/60 max-w-xs leading-relaxed">{page.description}</p>
          )}
        </div>
      </div>

      {/* Bottom section: dots + button */}
      <div className="flex flex-col items-center gap-8 pb-12 px-8">
        {/* Dot indicators */}
        <div className="flex gap-2.5">
          {PAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentPage
                  ? 'bg-sky-500 w-7'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={goNext}
          className="w-full max-w-xs bg-sky-500 hover:bg-sky-400 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          {isLast ? "Los geht\u2019s!" : 'Weiter'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
