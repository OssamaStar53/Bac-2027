import React from 'react';

interface BadhraLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const BadhraLogo: React.FC<BadhraLogoProps> = ({ 
  className = "w-10 h-10", 
  size,
  showText = false
}) => {
  const dimension = size ? (typeof size === 'number' ? `${size}px` : size) : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 ${showText ? '' : 'shrink-0'}`}>
      <div 
        className={`relative shrink-0 aspect-square flex items-center justify-center select-none overflow-hidden rounded-full shadow-xs ${className}`}
        style={dimension ? { width: dimension, height: dimension } : undefined}
      >
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain filter drop-shadow-xs"
        >
          <defs>
            <linearGradient id="badhraGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="badhraEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="50%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
            <linearGradient id="badhraLeaf" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
            <radialGradient id="badhraGlow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#fde047" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* White Circular Backdrop */}
          <circle cx="100" cy="100" r="98" fill="#ffffff" />

          {/* Outer Gold Ring */}
          <circle cx="100" cy="100" r="95" stroke="url(#badhraGold)" strokeWidth="3" />

          {/* Deep Emerald Circular Ring */}
          <circle cx="100" cy="100" r="88" stroke="url(#badhraEmerald)" strokeWidth="8" fill="#fcfdfa" />

          {/* Thin Inner Gold Accent Ring */}
          <circle cx="100" cy="100" r="82" stroke="url(#badhraGold)" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Dawn Sun Glow */}
          <circle cx="100" cy="85" r="48" fill="url(#badhraGlow)" />

          {/* Algerian National Star & Crescent Badge at Top */}
          <g transform="translate(100, 32)">
            <circle cx="0" cy="0" r="11" fill="#ffffff" stroke="url(#badhraGold)" strokeWidth="1.2" />
            <path d="M 0,-10 A 10,10 0 0,0 0,10 Z" fill="#047857" />
            <path d="M 1.5,-6 A 6.5,6.5 0 1,1 1.5,6 A 5,5 0 1,0 1.5,-6 Z" fill="#dc2626" />
            <polygon points="3,-2 4,1 1,-0.5 5,-0.5 2,1" fill="#dc2626" />
          </g>

          {/* Radiating Light Beams */}
          <g stroke="#f59e0b" strokeWidth="1" opacity="0.45" strokeLinecap="round">
            <line x1="100" y1="80" x2="100" y2="48" />
            <line x1="100" y1="80" x2="132" y2="58" />
            <line x1="100" y1="80" x2="68" y2="58" />
            <line x1="100" y1="80" x2="142" y2="82" />
            <line x1="100" y1="80" x2="58" y2="82" />
          </g>

          {/* Left Laurel Branch */}
          <g fill="#059669" transform="translate(32, 100) scale(0.4)">
            <path d="M 0,-30 C -8,-15 -10,0 0,15 C -2,0 5,-15 0,-30 Z" />
            <path d="M -10,-10 C -20,0 -16,15 -5,22 C -8,10 -5,0 -10,-10 Z" />
            <path d="M -15,15 C -22,25 -16,38 -6,44 C -10,32 -8,22 -15,15 Z" />
          </g>

          {/* Right Laurel Branch */}
          <g fill="#059669" transform="translate(168, 100) scale(-0.4, 0.4)">
            <path d="M 0,-30 C -8,-15 -10,0 0,15 C -2,0 5,-15 0,-30 Z" />
            <path d="M -10,-10 C -20,0 -16,15 -5,22 C -8,10 -5,0 -10,-10 Z" />
            <path d="M -15,15 C -22,25 -16,38 -6,44 C -10,32 -8,22 -15,15 Z" />
          </g>

          {/* Open Book of Knowledge at the Base */}
          <g transform="translate(100, 130)">
            {/* Open Pages */}
            <path 
              d="M -42,-6 C -20,-14 0,-7 0,6 C 0,-7 20,-14 42,-6 L 39,12 C 18,5 0,12 0,20 C 0,12 -18,5 -39,12 Z" 
              fill="#ffffff" 
              stroke="#047857" 
              strokeWidth="2" 
            />
            {/* Book Spine */}
            <line x1="0" y1="6" x2="0" y2="20" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
            {/* Lines of text */}
            <line x1="-30" y1="2" x2="-8" y2="-1" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="-30" y1="7" x2="-8" y2="4" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="8" y1="-1" x2="30" y2="2" stroke="#cbd5e1" strokeWidth="1.2" />
            <line x1="8" y1="4" x2="30" y2="7" stroke="#cbd5e1" strokeWidth="1.2" />
          </g>

          {/* The Growing Green Sprout (بذرة غد) */}
          <g transform="translate(100, 108)">
            {/* Main Central Stem */}
            <path d="M 0,22 Q 0,4 0,-18" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            
            {/* Left Leaf */}
            <path 
              d="M 0,-10 C -22,-30 -42,-18 -46,-4 C -30,6 -14,-1 0,-6 Z" 
              fill="url(#badhraLeaf)" 
              stroke="#065f46" 
              strokeWidth="1.5" 
            />
            {/* Left leaf rib */}
            <path d="M 0,-8 Q -24,-10 -38,-5" stroke="#047857" strokeWidth="1" fill="none" opacity="0.7" />

            {/* Right Leaf */}
            <path 
              d="M 0,-10 C 22,-30 42,-18 46,-4 C 30,6 14,-1 0,-6 Z" 
              fill="url(#badhraLeaf)" 
              stroke="#065f46" 
              strokeWidth="1.5" 
            />
            {/* Right leaf rib */}
            <path d="M 0,-8 Q 24,-10 38,-5" stroke="#047857" strokeWidth="1" fill="none" opacity="0.7" />

            {/* Golden Emerging Bud / Seed at the Top */}
            <circle cx="0" cy="-22" r="5.5" fill="url(#badhraGold)" stroke="#047857" strokeWidth="1.2" />
          </g>

          {/* Bottom Golden Curved Banner with Emblem Text */}
          <g transform="translate(100, 166)">
            {/* Ribbon Background */}
            <path 
              d="M -60,0 C -30,-9 30,-9 60,0 C 50,14 -50,14 -60,0 Z" 
              fill="url(#badhraEmerald)" 
              stroke="url(#badhraGold)" 
              strokeWidth="1.8" 
            />
            {/* Ribbon ends */}
            <path d="M -60,0 L -68,-6 L -65,7 Z" fill="#022c22" stroke="url(#badhraGold)" strokeWidth="0.8" />
            <path d="M 60,0 L 68,-6 L 65,7 Z" fill="#022c22" stroke="url(#badhraGold)" strokeWidth="0.8" />
            
            {/* Text on banner */}
            <text 
              x="0" 
              y="5.5" 
              fill="#fef08a" 
              fontFamily="'Cairo', Arial, sans-serif" 
              fontSize="10" 
              fontWeight="900" 
              textAnchor="middle"
            >
              بـذرة غــد
            </text>
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-right leading-tight select-none">
          <span className="font-black text-stone-900 tracking-tight text-sm">
            جمعية بذرة غد الشبانية
          </span>
          <span className="text-[11px] font-bold text-emerald-800">
            إن صالح · شباب اليوم ... قادة الغد
          </span>
        </div>
      )}
    </div>
  );
};
