import { request } from './api';

export function createPaymentOrder(payload: { appointment_id: string }) {
  const token = localStorage.getItem("medichain_patient_token") || localStorage.getItem("medichain_token");
  return request("/payments/create-order", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export function verifyPayment(payload: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) {
  const token = localStorage.getItem("medichain_patient_token") || localStorage.getItem("medichain_token");
  return request("/payments/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}
