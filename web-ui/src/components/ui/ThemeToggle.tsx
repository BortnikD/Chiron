'use client';

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="seg" role="radiogroup" aria-label="Тема оформления" style={{ flexWrap: 'nowrap' }}>
      <button
        type="button"
        className={`seg-item ${theme === 'system' ? 'on' : ''}`}
        style={{ padding: '0 8px' }}
        onClick={() => setTheme('system')}
        title="Системная тема"
        aria-label="Системная тема"
        aria-checked={theme === 'system'}
        role="radio"
      >
        <Monitor className="ic" style={{ width: '14px', height: '14px' }} />
      </button>
      <button
        type="button"
        className={`seg-item ${theme === 'light' ? 'on' : ''}`}
        style={{ padding: '0 8px' }}
        onClick={() => setTheme('light')}
        title="Светлая тема"
        aria-label="Светлая тема"
        aria-checked={theme === 'light'}
        role="radio"
      >
        <Sun className="ic" style={{ width: '14px', height: '14px' }} />
      </button>
      <button
        type="button"
        className={`seg-item ${theme === 'dark' ? 'on' : ''}`}
        style={{ padding: '0 8px' }}
        onClick={() => setTheme('dark')}
        title="Тёмная тема"
        aria-label="Тёмная тема"
        aria-checked={theme === 'dark'}
        role="radio"
      >
        <Moon className="ic" style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
};
