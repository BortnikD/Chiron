'use client';

import React, { useMemo } from 'react';
import { Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { THEME_SAFE_PALETTE, validateThemeSafeColor } from '@/shared/lib/constants';

export interface ThemeSafeColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  defaultColor?: string;
  onReset?: () => void;
  label?: string;
  id?: string;
  previewLabel?: string;
}

/**
 * Палитра выбора цвета с ограничением на цвета, безопасные для обеих тем (Light/Dark).
 * Предоставляет быстрый выбор из 16 калиброванных пресетов, точный ввод HEX
 * и перцептивную валидацию контрастности.
 */
export const ThemeSafeColorPicker: React.FC<ThemeSafeColorPickerProps> = ({
  value,
  onChange,
  defaultColor = '#3B82F6',
  onReset,
  label = 'Цвет темы',
  id = 'theme-color-input',
  previewLabel = 'Образец',
}) => {
  const currentColor = (value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : defaultColor).toUpperCase();

  const validation = useMemo(() => {
    if (!value) return { valid: true };
    return validateThemeSafeColor(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim();
    if (raw && !raw.startsWith('#') && /^[0-9A-Fa-f]{1,6}$/.test(raw)) {
      raw = `#${raw}`;
    }
    onChange(raw.toUpperCase());
  };

  return (
    <div className="col" style={{ gap: '8px', width: '100%' }}>
      <div className="row between" style={{ alignItems: 'center' }}>
        <label className="field-label" htmlFor={id} style={{ margin: 0 }}>
          {label} <span className="small muted">(адаптирован к светлой и тёмной теме)</span>
        </label>
        {onReset && value && value.toUpperCase() !== defaultColor.toUpperCase() && (
          <button
            type="button"
            className="btn btn-ghost btn-xs row"
            style={{ gap: '4px', fontSize: '11px', padding: '2px 6px', height: '22px' }}
            onClick={onReset}
          >
            <RotateCcw size={11} />
            Сбросить
          </button>
        )}
      </div>

      {/* Быстрая палитра калиброванных цветов */}
      <div
        className="row wrap"
        style={{
          gap: '6px',
          padding: '6px',
          backgroundColor: 'var(--card-subtle, rgba(255, 255, 255, 0.03))',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
        role="group"
        aria-label="Безопасная палитра цветов"
      >
        {THEME_SAFE_PALETTE.map((swatch) => {
          const isSelected = currentColor.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.hex}
              type="button"
              className="color-swatch-btn"
              onClick={() => onChange(swatch.hex)}
              title={`${swatch.name} (${swatch.hex})`}
              aria-label={`${swatch.name} ${swatch.hex}`}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: swatch.hex,
                border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.2)',
                boxShadow: isSelected
                  ? '0 0 0 2px var(--primary), 0 2px 4px rgba(0,0,0,0.25)'
                  : 'inset 0 0 0 1px rgba(255,255,255,0.15)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                transform: isSelected ? 'scale(1.1)' : 'none',
              }}
            >
              {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* Поле точного ввода HEX + превью */}
      <div className="row" style={{ gap: '8px', alignItems: 'center', width: '100%' }}>
        <input
          id={id}
          className="input"
          maxLength={7}
          placeholder={defaultColor}
          value={value}
          onChange={handleTextChange}
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        />

        {/* Превью-бейдж, демонстрирующий как цвет выглядит в текущей теме */}
        <div
          className="row"
          style={{
            gap: '6px',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '6px',
            border: `1px solid color-mix(in srgb, ${currentColor} 50%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${currentColor} 15%, transparent)`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: currentColor,
              whiteSpace: 'nowrap',
            }}
          >
            {previewLabel}
          </span>
        </div>
      </div>

      {/* Предупреждение о неадаптивном цвете (слишком темный или слишком светлый) */}
      {!validation.valid && validation.warning && (
        <div
          className="row"
          style={{
            gap: '6px',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--st-cancelled-fg, #ef4444)',
            marginTop: '2px',
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          <span>{validation.warning}</span>
        </div>
      )}
    </div>
  );
};
