import React, { useEffect, useState } from 'react';
import { Milk, Sparkles, CheckCircle2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onComplete, 400);
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white transition-opacity duration-400 select-none ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dairy Icon & Pulsing Halo */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-emerald-800/80 border-2 border-emerald-400/40 p-4 shadow-2xl flex items-center justify-center backdrop-blur-md">
          <img
            src="/dairy-icon.svg"
            alt="ज्योतिबा दूध संकलन केंद्र"
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>
      </div>

      {/* Official Marathi Application Title */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-center text-white drop-shadow-md mb-2">
        ज्योतिबा दूध संकलन केंद्र
      </h1>
      
      <p className="text-emerald-200/90 text-sm md:text-base font-medium tracking-wide mb-8 text-center max-w-md px-4">
        वाडी रत्नागिरी (ज्योतिबा डोंगर), ता. पन्हाळा, जि. कोल्हापूर
      </p>

      {/* Feature tags */}
      <div className="flex items-center gap-3 text-xs md:text-sm text-emerald-100 bg-emerald-800/40 border border-emerald-500/30 px-4 py-2 rounded-full mb-10 shadow-inner">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          अचूक फॅट व SNF
        </span>
        <span className="text-emerald-400/60">·</span>
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          पारदर्शक दर
        </span>
        <span className="text-emerald-400/60">·</span>
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          तातडीने पेमेंट
        </span>
      </div>

      {/* Loading indicator & skip */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-48 h-1.5 bg-emerald-950/60 rounded-full overflow-hidden border border-emerald-700/40">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300 rounded-full animate-[progress_1.6s_ease-in-out_infinite]" />
        </div>
        <button
          onClick={() => {
            setFade(true);
            setTimeout(onComplete, 300);
          }}
          className="text-xs text-emerald-300/80 hover:text-white transition-colors underline underline-offset-4 mt-2"
        >
          प्रणाली सुरू करा &rarr;
        </button>
      </div>
    </div>
  );
};
