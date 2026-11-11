'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Upload, AlertCircle } from 'lucide-react';
import {
  PHOTO_ACCEPT_ATTR,
  formatApiError,
  resolvePhotoUrl,
  validatePhotoFile,
  type PhotoEntity,
} from '@/shared/lib';

export interface EntityPhotoControlProps {
  photo?: PhotoEntity | null;
  previewFallback: React.ReactNode;
  previewClassName?: string;
  previewAlt?: string;
  title?: string;
  hint?: string;
  disabled?: boolean;
  /** Скрыть миниатюру-превью (например, когда крупное фото уже показано в шапке шторки) */
  hidePreview?: boolean;
  /** Мгновенная загрузка и удаление (режим редактирования существующей карточки) */
  onUpload?: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Отложенный выбор файла (режим создания новой сущности до получения ID) */
  pendingFile?: File | null;
  onSelectPendingFile?: (file: File | null) => void;
}

/**
 * Универсальный блок загрузки, замены и удаления фотографии врача или питомца.
 * Поддерживает как мгновенную загрузку через PUT/DELETE, так и отложенный выбор в формах создания.
 */
export const EntityPhotoControl: React.FC<EntityPhotoControlProps> = ({
  photo,
  previewFallback,
  previewClassName = 't-ava xl round',
  previewAlt = 'Фотография',
  title = 'Фотография',
  hint = 'JPEG или PNG до 5 МБ · обрежется в квадрат 512×512',
  disabled = false,
  hidePreview = false,
  onUpload,
  onDelete,
  pendingFile = null,
  onSelectPendingFile,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPendingPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pendingFile]);

  const savedSrc = resolvePhotoUrl(photo, 'full');
  const displaySrc = pendingPreviewUrl || savedSrc;

  useEffect(() => {
    setImgFailed(false);
    setError(null);
  }, [displaySrc]);

  const hasPhoto = Boolean(displaySrc && !imgFailed);
  const isBusy = busy || disabled;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    const validationErr = await validatePhotoFile(file);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    if (onSelectPendingFile) {
      onSelectPendingFile(file);
      return;
    }

    if (!onUpload) return;
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось загрузить фотографию'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteClick = async () => {
    setError(null);
    if (onSelectPendingFile) {
      onSelectPendingFile(null);
      return;
    }
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Не удалось удалить фотографию'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="col" style={{ gap: '8px' }}>
      <div className="row wrap" style={{ gap: '12px', alignItems: 'center' }}>
        {!hidePreview && (
          <span className={hasPhoto ? `${previewClassName} ava-has-photo` : previewClassName}>
            {hasPhoto && displaySrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displaySrc}
                alt={previewAlt}
                className="ava-img"
                onError={() => setImgFailed(true)}
              />
            ) : (
              previewFallback
            )}
          </span>
        )}

        <div className="col grow" style={{ gap: '6px', minWidth: '180px' }}>
          <div className="col" style={{ gap: '1px' }}>
            <span className="field-label" style={{ margin: 0 }}>
              {title}
            </span>
            <span className="field-hint">{hint}</span>
          </div>

          <div className="row wrap" style={{ gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              {hasPhoto ? <Camera className="ic" /> : <Upload className="ic" />}
              <span>
                {busy
                  ? 'Сохранение…'
                  : hasPhoto
                  ? 'Заменить фото'
                  : 'Загрузить фото'}
              </span>
            </button>

            {(hasPhoto || pendingFile) && (onDelete || onSelectPendingFile) && (
              <button
                type="button"
                className="btn btn-destructive-outline btn-sm"
                disabled={isBusy}
                onClick={handleDeleteClick}
              >
                <Trash2 className="ic" />
                <span>Удалить</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT_ATTR}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle className="ic" size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
