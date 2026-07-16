import { useNavigate } from 'react-router-dom';
import type { Hospital } from '../services/hospital';
import './HospitalDetailModal.css';

interface HospitalDetailModalProps {
  hospital: Hospital;
  onClose: () => void;
}

export default function HospitalDetailModal({ hospital, onClose }: HospitalDetailModalProps) {
  const navigate = useNavigate();

  return (
    <div className="hospital-modal-scrim" onClick={onClose}>
      <div className="hospital-modal fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="hospital-modal__banner">
          <button className="hospital-modal__close" onClick={onClose} aria-label="Close">✕</button>
          {hospital.emergencyAvailable && (
            <span className="hospital-modal__emergency-tag">24/7 Emergency</span>
          )}
        </div>

        <div className="hospital-modal__body">
          <div className="hospital-modal__header">
            <h2>{hospital.name}</h2>
            <span className="hospital-modal__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.6 7.2.8-5.4 4.9 1.5 7.2L12 17.9 5.6 21.5l1.5-7.2L1.7 9.4l7.2-.8z" /></svg>
              {hospital.rating}
            </span>
          </div>
          <p className="hospital-modal__address text-secondary">{hospital.address}</p>

          <div className="hospital-modal__stats">
            <div className="hospital-modal__stat">
              <span className="hospital-modal__stat-value mono">{hospital.distanceKm} km</span>
              <span className="hospital-modal__stat-label">Distance</span>
            </div>
            <div className="hospital-modal__stat">
              <span className="hospital-modal__stat-value mono">{hospital.availableDoctors}</span>
              <span className="hospital-modal__stat-label">Doctors</span>
            </div>
            <div className="hospital-modal__stat">
              <span className="hospital-modal__stat-value mono">{hospital.doctors.length}</span>
              <span className="hospital-modal__stat-label">Departments Shown</span>
            </div>
          </div>

          {hospital.emergencyPhone && (
            <div className="hospital-modal__emergency-box">
              <span>Emergency Line</span>
              <strong className="mono">{hospital.emergencyPhone}</strong>
            </div>
          )}

          <div className="hospital-modal__section">
            <h4>Specialties</h4>
            <div className="hospital-modal__tags">
              {hospital.specialties.map((s) => (
                <span key={s} className="hospital-modal__tag">{s}</span>
              ))}
            </div>
          </div>

          <div className="hospital-modal__section">
            <h4>Available Doctors</h4>
            <div className="hospital-modal__doctor-list">
              {hospital.doctors.map((d) => (
                <div key={d.id} className="hospital-modal__doctor">
                  <span className="hospital-modal__doctor-avatar">
                    {d.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="hospital-modal__doctor-name">{d.name}</p>
                    <p className="hospital-modal__doctor-specialty">{d.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary hospital-modal__cta" onClick={() => navigate('/book-appointment')}>
            Book Appointment Here
          </button>
        </div>
      </div>
    </div>
  );
}