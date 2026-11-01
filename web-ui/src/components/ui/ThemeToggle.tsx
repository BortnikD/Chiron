'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: 'Системная', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Светлая', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Тёмная', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  const currentIcon =
    theme === 'system' ? (
      <Monitor className="w-4 h-4" />
    ) : resolvedTheme === 'dark' ? (
      <Moon className="w-4 h-4" />
    ) : (
      <Sun className="w-4 h-4" />
    );

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-icon h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
        title="Сменить тему оформления"
        aria-label="Сменить тему оформления"
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div
          className="popover"
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '150px',
            zIndex: 100,
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '10px',
            background: 'var(--popover)',
            border: '1px solid var(--border)',
          }}
        >
          {options.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className="menu-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  color: isSelected ? 'var(--primary-text)' : 'var(--foreground)',
                  fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? 'var(--island-subtle)' : 'transparent',
                }}
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
