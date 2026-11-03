'use client';

import React from 'react';
import { ChironLogo } from '../ui/ChironLogo';
import { PawPrint } from 'lucide-react';

export const AuthHeroMobile: React.FC = () => {
  return (
    <div className="auth-hero-m" aria-hidden="true">
        <div className="hero-grid"></div>
        <div className="ahm-glow"></div>
        <svg className="pulse-line ahm-pulse" viewBox="0 0 900 110" preserveAspectRatio="none"><path className="ghost" vectorEffect="non-scaling-stroke" d="M0 70 H330 L350 70 L364 44 L378 96 L398 12 L420 104 L438 70 H560 L574 56 L588 70 H900"></path><path vectorEffect="non-scaling-stroke" d="M0 70 H330 L350 70 L364 44 L378 96 L398 12 L420 104 L438 70 H560 L574 56 L588 70 H900"></path></svg>
        <div className="ahm-brand">
          <div className="ahm-logo"><span className="ahm-ring"></span><span className="ahm-ring r2"></span><ChironLogo size={26} /></div>
          <div className="col" style={{ gap: '2px' }}><span className="ahm-name">Chiron</span><span className="ahm-sub">Ветеринарная клиника</span></div>
          <p className="ahm-tag">Запись, история приёмов и прививки — в одном окне</p>
        </div>
        <svg className="ahm-ill" viewBox="40 40 520 400" preserveAspectRatio="xMidYMax meet">
  <defs>
    <radialGradient id="am-glow" cx="50%" cy="55%" r="55%"><stop offset="0" stopColor="#8fdc3a" stopOpacity=".30"/><stop offset="1" stopColor="#8fdc3a" stopOpacity="0"/></radialGradient>
    <linearGradient id="am-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1c58c"/><stop offset="1" stopColor="#e2a865"/></linearGradient>
    <linearGradient id="am-cat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9aa6b8"/><stop offset="1" stopColor="#7d899c"/></linearGradient>
  </defs>
  <circle cx="290" cy="250" r="215" fill="url(#am-glow)"/>
  <circle cx="290" cy="250" r="168" fill="none" stroke="#8fdc3a" strokeOpacity=".35" strokeWidth="1.5" strokeDasharray="3 7"/>
  
  <ellipse cx="300" cy="402" rx="190" ry="16" fill="#000" opacity=".18"/>
  
  

  
  <g transform="translate(330 120)">
    
    <path className="ahm-tail" d="M118 240 q48 -10 44 -62" fill="none" stroke="#e2a865" strokeWidth="16" strokeLinecap="round"/>
    
    <path d="M10 160 q-6 -40 40 -58 h40 q46 18 40 58 l10 110 q0 14 -14 14 h-112 q-14 0 -14 -14 z" fill="url(#am-fur)"/>
    
    <path d="M40 120 q30 -14 60 0 q8 60 -30 96 q-38 -36 -30 -96z" fill="#f8e2c1"/>
    
    <rect x="34" y="200" width="30" height="86" rx="14" fill="#eab676"/>
    <rect x="86" y="200" width="30" height="86" rx="14" fill="#eab676"/>
    <ellipse cx="49" cy="284" rx="20" ry="10" fill="#f8e2c1"/>
    <ellipse cx="101" cy="284" rx="20" ry="10" fill="#f8e2c1"/>
    
    <path d="M22 112 q53 26 106 0" fill="none" stroke="#3b82f6" strokeWidth="10" strokeLinecap="round"/>
    <circle cx="75" cy="132" r="12" fill="#8fdc3a"/>
    <path d="M75 125 v14 M68 132 h14" stroke="#1d2a0c" strokeWidth="3" strokeLinecap="round"/>
    
    <ellipse cx="75" cy="56" rx="62" ry="56" fill="url(#am-fur)"/>
    
    <path d="M22 26 q-34 6 -30 62 q4 22 22 14 q14 -30 22 -64z" fill="#b97b3f"/>
    <path d="M128 26 q34 6 30 62 q-4 22 -22 14 q-14 -30 -22 -64z" fill="#b97b3f"/>
    
    <ellipse cx="75" cy="80" rx="34" ry="26" fill="#f8e2c1"/>
    <ellipse cx="75" cy="66" rx="12" ry="9" fill="#2b2b2b"/>
    <path d="M75 75 v10 q-8 8 -16 2 M75 85 q8 8 16 2" fill="none" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round"/>
    <path d="M68 92 q7 12 14 0" fill="#f07a7a"/>
    
    <g className="ahm-blink"><circle cx="50" cy="44" r="7" fill="#2b2b2b"/><circle cx="100" cy="44" r="7" fill="#2b2b2b"/></g>
    <circle cx="52" cy="42" r="2.2" fill="#fff"/><circle cx="102" cy="42" r="2.2" fill="#fff"/>
    
    <ellipse cx="100" cy="28" rx="16" ry="9" fill="#e2a865"/>
  </g>

  
  <g transform="translate(150 196)">
    <path className="ahm-ctail" d="M118 178 q50 4 46 -46 q-2 -20 -18 -18" fill="none" stroke="#7d899c" strokeWidth="13" strokeLinecap="round"/>
    <path d="M14 120 q-4 -44 36 -54 h36 q40 10 36 54 l6 74 q0 12 -12 12 h-96 q-12 0 -12 -12 z" fill="url(#am-cat)"/>
    <path d="M44 92 q24 -10 48 0 q4 46 -24 70 q-28 -24 -24 -70z" fill="#d7dde6"/>
    <rect x="34" y="150" width="24" height="56" rx="11" fill="#8a96a9"/>
    <rect x="78" y="150" width="24" height="56" rx="11" fill="#8a96a9"/>
    <ellipse cx="46" cy="205" rx="15" ry="8" fill="#d7dde6"/><ellipse cx="90" cy="205" rx="15" ry="8" fill="#d7dde6"/>
    
    <path d="M18 8 l14 30 M118 8 l-14 30" stroke="none"/>
    <path d="M16 4 l30 26 h44 l30 -26 l-2 46 q-6 40 -50 44 q-44 -4 -50 -44z" fill="url(#am-cat)"/>
    <path d="M22 14 l18 16 l-16 6z M114 14 l-18 16 l16 6z" fill="#f2b6c0"/>
    <path d="M56 34 l-4 12 M68 32 v13 M80 34 l4 12" stroke="#6b7689" strokeWidth="3.5" strokeLinecap="round"/>
    <ellipse cx="68" cy="74" rx="20" ry="13" fill="#d7dde6"/>
    <path d="M62 66 h12 l-6 7z" fill="#e88a9a"/>
    <path d="M68 73 v5 q-6 6 -11 1 M68 78 q6 6 11 1" fill="none" stroke="#4a5262" strokeWidth="2.2" strokeLinecap="round"/>
    <g className="ahm-blink2"><ellipse cx="48" cy="58" rx="6" ry="7.5" fill="#2e3440"/><ellipse cx="88" cy="58" rx="6" ry="7.5" fill="#2e3440"/></g>
    <circle cx="50" cy="55.5" r="2" fill="#fff"/><circle cx="90" cy="55.5" r="2" fill="#fff"/>
    <path d="M40 74 h-24 M42 80 l-22 5 M96 74 h24 M94 80 l22 5" stroke="#eef1f5" strokeWidth="1.6" strokeLinecap="round" opacity=".8"/>
  </g>

  
  <g transform="translate(250 70)"><g className="ahm-heart">
    <circle r="30" fill="#8fdc3a"/>
    <path d="M0 12 C-22 -2 -16 -20 -6 -18 C-2 -17 0 -14 0 -12 C0 -14 2 -17 6 -18 C16 -20 22 -2 0 12z" fill="#16210a"/>
  </g></g>
  
  <g fill="#8fdc3a" opacity=".55">
    <g transform="translate(96 150) rotate(-20)"><ellipse cx="0" cy="8" rx="9" ry="7"/><circle cx="-9" cy="-4" r="3.6"/><circle cx="-3" cy="-9" r="3.6"/><circle cx="4" cy="-9" r="3.6"/><circle cx="10" cy="-4" r="3.6"/></g>
    <g transform="translate(70 214) rotate(-35) scale(.75)"><ellipse cx="0" cy="8" rx="9" ry="7"/><circle cx="-9" cy="-4" r="3.6"/><circle cx="-3" cy="-9" r="3.6"/><circle cx="4" cy="-9" r="3.6"/><circle cx="10" cy="-4" r="3.6"/></g>
  </g>
  
  <g stroke="#8fdc3a" strokeWidth="3" strokeLinecap="round"><path d="M500 110 v18 M491 119 h18"/><path d="M150 96 v12 M144 102 h12" opacity=".7"/></g>
</svg>
        <div className="ahm-chip"><span className="ahm-chip-ic"><PawPrint className="ic" /></span>Напомним о ревакцинации</div>
      </div>
  );
};
