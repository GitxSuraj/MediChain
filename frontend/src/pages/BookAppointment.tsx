import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllHospitals, type Hospital } from '../services/hospital';
import { bookAppointment, AVAILABLE_TIME_SLOTS } from '../services/appointment';
import { createPaymentOrder, PaymentIntegrationPendingError } from '../services/payment';
import StepIndicator from '../components/StepIndicator';
import Toast from '../components/Toast';
import './BookAppointment.css';

const STEPS = ['Hospital', 'Visit Details', 'Confirm & Pay'];

// No doctor-management backend exists yet (out of Person C's scope — payment
// is Person A, medical history is Person B, doctor assignment is unowned).
// Booking is simplified to hospital + visit details rather than presenting
// fake doctor names, per the "no fake functionality" requirement.
const GENERAL_CONSULTATION = {
  id: 'general-consultation',
  name: 'General Consultation',
  specialty: 'To be assigned by hospital',
};

interface FormErrors {
  hospital?: string;
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
  const [symptoms, setSymptoms] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bookedId, setBookedId] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

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

  function handleHospitalChange(id: string) {
    setHospitalId(id);
    setErrors((prev) => ({ ...prev, hospital: undefined }));
  }

  function validateStep1(): boolean {
    const next: FormErrors = {};
    if (!hospitalId) next.hospital = 'Please select a hospital.';
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
    if (!selectedHospital) return;
    setSubmitting(true);
    setPaymentNotice(null);

    // Person A payment integration point:
    //   const { orderId } = await createPaymentOrder(appointmentDraft);
    //   <PaymentCheckout orderId={orderId} onSuccess={finalizeAppointment} />
    // Person A hasn't shipped POST /payments/order yet, so this correctly
    // rejects — we surface that clearly and still let the appointment
    // request go through unpaid, rather than blocking the whole flow or
    // faking a successful payment.
    try {
      await createPaymentOrder({
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        symptoms,
        date,
        time,
      });
    } catch (err) {
      if (err instanceof PaymentIntegrationPendingError) {
        setPaymentNotice(
          "Payment isn't available yet (Person A's payment backend is pending). Your appointment request will be submitted unpaid."
        );
      } else {
        setToast({ message: err instanceof Error ? err.message : 'Payment failed.', type: 'error' });
        setSubmitting(false);
        return;
      }
    }

    try {
      const appt = await bookAppointment({
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.name,
        doctorId: GENERAL_CONSULTATION.id,
        doctorName: GENERAL_CONSULTATION.name,
        doctorSpecialty: GENERAL_CONSULTATION.specialty,
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
            Your request at {selectedHospital?.name} has been submitted.
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
        {/* Step 1: Hospital */}
        {step === 1 && (
          <div className="book-step">
            <h3 className="book-step__title">Choose a Hospital</h3>

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
                    <option key={h.id} value={h.id}>{h.name} — {h.city}</option>
                  ))}
                </select>
              )}
              {errors.hospital && <span className="book-field__error">{errors.hospital}</span>}
            </div>

            {selectedHospital && (
              <div className="book-hospital-preview">
                <span className="book-hospital-preview__stat">
                  <strong className="mono">
                    {(selectedHospital.reviewCount ?? 0) > 0 ? selectedHospital.averageRating?.toFixed(1) : '—'}
                  </strong> rating
                </span>
                <span className="book-hospital-preview__dot" />
                <span className="book-hospital-preview__stat">
                  <strong className="mono">{selectedHospital.beds.general.available}</strong> general beds available
                </span>
                {(selectedHospital.beds.emergency?.available ?? 0) > 0 && (
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
        {step === 3 && selectedHospital && (
          <div className="book-step">
            <h3 className="book-step__title">Review & Confirm</h3>

            <div className="book-summary">
              <div className="book-summary__row">
                <span>Hospital</span>
                <strong>{selectedHospital.name}</strong>
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

            {paymentNotice && (
              <div className="book-field__error" style={{ marginTop: 'var(--space-3)' }}>{paymentNotice}</div>
            )}
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
