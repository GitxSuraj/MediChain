import { useNavigate } from 'react-router-dom';
import type { JSX } from 'react';
import './QuickActionCard.css';

interface QuickActionCardProps {
  label: string;
  description: string;
  path: string;
  icon: JSX.Element;
  accent: 'teal' | 'violet' | 'coral' | 'amber';
}

export default function QuickActionCard({ label, description, path, icon, accent }: QuickActionCardProps) {
  const navigate = useNavigate();
  return (
    <button className={`quick-action quick-action--${accent}`} onClick={() => navigate(path)}>
      <span className="quick-action__icon">{icon}</span>
      <span className="quick-action__text">
        <span className="quick-action__label">{label}</span>
        <span className="quick-action__desc">{description}</span>
      </span>
      <svg className="quick-action__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}