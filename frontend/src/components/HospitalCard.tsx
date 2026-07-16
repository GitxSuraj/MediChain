import type { Hospital } from '../services/hospital';
import './HospitalCard.css';

interface HospitalCardProps {
  hospital: Hospital;
  variant?: 'full' | 'compact';
  onViewDetails?: (hospital: Hospital) => void;
}

export default function HospitalCard({ hospital, variant = 'full', onViewDetails }: HospitalCardProps) {
  return (
    <div className={`hospital-card hospital-card--${variant}`}>
      <div className="hospital-card__image">
        <span className="hospital-card__image-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /><path d="M12 8v4M10 10h4" />
          </svg>
        </span>
        {hospital.emergencyAvailable && <span className="hospital-card__emergency-tag">Emergency</span>}
      </div>

      <div className="hospital-card__body">
        <div className="hospital-card__top-row">
          <h4 className="hospital-card__name">{hospital.name}</h4>
          <span className="hospital-card__rating">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.6 7.2.8-5.4 4.9 1.5 7.2L12 17.9 5.6 21.5l1.5-7.2L1.7 9.4l7.2-.8z" /></svg>
            {hospital.rating}
          </span>
        </div>

        <p className="hospital-card__address text-secondary">{hospital.address}</p>

        <div className="hospital-card__stats">
          <span className="hospital-card__stat mono">{hospital.distanceKm} km away</span>
          <span className="hospital-card__stat mono">{hospital.availableDoctors} doctors</span>
        </div>

        {variant === 'full' && (
          <div className="hospital-card__specialties">
            {hospital.specialties.slice(0, 3).map((s) => (
              <span key={s} className="hospital-card__specialty-tag">{s}</span>
            ))}
          </div>
        )}

        <button
          className="btn btn-secondary hospital-card__cta"
          onClick={() => onViewDetails?.(hospital)}
        >
          View Details
        </button>
      </div>
    </div>
  );
}