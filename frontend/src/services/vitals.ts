const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';
function token() { return localStorage.getItem('medichain_token') || ''; }
function headers() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }; }

export type VitalType = 'blood_sugar' | 'blood_pressure' | 'weight' | 'heart_rate' | 'temperature' | 'spo2';

export interface VitalRecord {
  id: string;
  patient_id: string;
  type: VitalType;
  value: Record<string, number | boolean | string>;
  unit: string;
  notes: string;
  recorded_at: string;
}

export interface LatestVital extends VitalRecord {}

export async function addVital(patientId: string, data: { type: VitalType; value: Record<string, any>; unit: string; notes?: string; recorded_at?: string }): Promise<VitalRecord> {
  const res = await fetch(`${API}/patients/${patientId}/vitals`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || 'Failed to add vital.');
  return body;
}

export async function getVitals(patientId: string, type?: VitalType, limit = 50): Promise<VitalRecord[]> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`${API}/patients/${patientId}/vitals?${params}`, { headers: headers() });
  const body = await res.json().catch(() => []);
  if (!res.ok) throw new Error(body.detail || 'Failed to load vitals.');
  return body;
}

export async function getLatestVitals(patientId: string): Promise<LatestVital[]> {
  const res = await fetch(`${API}/patients/${patientId}/vitals/latest`, { headers: headers() });
  const body = await res.json().catch(() => []);
  if (!res.ok) throw new Error(body.detail || 'Failed to load latest vitals.');
  return body;
}

export async function updateVital(patientId: string, vitalId: string, data: Partial<{ value: Record<string, any>; unit: string; notes: string; recorded_at: string }>): Promise<VitalRecord> {
  const res = await fetch(`${API}/patients/${patientId}/vitals/${vitalId}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || 'Failed to update vital.');
  return body;
}

export async function deleteVital(patientId: string, vitalId: string): Promise<void> {
  const res = await fetch(`${API}/patients/${patientId}/vitals/${vitalId}`, { method: 'DELETE', headers: headers() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to delete vital.');
  }
}

// Maps vital types to display-friendly HealthMetric format
export const VITAL_CONFIG: Record<VitalType, { label: string; icon: 'heart' | 'pressure' | 'sugar' | 'weight'; unit: string; format: (v: Record<string, any>) => string }> = {
  heart_rate: { label: 'Heart Rate', icon: 'heart', unit: 'bpm', format: v => String(v.value ?? '--') },
  blood_pressure: { label: 'Blood Pressure', icon: 'pressure', unit: 'mmHg', format: v => `${v.systolic ?? '--'}/${v.diastolic ?? '--'}` },
  blood_sugar: { label: 'Blood Glucose', icon: 'sugar', unit: 'mg/dL', format: v => String(v.level ?? '--') },
  weight: { label: 'Weight', icon: 'weight', unit: 'kg', format: v => String(v.value ?? '--') },
  temperature: { label: 'Temperature', icon: 'heart', unit: '°F', format: v => String(v.value ?? '--') },
  spo2: { label: 'SpO2', icon: 'heart', unit: '%', format: v => String(v.value ?? '--') },
};
