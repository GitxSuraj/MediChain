import { useEffect, useState } from 'react';
import { getAppointments, type Appointment } from '../services/appointment';
import { useAuth } from '../context/AuthContext';
import './HospitalReviewForm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface HospitalReviewFormProps {
  hospitalId: string;
  hospitalName: string;
  onSubmitted?: () => void;
}

export default function HospitalReviewForm({ hospitalId, hospitalName, onSubmitted }: HospitalReviewFormProps) {
  const { user } = useAuth();
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [eligibleAppointments, setEligibleAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAppointments(user.id).then((appointments) => {
      if (cancelled) return;
      const eligible = appointments.filter(
        (a) => a.status === 'Completed' && a.hospitalName === hospitalName
      );
      setEligibleAppointments(eligible);
      setSelectedAppointmentId(eligible[0]?.id ?? '');
      setLoadingAppointments(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, hospitalName]);

  async function handleSubmit() {
    if (!user) return;
    if (!selectedAppointmentId) {
      setStatus({ type: 'error', message: 'Select the completed appointment this review is for.' });
      return;
    }
    if (rating < 1) {
      setStatus({ type: 'error', message: 'Please select a star rating.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch(`${API_URL}/hospitals/${encodeURIComponent(hospitalId)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: user.id,
          appointment_id: selectedAppointmentId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (response.status === 403) {
        setStatus({
          type: 'error',
          message: 'You can only review a hospital after a completed appointment there.',
        });
        return;
      }
      if (response.status === 409) {
        setStatus({ type: 'error', message: 'You already reviewed this appointment.' });
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Could not submit review.');
      }

      setStatus({ type: 'success', message: 'Thanks — your review has been posted.' });
      setRating(0);
      setComment('');
      onSubmitted?.();
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Could not submit review.' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingAppointments) {
    return <div className="review-form review-form--loading skeleton" style={{ height: 140 }} />;
  }

  if (eligibleAppointments.length === 0) {
    return (
      <div className="review-form review-form--locked card-surface">
        <p className="text-secondary">
          You can write a review here once you've completed an appointment at {hospitalName}.
        </p>
      </div>
    );
  }

  return (
    <div className="review-form card-surface">
      <h4 className="review-form__title">Write a Review</h4>

      {eligibleAppointments.length > 1 && (
        <label className="review-form__field">
          <span className="review-form__label">Which appointment?</span>
          <select
            className="review-form__select"
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
          >
            {eligibleAppointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.doctorName} — {a.date}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="review-form__stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="review-form__star-btn"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(n)}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill={(hoverRating || rating) >= n ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.6"
              className={(hoverRating || rating) >= n ? 'review-form__star--filled' : 'review-form__star'}
            >
              <path d="M12 2l3.1 6.6 7.2.8-5.4 4.9 1.5 7.2L12 17.9 5.6 21.5l1.5-7.2L1.7 9.4l7.2-.8z" />
            </svg>
          </button>
        ))}
      </div>

      <textarea
        className="review-form__textarea"
        rows={3}
        placeholder="Share details of your experience (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
      />

      {status && (
        <div className={`review-form__status review-form__status--${status.type}`}>{status.message}</div>
      )}

      <button className="btn btn-primary review-form__submit" onClick={handleSubmit} disabled={submitting}>
        {submitting ? <span className="spinner" /> : 'Submit Review'}
      </button>
    </div>
  );
}
