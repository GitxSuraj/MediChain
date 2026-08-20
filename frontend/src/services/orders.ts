const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';
function patientToken() { return localStorage.getItem('medichain_token') || ''; }
function patientHeaders() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken()}` }; }

export interface MedicineItem {
  id: string;
  name: string;
  generic_name: string;
  price_per_unit: number;
  quantity: number;
  category: string;
  unit: string;
  sku: string;
  description: string;
}

export interface OrderItem {
  medicine_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  patient_id: string;
  hospital_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled';
  razorpay_order_id?: string;
  created_at: string;
}

export async function getPublicInventory(hospitalId: string): Promise<MedicineItem[]> {
  const res = await fetch(`${API}/hospitals/${hospitalId}/inventory/public`);
  if (!res.ok) throw new Error('Failed to load medicines.');
  return res.json();
}

export async function createOrder(hospitalId: string, items: { medicine_id: string; quantity: number }[]): Promise<any> {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: patientHeaders(),
    body: JSON.stringify({ hospital_id: hospitalId, items }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || 'Failed to create order.');
  return body;
}

export async function verifyOrderPayment(orderId: string, paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<Order> {
  const res = await fetch(`${API}/orders/${orderId}/verify-payment`, {
    method: 'POST',
    headers: patientHeaders(),
    body: JSON.stringify(paymentData),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || 'Payment verification failed.');
  return body;
}

export async function getMyOrders(): Promise<Order[]> {
  const res = await fetch(`${API}/orders/my`, { headers: patientHeaders() });
  if (!res.ok) throw new Error('Failed to load orders.');
  return res.json();
}
