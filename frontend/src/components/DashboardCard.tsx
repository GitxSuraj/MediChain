import { useNavigate } from 'react-router-dom';
import './DashboardCard.css';
import type { HealthMetric } from '../services/patient';

const METRIC_ICONS: Record<HealthMetric['icon'], JSX.Element> = {
  heart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-7-4.35-9.5-8.5C.8 9 2 5.5 5.5 4.7 8 4.1 10 5 12 7c2-2 4-2.9 6.5-2.3C22 5.5 23.2 9 21.5 12.5 19 16.65 12 21 12 21z" />
    </svg>
  ),
  pressure: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" />
    </svg>
  ),
  sugar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2s5 6 5 10.5a5 5 0 0 1-10 0C7 8 12 2 12 2z" />
    </svg>
  ),
  weight: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="8" width="16" height="12" rx="2" /><path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  ),
};

const TREND_ICON: Record<HealthMetric['trend'], string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

interface DashboardCardProps {
  metric: HealthMetric;
  index?: number;
}

export default function DashboardCard({ metric, index = 0 }: DashboardCardProps) {
  const navigate = useNavigate();

  return (
    <button
      className={`dashboard-card dashboard-card--${metric.status}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate('/medical-history')}
    >
      <div className="dashboard-card__icon">{METRIC_ICONS[metric.icon]}</div>
      <div className="dashboard-card__body">
        <span className="dashboard-card__label">{metric.label}</span>
        <div className="dashboard-card__value-row">
          <span className="dashboard-card__value mono">{metric.value}</span>
          {metric.unit && <span className="dashboard-card__unit">{metric.unit}</span>}
        </div>
      </div>
      <span className={`dashboard-card__trend dashboard-card__trend--${metric.trend}`}>
        {TREND_ICON[metric.trend]}
      </span>
      <span className="dashboard-card__hover-hint">View history →</span>
    </button>
  );
}