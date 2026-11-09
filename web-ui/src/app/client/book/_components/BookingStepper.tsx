import React from 'react';
import { StepItem, DEFAULT_BOOKING_STEPS } from './constants';

export interface BookingStepperProps {
  currentStep: number;
  steps?: StepItem[];
}

/**
 * Визуальный индикатор шагов мастера записи.
 * Использует стили chiron.css: .stepper, .step, .step-n, модификаторы .on, .done.
 */
export const BookingStepper: React.FC<BookingStepperProps> = ({
  currentStep,
  steps = DEFAULT_BOOKING_STEPS,
}) => {
  return (
    <div className="stepper" aria-label="Шаги оформления записи">
      {steps.map((st) => {
        const isOn = currentStep === st.n;
        const isDone = currentStep > st.n;
        return (
          <span
            key={st.n}
            className={`step ${isOn ? 'on' : isDone ? 'done' : ''}`}
          >
            <span className="step-n">{st.n}</span>
            {st.label}
          </span>
        );
      })}
    </div>
  );
};
