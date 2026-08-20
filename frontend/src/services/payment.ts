/**
 * PAYMENT INTEGRATION BOUNDARY — Person A contract
 * -------------------------------------------------
 * Person A owns the real payment backend (Razorpay order creation +
 * verification). It does not exist in this codebase yet. This file defines
 * the exact contract BookAppointment.tsx calls against, per the roadmap:
 *
 *   const { orderId } = await createPaymentOrder(appointmentDraft);
 *   <PaymentCheckout orderId={orderId} onSuccess={finalizeAppointment} />
 *
 * Intentionally NOT faked: `createPaymentOrder` rejects with a clear,
 * catchable error until Person A implements POST /payments/order. Replace
 * only the body of this function with the real `fetch()` call when that
 * endpoint ships — nothing in BookAppointment.tsx needs to change.
 */

export interface AppointmentDraft {
  hospitalId: string;
  hospitalName: string;
  symptoms: string;
  date: string;
  time: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
}

export class PaymentIntegrationPendingError extends Error {
  constructor() {
    super(
      "Payment integration is not yet available — Person A's payment backend (POST /payments/order) has not been implemented."
    );
    this.name = 'PaymentIntegrationPendingError';
  }
}

/** TODO(Person A): POST /payments/order  body: AppointmentDraft -> PaymentOrder */
export async function createPaymentOrder(_draft: AppointmentDraft): Promise<PaymentOrder> {
  throw new PaymentIntegrationPendingError();
}

/** TODO(Person A): POST /payments/verify  body: { orderId, paymentId, signature } */
export async function verifyPayment(_orderId: string, _paymentId: string, _signature: string): Promise<boolean> {
  throw new PaymentIntegrationPendingError();
}
