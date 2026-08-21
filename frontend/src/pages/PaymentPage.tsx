import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../services/payment';
import './PaymentPage.css';

interface PaymentState {
  orderId: string;
  amount: number;
  keyId: string;
  appointmentId: string;
  hospitalName: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
}

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PaymentState | null;

  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [status, setStatus]           = useState<'idle' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg]       = useState('');

  // Redirect if no state passed
  useEffect(() => {
    if (!state?.orderId) navigate('/book-appointment', { replace: true });
  }, [state, navigate]);

  // Load Razorpay SDK
  useEffect(() => {
    if ((window as any).Razorpay) { setScriptReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => setScriptReady(true);
    script.onerror = () => setErrorMsg('Could not load payment SDK. Check your internet connection.');
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  if (!state) return null;

  const { orderId, amount, keyId, appointmentId, hospitalName, doctorName, specialty, date, time } = state;
  const amountRupees = (amount / 100).toLocaleString('en-IN');

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  function openRazorpay() {
    if (!(window as any).Razorpay) {
      setErrorMsg('Razorpay SDK not loaded. Please refresh and try again.');
      return;
    }
    setErrorMsg('');

    if (!keyId) {
      setErrorMsg('Payment checkout is not configured. Please restart your booking.');
      return;
    }

    const options = {
      key: keyId,
      amount: amount.toString(),
      currency: 'INR',
      name: 'MediChain',
      description: `Consultation · ${doctorName}`,
      image: '/logo.png',
      order_id: orderId,
      handler: async (response: any) => {
        setLoading(true);
        try {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setStatus('success');
        } catch (err: any) {
          setStatus('failed');
          setErrorMsg(err.message || 'Verification failed. Contact support.');
        } finally {
          setLoading(false);
        }
      },
      prefill: {},
      theme: { color: '#0f766e' },
      modal: {
        ondismiss: () => { /* user closed modal — stay on page so they can retry */ }
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (resp: any) => {
      setStatus('failed');
      setErrorMsg(resp.error?.description || 'Payment was not completed.');
    });
    rzp.open();
  }

  /* ── SUCCESS SCREEN ── */
  if (status === 'success') {
    return (
      <div className="pp-root pp-root--center">
        <div className="pp-success fade-in-up">
          <div className="pp-success__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2>Payment Successful!</h2>
          <p>Your appointment is confirmed and paid.</p>
          <div className="pp-success__ref mono">#{appointmentId.slice(-8).toUpperCase()}</div>
          <div className="pp-success__detail">
            <span>🏥 {hospitalName}</span>
            <span>🩺 {doctorName}</span>
            <span>📅 {formattedDate} · {time}</span>
            <span>💳 ₹{amountRupees} paid</span>
          </div>
          <div className="pp-success__actions">
            <button className="btn btn-secondary" onClick={() => navigate('/appointment-status')}>
              View Appointments
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN PAYMENT PAGE ── */
  return (
    <div className="pp-root fade-in-up">
      {/* Back link */}
      <button className="pp-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="pp-layout">

        {/* ── LEFT — Booking Summary ── */}
        <div className="pp-summary">
          <div className="pp-summary__badge">Step 2 of 3 · Payment</div>
          <h1 className="pp-summary__title">Confirm &amp; Pay</h1>
          <p className="pp-summary__sub">Review your booking details before proceeding.</p>

          <div className="pp-summary__card">
            <div className="pp-summary__card-header">
              <span className="pp-summary__hospital-icon">🏥</span>
              <div>
                <p className="pp-summary__hospital-name">{hospitalName}</p>
                <p className="pp-summary__hospital-sub">MediChain Network Hospital</p>
              </div>
            </div>

            <div className="pp-summary__rows">
              <div className="pp-summary__row">
                <span className="pp-summary__row-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                  Doctor
                </span>
                <span className="pp-summary__row-val">{doctorName}</span>
              </div>
              {specialty && (
                <div className="pp-summary__row">
                  <span className="pp-summary__row-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    Specialty
                  </span>
                  <span className="pp-summary__row-val">{specialty}</span>
                </div>
              )}
              <div className="pp-summary__row">
                <span className="pp-summary__row-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Date
                </span>
                <span className="pp-summary__row-val">{formattedDate}</span>
              </div>
              <div className="pp-summary__row">
                <span className="pp-summary__row-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Time
                </span>
                <span className="pp-summary__row-val mono">{time}</span>
              </div>
            </div>

            <div className="pp-summary__total">
              <div>
                <p className="pp-summary__total-label">Consultation Fee</p>
                <p className="pp-summary__total-note">Inclusive of all taxes</p>
              </div>
              <div className="pp-summary__total-amount">₹{amountRupees}</div>
            </div>
          </div>

          <div className="pp-summary__security">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Secured by Razorpay · 256-bit TLS encryption
          </div>
        </div>

        {/* ── RIGHT — Payment Panel ── */}
        <div className="pp-panel">
          <h2 className="pp-panel__title">Payment</h2>
          <p className="pp-panel__sub">Powered by Razorpay — India's most trusted payment gateway</p>

          {/* Amount chip */}
          <div className="pp-panel__amount-chip">
            <span className="pp-panel__amount-label">Amount to pay</span>
            <span className="pp-panel__amount-value">₹{amountRupees}</span>
          </div>

          {/* Pay Methods (visual only) */}
          <div className="pp-panel__methods">
            {['UPI', 'Cards', 'Net Banking', 'Wallets'].map(m => (
              <span key={m} className="pp-panel__method-chip">{m}</span>
            ))}
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="pp-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errorMsg}
            </div>
          )}

          {/* Failed retry */}
          {status === 'failed' && (
            <div className="pp-failed">
              <p>Payment was not completed.</p>
              <button className="pp-failed__retry" onClick={() => { setStatus('idle'); setErrorMsg(''); }}>
                Try Again
              </button>
            </div>
          )}

          {/* PAY BUTTON */}
          {status === 'idle' && (
            <button
              className="pp-pay-btn"
              onClick={openRazorpay}
              disabled={loading || !scriptReady}
            >
              {loading ? (
                <>
                  <span className="pp-pay-btn__spinner" />
                  Verifying payment…
                </>
              ) : !scriptReady ? (
                <>
                  <span className="pp-pay-btn__spinner" />
                  Loading…
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="1" y="4" width="22" height="16" rx="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Pay ₹{amountRupees} Now
                </>
              )}
            </button>
          )}

          <p className="pp-panel__cancel" onClick={() => navigate('/dashboard')}>
            Cancel and go back to dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
