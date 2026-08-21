import React, { useEffect, useState } from 'react';
import { verifyPayment } from '../services/payment';
import './PaymentCheckout.css';

interface PaymentCheckoutProps {
  orderId: string;
  amount: number;
  keyId: string;
  hospitalName: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function PaymentCheckout({ orderId, amount, keyId, hospitalName, onSuccess, onClose }: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    // Only load if not already present
    if ((window as any).Razorpay) { setScriptReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!(window as any).Razorpay) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }
    if (!keyId) {
      alert('Payment checkout is not configured. Please restart your booking.');
      return;
    }

    const options = {
      key: keyId,
      amount: amount.toString(),
      currency: 'INR',
      name: 'MediChain',
      description: `Consultation at ${hospitalName}`,
      order_id: orderId,
      handler: async function (response: any) {
        setLoading(true);
        try {
          await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess();
        } catch (err: any) {
          alert(`Payment verification failed: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#0f766e' },
      modal: { ondismiss: () => { if (onClose) onClose(); } },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      alert(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  };

  const amountDisplay = `₹${(amount / 100).toLocaleString('en-IN')}`;

  return (
    <div className="pay-card">
      <div className="pay-card__info">
        <div className="pay-card__hospital">
          <span className="pay-card__hospital-icon">🏥</span>
          <div>
            <p className="pay-card__hospital-name">{hospitalName}</p>
            <p className="pay-card__label">Consultation fee</p>
          </div>
        </div>
        <div className="pay-card__amount">{amountDisplay}</div>
      </div>

      <div className="pay-card__divider" />

      <button
        className="pay-card__btn"
        onClick={handlePayment}
        disabled={loading || !scriptReady}
      >
        {loading ? (
          <>
            <span className="pay-card__spinner" />
            Verifying payment…
          </>
        ) : !scriptReady ? (
          'Loading…'
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Pay {amountDisplay} securely
          </>
        )}
      </button>

      <p className="pay-card__secure">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secured by Razorpay · 256-bit SSL
      </p>
    </div>
  );
}
