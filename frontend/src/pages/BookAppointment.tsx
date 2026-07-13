import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllHospitals, type Hospital, type Doctor } from '../services/hospital';
import { bookAppointment, AVAILABLE_TIME_SLOTS } from '../services/appointment';
import StepIndicator from '../components/StepIndicator';
import Toast from '../components/Toast';
import './BookAppointment.css';

const STEPS = ['Hospital & Doctor', 'Visit Details', 'Confirm'];

interface FormErrors {
  hospital?: string;
  doctor?: string;
  symptoms?: string;
  date?: string;
  time?: string;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [step, setStep] = useState(1);
  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bookedId, setBookedId] = useState<string | null>(null);

  useEffect(() => {
    getAllHospitals().then((data) => {
      setHospitals(data);
      setLoadingHospitals(false);
    });
  }, []);

  const selectedHospital = useMemo<Hospital | undefined>(
    () => hospitals.find((h) => h.id === hospitalId),
    [hospitals, hospitalId]
  );
  const availableDoctors: Doctor[] = selectedHospital?.doctors ?? [];
  const selectedDoctor = availableDoctors.find((d) => d.id === doctorId);

  function handleHospitalChange(id: string) {
    setHospitalId(id);
    setDoctorId('');
    setErrors((prev) => ({ ...prev, hospital: undefined, doctor: undefined }));
  }

  function validateStep1(): boolean {
    const next: FormErrors = {};
    if (!hospitalId) next.hospital = 'Please select a hospital.';
    if (!doctorId) next.doctor = 'Please select a doctor.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2(): boolean {
    const next: FormErrors = {};
    if (!symptoms.trim()) next.symptoms = 'Please describe your symptoms.';
    else if (symptoms.trim().length < 8) next.symptoms = 'Please add a bit more detail (min. 8 characters).';
    if (!date) next.date = 'Please select a date.';
    else if (date < todayIso()) next.date = 'Date cannot be in the past.';
    if (!time) next.time = 'Please select a time slot.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleConfirm() {
    if (!selectedHospital || !selectedDoctor) return;
    setSubmitting(true);
    try {
      const appt = await bookAppointment({
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        symptoms,
        date,
        time,
      });
      setBookedId(appt.id);
      setToast({ message: 'Appointment request submitted successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not book appointment.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (bookedId) {
    return (
      <div className="book-appointment book-appointment--success">
        <div className="booking-success card-surface fade-in-up">
          <div className="booking-success__icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h2>Appointment Requested</h2>
          <p className="text-secondary">
            Your request with {selectedDoctor?.name} at {selectedHospital?.name} has been submitted.
            You'll receive a confirmation once the hospital accepts it.
          </p>
          <span className="booking-success__id mono">{bookedId}</span>
          <div className="booking-success__actions">
            <button className="btn btn-secondary" onClick={() => navigate('/appointment-status')}>View Status</button>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="book-appointment">
      <div className="book-appointment__header">
        <StepIndicator steps={STEPS} currentStep={step} />
      </div>

      <div className="book-appointment__body card-surface fade-in-up">
        {/* Step 1: Hospital + Doctor */}
        {step === 1 && (
          <div className="book-step">
            <h3 className="book-step__title">Choose Hospital & Doctor</h3>

            <div className="book-field">
              <label className="book-field__label">Hospital</label>
              {loadingHospitals ? (
                <div className="skeleton" style={{ height: 46, borderRadius: 'var(--radius-sm)' }} />
              ) : (
                <select
                  className={`book-field__select ${errors.hospital ? 'book-field--error' : ''}`}
                  value={hospitalId}
                  onChange={(e) => handleHospitalChange(e.target.value)}
                >
                  <option value="">Select a hospital</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} — {h.distanceKm} km away</option>
                  ))}
                </select>
              )}
              {errors.hospital && <span className="book-field__error">{errors.hospital}</span>}
            </div>

            <div className="book-field">
              <label className="book-field__label">Doctor</label>
              <select
                className={`book-field__select ${errors.doctor ? 'book-field--error' : ''}`}
                value={doctorId}
                onChange={(e) => { setDoctorId(e.target.value); setErrors((p) => ({ ...p, doctor: undefined })); }}
                disabled={!hospitalId}
              >
                <option value="">{hospitalId ? 'Select a doctor' : 'Select a hospital first'}</option>
                {availableDoctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                ))}
              </select>
              {errors.doctor && <span className="book-field__error">{errors.doctor}</span>}
            </div>

            {selectedHospital && (
              <div className="book-hospital-preview">
                <span className="book-hospital-preview__stat">
                  <strong className="mono">{selectedHospital.rating}</strong> rating
                </span>
                <span className="book-hospital-preview__dot" />
                <span className="book-hospital-preview__stat">
                  <strong className="mono">{selectedHospital.availableDoctors}</strong> doctors available
                </span>
                {selectedHospital.emergencyAvailable && (
                  <>
                    <span className="book-hospital-preview__dot" />
                    <span className="book-hospital-preview__emergency">24/7 Emergency</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Symptoms, Date, Time */}
        {step === 2 && (
          <div className="book-step">
            <h3 className="book-step__title">Visit Details</h3>

            <div className="book-field">
              <label className="book-field__label">Describe your symptoms</label>
              <textarea
                className={`book-field__textarea ${errors.symptoms ? 'book-field--error' : ''}`}
                rows={4}
                value={symptoms}
                onChange={(e) => { setSymptoms(e.target.value); setErrors((p) => ({ ...p, symptoms: undefined })); }}
                placeholder="e.g. Persistent headache for the last 3 days, mild fever in the evenings..."
              />
              {errors.symptoms && <span className="book-field__error">{errors.symptoms}</span>}
            </div>

            <div className="book-field-row">
              <div className="book-field">
                <label className="book-field__label">Preferred Date</label>
                <input
                  type="date"
                  className={`book-field__select mono ${errors.date ? 'book-field--error' : ''}`}
                  min={todayIso()}
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: undefined })); }}
                />
                {errors.date && <span className="book-field__error">{errors.date}</span>}
              </div>
            </div>

            <div className="book-field">
              <label className="book-field__label">Preferred Time Slot</label>
              <div className="time-slot-grid">
                {AVAILABLE_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot ${time === slot ? 'time-slot--selected' : ''}`}
                    onClick={() => { setTime(slot); setErrors((p) => ({ ...p, time: undefined })); }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {errors.time && <span className="book-field__error">{errors.time}</span>}
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedHospital && selectedDoctor && (
          <div className="book-step">
            <h3 className="book-step__title">Review & Confirm</h3>

            <div className="book-summary">
              <div className="book-summary__row">
                <span>Hospital</span>
                <strong>{selectedHospital.name}</strong>
              </div>
              <div className="book-summary__row">
                <span>Doctor</span>
                <strong>{selectedDoctor.name} · {selectedDoctor.specialty}</strong>
              </div>
              <div className="book-summary__row">
                <span>Date</span>
                <strong className="mono">
                  {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </div>
              <div className="book-summary__row">
                <span>Time</span>
                <strong className="mono">{time}</strong>
              </div>
              <div className="book-summary__row book-summary__row--symptoms">
                <span>Symptoms</span>
                <p>{symptoms}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="book-appointment__nav">
          {step > 1 ? (
            <button className="btn btn-secondary" onClick={goBack} disabled={submitting}>Back</button>
          ) : <span />}

          {step < 3 ? (
            <button className="btn btn-primary" onClick={goNext}>Continue</button>
          ) : (
            <button className="btn btn-primary" onClick={handleConfirm} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}