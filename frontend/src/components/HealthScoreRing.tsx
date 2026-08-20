import { useEffect, useState } from 'react';
import './HealthScoreRing.css';

interface HealthScoreRingProps {
  score: number; // 0–100
  label?: string;
}

export default function HealthScoreRing({ score, label = 'Health Score' }: HealthScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [ringReady, setRingReady] = useState(false);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const revealTimer = setTimeout(() => setRingReady(true), 120);
    const duration = 1300;
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => { clearTimeout(revealTimer); cancelAnimationFrame(raf); };
  }, [score]);

  const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'watch';
  const statusLabel = status === 'excellent' ? 'Excellent' : status === 'good' ? 'Good' : 'Needs Attention';

  return (
    <div className="health-score-ring">
      <div className="health-score-ring__visual">
        <svg viewBox="0 0 128 128" className="health-score-ring__svg">
          <circle cx="64" cy="64" r={radius} className="health-score-ring__track" />
          <circle
            cx="64" cy="64" r={radius}
            className={`health-score-ring__progress health-score-ring__progress--${status}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: ringReady ? offset : circumference,
            }}
          />
        </svg>
        <div className="health-score-ring__center">
          <span className="health-score-ring__value mono">{displayScore}</span>
          <span className="health-score-ring__max">/100</span>
        </div>
      </div>
      <div className="health-score-ring__meta">
        <span className="health-score-ring__label">{label}</span>
        <span className={`health-score-ring__status health-score-ring__status--${status}`}>
          <span className="health-score-ring__status-dot" />
          {statusLabel}
        </span>
      </div>
    </div>
  );
}