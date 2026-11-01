'use client';

import React from 'react';
import { Check, Syringe } from 'lucide-react';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="ab-art">
      <svg
        className="ab-ill"
        viewBox="0 0 560 460"
        role="img"
        aria-label="Кошка и собака — пациенты клиники"
      >
        <defs>
          <radialGradient id="ab-glow" cx="50%" cy="55%" r="55%">
            <stop offset="0" stopColor="#8fdc3a" stopOpacity=".30" />
            <stop offset="1" stopColor="#8fdc3a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ab-fur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f1c58c" />
            <stop offset="1" stopColor="#e2a865" />
          </linearGradient>
          <linearGradient id="ab-cat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9aa6b8" />
            <stop offset="1" stopColor="#7d899c" />
          </linearGradient>
        </defs>

        {/* Фоновое свечение и орбита */}
        <circle cx="290" cy="250" r="215" fill="url(#ab-glow)" />
        <circle
          cx="290"
          cy="250"
          r="168"
          fill="none"
          stroke="#8fdc3a"
          strokeOpacity=".35"
          strokeWidth="1.5"
          strokeDasharray="3 7"
        />

        {/* Тень под иллюстрацией */}
        <ellipse cx="300" cy="402" rx="190" ry="16" fill="#000" opacity=".18" />

        {/* Линия кардиограммы */}
        <path
          d="M16 330 H62 l12 -30 l16 56 l14 -78 l14 52 H156"
          fill="none"
          stroke="#8fdc3a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".9"
        />

        {/* Иллюстрация собаки */}
        <g transform="translate(330 120)">
          {/* Хвостик */}
          <path
            d="M118 240 q48 -10 44 -62"
            fill="none"
            stroke="#e2a865"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Тело */}
          <path
            d="M10 160 q-6 -40 40 -58 h40 q46 18 40 58 l10 110 q0 14 -14 14 h-112 q-14 0 -14 -14 z"
            fill="url(#ab-fur)"
          />
          {/* Животик */}
          <path
            d="M40 120 q30 -14 60 0 q8 60 -30 96 q-38 -36 -30 -96z"
            fill="#f8e2c1"
          />
          {/* Лапки */}
          <rect x="34" y="200" width="30" height="86" rx="14" fill="#eab676" />
          <rect x="86" y="200" width="30" height="86" rx="14" fill="#eab676" />
          <ellipse cx="49" cy="284" rx="20" ry="10" fill="#f8e2c1" />
          <ellipse cx="101" cy="284" rx="20" ry="10" fill="#f8e2c1" />
          {/* Ошейник и медальон */}
          <path
            d="M22 112 q53 26 106 0"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="75" cy="132" r="12" fill="#8fdc3a" />
          <path
            d="M75 125 v14 M68 132 h14"
            stroke="#1d2a0c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Голова */}
          <ellipse cx="75" cy="56" rx="62" ry="56" fill="url(#ab-fur)" />
          {/* Ушки */}
          <path
            d="M22 26 q-34 6 -30 62 q4 22 22 14 q14 -30 22 -64z"
            fill="#b97b3f"
          />
          <path
            d="M128 26 q34 6 30 62 q-4 22 -22 14 q-14 -30 -22 -64z"
            fill="#b97b3f"
          />
          {/* Мордочка */}
          <ellipse cx="75" cy="80" rx="34" ry="26" fill="#f8e2c1" />
          <ellipse cx="75" cy="66" rx="12" ry="9" fill="#2b2b2b" />
          <path
            d="M75 75 v10 q-8 8 -16 2 M75 85 q8 8 16 2"
            fill="none"
            stroke="#2b2b2b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M68 92 q7 12 14 0" fill="#f07a7a" />
          {/* Глазки */}
          <circle cx="50" cy="44" r="7" fill="#2b2b2b" />
          <circle cx="100" cy="44" r="7" fill="#2b2b2b" />
          <circle cx="52" cy="42" r="2.2" fill="#fff" />
          <circle cx="102" cy="42" r="2.2" fill="#fff" />
          {/* Пятнышко над бровью */}
          <ellipse cx="100" cy="28" rx="16" ry="9" fill="#e2a865" />
        </g>

        {/* Иллюстрация кошки */}
        <g transform="translate(150 196)">
          {/* Хвостик кошки */}
          <path
            d="M118 178 q50 4 46 -46 q-2 -20 -18 -18"
            fill="none"
            stroke="#7d899c"
            strokeWidth="13"
            strokeLinecap="round"
          />
          {/* Тело кошки */}
          <path
            d="M14 120 q-4 -44 36 -54 h36 q40 10 36 54 l6 74 q0 12 -12 12 h-96 q-12 0 -12 -12 z"
            fill="url(#ab-cat)"
          />
          {/* Грудка */}
          <path
            d="M44 92 q24 -10 48 0 q4 46 -24 70 q-28 -24 -24 -70z"
            fill="#d7dde6"
          />
          {/* Лапки кошки */}
          <rect x="34" y="150" width="24" height="56" rx="11" fill="#8a96a9" />
          <rect x="78" y="150" width="24" height="56" rx="11" fill="#8a96a9" />
          <ellipse cx="46" cy="205" rx="15" ry="8" fill="#d7dde6" />
          <ellipse cx="90" cy="205" rx="15" ry="8" fill="#d7dde6" />
          {/* Голова и ушки */}
          <path d="M18 8 l14 30 M118 8 l-14 30" stroke="none" />
          <path
            d="M16 4 l30 26 h44 l30 -26 l-2 46 q-6 40 -50 44 q-44 -4 -50 -44z"
            fill="url(#ab-cat)"
          />
          <path d="M22 14 l18 16 l-16 6z M114 14 l-18 16 l16 6z" fill="#f2b6c0" />
          {/* Полоски на лбу */}
          <path
            d="M56 34 l-4 12 M68 32 v13 M80 34 l4 12"
            stroke="#6b7689"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Мордочка кошки */}
          <ellipse cx="68" cy="74" rx="20" ry="13" fill="#d7dde6" />
          <path d="M62 66 h12 l-6 7z" fill="#e88a9a" />
          <path
            d="M68 73 v5 q-6 6 -11 1 M68 78 q6 6 11 1"
            fill="none"
            stroke="#4a5262"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Глазки кошки */}
          <ellipse cx="48" cy="58" rx="6" ry="7.5" fill="#2e3440" />
          <ellipse cx="88" cy="58" rx="6" ry="7.5" fill="#2e3440" />
          <circle cx="50" cy="55.5" r="2" fill="#fff" />
          <circle cx="90" cy="55.5" r="2" fill="#fff" />
          {/* Усики */}
          <path
            d="M40 74 h-24 M42 80 l-22 5 M96 74 h24 M94 80 l22 5"
            stroke="#eef1f5"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity=".8"
          />
        </g>

        {/* Зеленый значок сердца */}
        <g transform="translate(250 70)">
          <circle r="30" fill="#8fdc3a" />
          <path
            d="M0 12 C-22 -2 -16 -20 -6 -18 C-2 -17 0 -14 0 -12 C0 -14 2 -17 6 -18 C16 -20 22 -2 0 12z"
            fill="#16210a"
          />
        </g>

        {/* Отпечатки лапок */}
        <g fill="#8fdc3a" opacity=".55">
          <g transform="translate(96 150) rotate(-20)">
            <ellipse cx="0" cy="8" rx="9" ry="7" />
            <circle cx="-9" cy="-4" r="3.6" />
            <circle cx="-3" cy="-9" r="3.6" />
            <circle cx="4" cy="-9" r="3.6" />
            <circle cx="10" cy="-4" r="3.6" />
          </g>
          <g transform="translate(70 214) rotate(-35) scale(.75)">
            <ellipse cx="0" cy="8" rx="9" ry="7" />
            <circle cx="-9" cy="-4" r="3.6" />
            <circle cx="-3" cy="-9" r="3.6" />
            <circle cx="4" cy="-9" r="3.6" />
            <circle cx="10" cy="-4" r="3.6" />
          </g>
        </g>

        {/* Значки медицинского плюса */}
        <g stroke="#8fdc3a" strokeWidth="3" strokeLinecap="round">
          <path d="M500 110 v18 M491 119 h18" />
          <path d="M150 96 v12 M144 102 h12" opacity=".7" />
        </g>
      </svg>

      {/* Всплывающий бейдж 1: Запись подтверждена */}
      <div className="ab-float ab-f1">
        <span className="avatar w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-500 shrink-0">
          <Check className="w-4 h-4 text-emerald-500" />
        </span>
        <div className="flex flex-col leading-tight">
          <strong className="text-xs font-semibold text-[var(--foreground)]">
            Запись подтверждена
          </strong>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            Сегодня, 11:30 · терапевт
          </span>
        </div>
      </div>

      {/* Всплывающий бейдж 2: Напоминание о ревакцинации */}
      <div className="ab-float ab-f2">
        <span className="avatar w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-500 shrink-0">
          <Syringe className="w-4 h-4 text-amber-500" />
        </span>
        <div className="flex flex-col leading-tight">
          <strong className="text-xs font-semibold text-[var(--foreground)]">
            Ревакцинация
          </strong>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            через 5 дней · напомним
          </span>
        </div>
      </div>
    </div>
  );
};
