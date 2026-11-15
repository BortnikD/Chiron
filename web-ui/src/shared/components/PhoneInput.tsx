'use client';

import React, { useCallback } from 'react';
import { formatPhoneInput, normalizePhone } from '@/shared/lib/formatters';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNormalizedChange?: (normalized: string) => void;
}

/**
 * Унифицированное поле ввода номера телефона с автоматической маской +7 (XXX) XXX-XX-XX.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onNormalizedChange, className = 'input', placeholder = '+7 (___) ___-__-__', ...rest }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const formatted = formatPhoneInput(raw);
        e.target.value = formatted;
        onChange(e);
        if (onNormalizedChange) {
          onNormalizedChange(normalizePhone(formatted));
        }
      },
      [onChange, onNormalizedChange]
    );

    return (
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        className={className}
        placeholder={placeholder}
        value={formatPhoneInput(value)}
        onChange={handleChange}
        {...rest}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
