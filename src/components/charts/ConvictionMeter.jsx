import React from 'react';

export default function ConvictionMeter({ conviction }) {
  const score = conviction?.score || 50;
  const label = conviction?.label || 'Neutral';
  
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="flex w-full flex-col items-center justify-center py-6">
      <div className="relative flex w-full max-w-[250px] items-end justify-center overflow-visible">
        
        <svg viewBox="0 0 200 110" className="w-full overflow-visible">
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke={score > 60 ? '#10b981' : score < 40 ? '#ef4444' : '#f59e0b'}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset={283 - (283 * score) / 100}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div 
          className="absolute bottom-1 left-1/2 h-[90px] w-1 origin-bottom -translate-x-1/2 rounded-t-full bg-white transition-all duration-1000 ease-out"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
           <div className="absolute -bottom-2 -left-2 h-5 w-5 rounded-full border-4 border-terminal-900 bg-white shadow-lg"></div>
        </div>

        <div className="absolute bottom-0 text-center">
          <span className="text-4xl font-bold text-white">{score}</span>
        </div>
      </div>
      
      <div className="mt-6 rounded-full bg-slate-800/50 px-4 py-1.5 border border-slate-700">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
      </div>
    </div>
  );
}
