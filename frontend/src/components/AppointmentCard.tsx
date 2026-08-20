import type { Appointment } from '../services/appointment';
import StatusBadge from './StatusBadge';
import './AppointmentCard.css';

interface AppointmentCardProps {
  appointment: Appointment;
  variant?: 'full' | 'compact';
}

export default function AppointmentCard({ appointment, variant = 'full' }: AppointmentCardProps) {
  const dateLabel = new Date(appointment.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={`appointment-card appointment-card--${variant}`}>
      <div className="appointment-card__avatar">{appointment.avatarInitials}</div>

      <div className="appointment-card__details">
        <div className="appointment-card__top-row">
          <h4 className="appointment-card__doctor">{appointment.doctorName}</h4>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="appointment-card__specialty">{appointment.doctorSpecialty}</p>
        <p className="appointment-card__hospital text-secondary">{appointment.hospitalName}</p>

        <div className="appointment-card__meta">
          <span className="appointment-card__meta-item mono">{dateLabel}</span>
          <span className="appointment-card__meta-dot" />
          <span className="appointment-card__meta-item mono">{appointment.time}</span>
          <span className="appointment-card__meta-dot" />
          <span className="appointment-card__meta-item">{appointment.mode}</span>
        </div>

        {appointment.symptoms && (
          <p className="appointment-card__symptoms">"{appointment.symptoms}"</p>
        )}
      </div>
    </div>
  );
}