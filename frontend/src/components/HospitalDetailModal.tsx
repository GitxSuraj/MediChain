import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Hospital } from '../services/hospital';
import HospitalReviewForm from './HospitalReviewForm';
import './HospitalDetailModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface ReviewItem {
  id: string;
  patient_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface HospitalDetailModalProps {
  hospital: Hospital;
  onClose: () => void;
}

const BED_LABELS: Record<string, string> = {
  general: 'General',
  icu: 'ICU',
  oxygen: 'Oxygen',
  emergency: 'Emergency',
  ventilators: 'Ventilators',
};

export default function HospitalDetailModal({ hospital, onClose }: HospitalDetailModalProps) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(hospital.averageRating ?? 0);
  const [reviewCount, setReviewCount] = useState(hospital.reviewCount ?? 0);
  const [loadingReviews, setLoadingReviews] = useState(true);

  function loadReviews() {
    setLoadingReviews(true);
    fetch(`${API_URL}/hospitals/${encodeURIComponent(hospital.id)}/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setReviews(data.reviews);
        setAverageRating(data.average_rating);
        setReviewCount(data.review_count);
      })
      .finally(() => setLoadingReviews(false));
  }

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospital.id]);

  const hasEmergency = (hospital.beds.emergency?.available ?? 0) > 0;

  return (
    <div className="hospital-modal-scrim" onClick={onClose}>
      <div className="hospital-modal fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="hospital-modal__banner">
          <button className="hospital-modal__close" onClick={onClose} aria-label="Close">✕</button>
          {hasEmergency && (
            <span className="hospital-modal__emergency-tag">24/7 Emergency</span>
          )}
        </div>

        <div className="hospital-modal__body">
          <div className="hospital-modal__header">
            <h2>{hospital.name}</h2>
            <span className="hospital-modal__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.6 7.2.8-5.4 4.9 1.5 7.2L12 17.9 5.6 21.5l1.5-7.2L1.7 9.4l7.2-.8z" /></svg>
              {reviewCount > 0 ? `${averageRating.toFixed(1)} (${reviewCount})` : 'No reviews yet'}
            </span>
          </div>
          <p className="hospital-modal__address text-secondary">{hospital.city}</p>

          <div className="hospital-modal__stats">
            {Object.entries(BED_LABELS).map(([key, label]) => {
              const info = hospital.beds[key as keyof typeof hospital.beds];
              return (
                <div className="hospital-modal__stat" key={key}>
                  <span className="hospital-modal__stat-value mono">
                    {info ? `${info.available} / ${info.total}` : '—'}
                  </span>
                  <span className="hospital-modal__stat-label">{label} {key === 'ventilators' ? '' : 'Beds'}</span>
                </div>
              );
            })}
          </div>

          <div className="hospital-modal__section">
            <h4>Specialties</h4>
            <div className="hospital-modal__tags">
              {hospital.facilities.map((s) => (
                <span key={s} className="hospital-modal__tag">{s}</span>
              ))}
            </div>
          </div>

          <div className="hospital-modal__section">
            <h4>Reviews</h4>
            {loadingReviews ? (
              <div className="skeleton" style={{ height: 60, borderRadius: 'var(--radius-md)' }} />
            ) : reviews.length === 0 ? (
              <p className="text-secondary">No reviews yet — be the first to share your experience.</p>
            ) : (
              <div className="hospital-modal__reviews">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="hospital-modal__review">
                    <div className="hospital-modal__review-rating mono">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    {r.comment && <p className="hospital-modal__review-comment">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hospital-modal__section">
            <HospitalReviewForm hospitalId={hospital.id} hospitalName={hospital.name} onSubmitted={loadReviews} />
          </div>

          <button className="btn btn-primary hospital-modal__cta" onClick={() => navigate('/book-appointment')}>
            Book Appointment Here
          </button>
        </div>
      </div>
    </div>
  );
}
