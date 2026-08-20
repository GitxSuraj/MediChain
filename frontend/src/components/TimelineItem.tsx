import { useState } from 'react';
import type { Appointment } from '../services/appointment';
import StatusBadge from './StatusBadge';
import './TimelineItem.css';

interface TimelineItemProps {
  appointment: Appointment;
  isLast: boolean;
  onCancel: (id: string) => void;
  cancelling: boolean;
}

export default function TimelineItem({ appointment, isLast, onCancel, cancelling }: TimelineItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dateLabel = new Date(appointment.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const canCancel = appointment.status === 'Pending' || appointment.status === 'Confirmed';

  return (
    <div className="timeline-item">
      <div className="timeline-item__rail">
        <span className={`timeline-item__dot timeline-item__dot--${appointment.status.toLowerCase()}`} />
        {!isLast && <span className="timeline-item__line" />}
      </div>

      <div className="timeline-item__card card-surface">
        <div className="timeline-item__header">
          <div>
            <span className="timeline-item__date mono">{dateLabel}</span>
            <span className="timeline-item__time mono"> · {appointment.time}</span>
          </div>
          <StatusBadge status={appointment.status} />
        </div>

        <div className="timeline-item__body">
          <div className="timeline-item__avatar">{appointment.avatarInitials}</div>
          <div className="timeline-item__info">
            <h4>{appointment.doctorName}</h4>
            <p className="timeline-item__specialty">{appointment.doctorSpecialty}</p>
            <p className="timeline-item__hospital text-secondary">{appointment.hospitalName}</p>
            {appointment.symptoms && (
              <p className="timeline-item__symptoms">"{appointment.symptoms}"</p>
            )}
          </div>
        </div>

        <div className="timeline-item__footer">
          <span className="timeline-item__mode">{appointment.mode}</span>
          <span className="timeline-item__id mono">{appointment.id}</span>

          {canCancel && (
            confirmOpen ? (
              <div className="timeline-item__confirm">
                <span>Cancel this appointment?</span>
                <button className="btn btn-ghost" onClick={() => setConfirmOpen(false)} disabled={cancelling}>No</button>
                <button className="btn btn-secondary timeline-item__confirm-yes" onClick={() => onCancel(appointment.id)} disabled={cancelling}>
                  {cancelling ? <span className="spinner" style={{ borderTopColor: 'var(--color-coral-600)', borderColor: 'var(--color-coral-100)' }} /> : 'Yes, cancel'}
                </button>
              </div>
            ) : (
              <button className="timeline-item__cancel-btn" onClick={() => setConfirmOpen(true)}>
                Cancel Appointment
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}