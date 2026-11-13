'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/shared/types';
import {
  buildCommandPaletteGroups,
  buildNavItems,
  EMPTY_PALETTE_DATASET,
  loadCommandPaletteData,
  type PaletteDataset,
  type PaletteItem,
} from './shell/commandPaletteHelpers';
import { Search } from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: UserRole | null;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [dataset, setDataset] = useState<PaletteDataset>(EMPTY_PALETTE_DATASET);
  const [loadedRole, setLoadedRole] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const roleKey = role ?? 'GUEST';
    if (loadedRole === roleKey && (dataset.services.length > 0 || dataset.vets.length > 0)) {
      return;
    }
    let cancelled = false;
    loadCommandPaletteData(role)
      .then((data) => {
        if (cancelled) return;
        setDataset(data);
        setLoadedRole(roleKey);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, role, loadedRole, dataset.services.length, dataset.vets.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navigateTo = useCallback(
    (url: string) => {
      onClose();
      router.push(url);
    },
    [onClose, router]
  );

  const navItems = useMemo(() => buildNavItems(role, navigateTo), [role, navigateTo]);

  const cmdGroups = useMemo(
    () => buildCommandPaletteGroups({ query, navItems, dataset, role, navigateTo }),
    [query, navItems, dataset, role, navigateTo]
  );

  const { indexedGroups, flatItems } = useMemo(() => {
    let idx = 0;
    const flat: PaletteItem[] = [];
    const mapped = cmdGroups.map((g) => ({
      label: g.label,
      items: g.items.map((item) => {
        const itemIndex = idx++;
        flat.push(item);
        return { item, itemIndex };
      }),
    }));
    return { indexedGroups: mapped, flatItems: flat };
  }, [cmdGroups]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flatItems[selectedIndex]?.action();
    }
  };

  if (!isOpen) return null;

  const placeholder =
    role === 'ADMIN'
      ? 'Поиск: разделы, пользователи, питомцы...'
      : role === 'VETERINARIAN'
      ? 'Поиск: разделы, пациенты, записи...'
      : 'Поиск: разделы, питомцы, записи...';

  return (
    <div className="overlay overlay-top" onClick={onClose}>
      <div
        className="dialog cmd"
        role="dialog"
        aria-modal="true"
        aria-label="Быстрый поиск"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cmd-search-wrap">
          <Search className="ic cmd-search-ic" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            aria-label="Быстрый поиск"
          />
        </div>

        <div className="cmd-list">
          {indexedGroups.length === 0 ? (
            <div className="empty">
              <span className="small muted">Ничего не найдено</span>
            </div>
          ) : (
            indexedGroups.map((g) => (
              <div key={g.label} className="col" style={{ gap: '2px', marginBottom: '6px' }}>
                <div className="menu-label">{g.label}</div>
                {g.items.map(({ item, itemIndex }) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`menu-item ${itemIndex === selectedIndex ? 'active' : ''}`}
                    style={{ width: '100%' }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    onClick={item.action}
                  >
                    {item.icon}
                    <span className="mi-label">{item.label}</span>
                    {item.hint && <span className="small muted mi-hint">{item.hint}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
