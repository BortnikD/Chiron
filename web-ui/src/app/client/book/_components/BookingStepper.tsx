import React from 'react';

export interface StepItem {
  n: number;
  label: string;
  displayNum?: number;
}

const DEFAULT_BOOKING_STEPS: StepItem[] = [
  { n: 1, label: 'Питомец' },
  { n: 2, label: 'Услуга' },
  { n: 3, label: 'Врач' },
  { n: 4, label: 'Дата и время' },
  { n: 5, label: 'Подтверждение' },
];

export interface BookingStepperProps {
  currentStep: number;
  isSuccess?: boolean;
  steps?: StepItem[];
  onStepClick?: (step: number) => void;
}

/**
 * Индикатор 5 шагов мастера записи на приём (.stepper, .step, .step-n, .on, .done).
 * Пройденные этапы можно нажать, чтобы вернуться назад и изменить выбор.
 */
export const BookingStepper: React.FC<BookingStepperProps> = ({
  currentStep,
  isSuccess = false,
  steps = DEFAULT_BOOKING_STEPS,
  onStepClick,
}) => {
  return (
    <div className="stepper" aria-label="Шаги оформления записи">
      {steps.map((st) => {
        const isDone = isSuccess || currentStep > st.n;
        const isOn = !isSuccess && currentStep === st.n;
        const canGoBack = Boolean(onStepClick && !isSuccess && currentStep > st.n);

        if (canGoBack) {
          return (
            <button
              key={st.n}
              type="button"
              className="step done"
              onClick={() => onStepClick?.(st.n)}
              title={`Вернуться к шагу «${st.label}»`}
            >
              <span className="step-n">✓</span>
              {st.label}
            </button>
          );
        }

        return (
          <span
            key={st.n}
            className={`step ${isOn ? 'on' : isDone ? 'done' : ''}`}
            aria-current={isOn ? 'step' : undefined}
          >
            <span className="step-n">{isDone ? '✓' : st.displayNum ?? st.n}</span>
            {st.label}
          </span>
        );
      })}
    </div>
  );
};
