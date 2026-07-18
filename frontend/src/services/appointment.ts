export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type AppointmentMode = 'In-Person' | 'Video Call';

export interface Appointment {
  id: string; doctorName: string; doctorSpecialty: string; hospitalName: string;
  date: string; time: string; status: AppointmentStatus; mode: AppointmentMode;
  avatarInitials: string; symptoms?: string;
}
export interface BookAppointmentPayload {
  hospitalId: string; hospitalName: string; doctorId: string; doctorName: string;
  doctorSpecialty: string; symptoms: string; date: string; time: string;
}
export const AVAILABLE_TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('medichain_token');
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Appointment request failed.');
  return body;
}
export async function getUpcomingAppointment(_patientId: string): Promise<Appointment | null> {
  const appointments: Appointment[] = await request('/appointments');
  return appointments.find(a => a.status === 'Confirmed' || a.status === 'Pending') ?? null;
}
export async function getAppointments(_patientId: string): Promise<Appointment[]> { return request('/appointments'); }
export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  if (!payload.hospitalId || !payload.doctorId || !payload.symptoms.trim() || !payload.date || !payload.time) throw new Error('Complete all appointment details.');
  return request('/appointments', { method: 'POST', body: JSON.stringify(payload) });
}
export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return request(`/appointments/${appointmentId}/cancel`, { method: 'PATCH' });
}
