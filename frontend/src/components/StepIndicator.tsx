import './StepIndicator.css';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const state = stepNum < currentStep ? 'done' : stepNum === currentStep ? 'active' : 'upcoming';
        return (
          <div key={label} className={`step-indicator__item step-indicator__item--${state}`}>
            <span className="step-indicator__circle">
              {state === 'done' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
              ) : (
                stepNum
              )}
            </span>
            <span className="step-indicator__label">{label}</span>
            {stepNum !== steps.length && <span className="step-indicator__line" />}
          </div>
        );
      })}
    </div>
  );
}