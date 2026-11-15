'use client';

import React, { useRef, useCallback, useLayoutEffect } from 'react';
import { formatPhoneInput, normalizePhone } from '@/shared/lib/formatters';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNormalizedChange?: (normalized: string) => void;
}

function findCursorPositionAfterDigits(formatted: string, targetDigitsCount: number): number {
  if (targetDigitsCount <= 0) {
    return 0;
  }
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      count++;
      if (count === targetDigitsCount) {
        let nextPos = i + 1;
        if (formatted[nextPos] === ')') nextPos++;
        if (formatted[nextPos] === ' ') nextPos++;
        if (formatted[nextPos] === '-') nextPos++;
        return nextPos;
      }
    }
  }
  return formatted.length;
}

/**
 * Унифицированное поле ввода номера телефона с автоматической маской +7 (XXX) XXX-XX-XX
 * и поддержкой плавного стирания символов Backspace и сохранения положения курсора.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      onNormalizedChange,
      className = 'input',
      placeholder = '+7 (___) ___-__-__',
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const nextCursorRef = useRef<number | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    useLayoutEffect(() => {
      if (nextCursorRef.current !== null && inputRef.current) {
        const pos = Math.min(nextCursorRef.current, inputRef.current.value.length);
        inputRef.current.setSelectionRange(pos, pos);
        nextCursorRef.current = null;
      }
    });

    const triggerChange = useCallback(
      (input: HTMLInputElement, nextVal: string, targetCursorPos?: number) => {
        if (targetCursorPos !== undefined) {
          nextCursorRef.current = targetCursorPos;
        }
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeSetter?.call(input, nextVal);
        const ev = new Event('input', { bubbles: true });
        input.dispatchEvent(ev);
      },
      []
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const { selectionStart, selectionEnd, value: curVal } = input;

        if (e.key === 'Backspace') {
          // Если выделен диапазон символов — разрешаем стандартное удаление диапазона
          if (selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
            onKeyDown?.(e);
            return;
          }

          if (selectionStart !== null && selectionStart > 0) {
            const digitsOnly = curVal.replace(/\D/g, '');

            // Если в поле остался только префикс "+7" или "+7 (" и пользователь нажимает Backspace — очищаем поле
            if (
              selectionStart <= 4 &&
              (digitsOnly === '7' || digitsOnly === '8' || digitsOnly === '')
            ) {
              e.preventDefault();
              triggerChange(input, '', 0);
              return;
            }

            const charBefore = curVal[selectionStart - 1];
            // Если перед курсором форматирующий символ (')', '-', ' ', '('), перехватываем и удаляем предыдущую цифру
            if (!/\d/.test(charBefore)) {
              e.preventDefault();
              let digitIdx = -1;
              for (let i = selectionStart - 1; i >= 0; i--) {
                if (/\d/.test(curVal[i])) {
                  digitIdx = i;
                  break;
                }
              }

              if (digitIdx !== -1) {
                const digitsBefore = (curVal.slice(0, digitIdx).match(/\d/g) || []).length;
                if (digitsBefore === 0 && digitsOnly.length <= 1) {
                  triggerChange(input, '', 0);
                  return;
                }

                const nextRaw = curVal.slice(0, digitIdx) + curVal.slice(digitIdx + 1);
                const formatted = formatPhoneInput(nextRaw);
                const newPos = findCursorPositionAfterDigits(formatted, digitsBefore);
                triggerChange(input, formatted, newPos);
                return;
              }
            }
          }
        }

        onKeyDown?.(e);
      },
      [onKeyDown, triggerChange]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const cursor = e.target.selectionStart ?? raw.length;
        const digitsBeforeCursor = (raw.slice(0, cursor).match(/\d/g) || []).length;

        const formatted = formatPhoneInput(raw);
        e.target.value = formatted;

        const newPos = findCursorPositionAfterDigits(formatted, digitsBeforeCursor);
        nextCursorRef.current = newPos;

        onChange(e);
        if (onNormalizedChange) {
          onNormalizedChange(normalizePhone(formatted));
        }
      },
      [onChange, onNormalizedChange]
    );

    return (
      <input
        ref={setRefs}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        className={className}
        placeholder={placeholder}
        value={formatPhoneInput(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
