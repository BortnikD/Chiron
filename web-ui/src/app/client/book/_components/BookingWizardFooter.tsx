import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface BookingWizardFooterProps {
  step: number;
  isNextDisabled: boolean;
  submitting: boolean;
  canSubmit: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

/**
 * Подвал мастера записи: кнопки «Назад / Отмена», «Далее» и «Записаться».
 */
export const BookingWizardFooter: React.FC<BookingWizardFooterProps> = ({
  step,
  isNextDisabled,
  submitting,
  canSubmit,
  onPrev,
  onNext,
  onSubmit,
}) => {
  return (
    <div className="island-foot">
      <button type="button" className="btn btn-outline" onClick={onPrev}>
        <ChevronLeft className="ic" />
        <span>{step === 1 ? 'Отмена' : 'Назад'}</span>
      </button>

      {step < 4 ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={isNextDisabled}
          onClick={onNext}
        >
          <span>Далее</span>
          <ChevronRight className="ic" />
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          disabled={submitting || !canSubmit}
          onClick={onSubmit}
        >
          {submitting ? (
            <span>Оформление...</span>
          ) : (
            <>
              <Check className="ic" />
              <span>Записаться</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
