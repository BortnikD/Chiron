import React from 'react';

export interface StepItem {
  n: number;
  label: string;
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
}

/**
 * Индикатор 5 шагов мастера записи на приём (.stepper, .step, .step-n, .on, .done).
 */
export const BookingStepper: React.FC<BookingStepperProps> = ({
  currentStep,
  isSuccess = false,
  steps = DEFAULT_BOOKING_STEPS,
}) => {
  return (
    <div className="stepper" aria-label="Шаги оформления записи">
      {steps.map((st) => {
        const isDone = isSuccess || currentStep > st.n;
        const isOn = !isSuccess && currentStep === st.n;
        return (
          <span
            key={st.n}
            className={`step ${isOn ? 'on' : isDone ? 'done' : ''}`}
          >
            <span className="step-n">{isDone ? '✓' : st.n}</span>
            {st.label}
          </span>
        );
      })}
    </div>
  );
};
