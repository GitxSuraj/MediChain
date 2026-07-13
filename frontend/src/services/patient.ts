import type { Patient } from '../types/auth';

/**
 * MOCKED PATIENT SERVICE
 * Replace mock resolution with `fetch('/api/patients/...')` calls later.
 * Boundary stays identical — no other file needs to change.
 */

export interface HealthMetric {
  id: string;
  label: string;
  value: string;
  unit?: string;
  icon: 'heart' | 'pressure' | 'sugar' | 'weight';
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'watch' | 'alert';
}

export interface MedicalHistoryEntry {
  id: string;
  date: string;
  type: 'Consultation' | 'Lab Report' | 'Prescription' | 'Procedure';
  title: string;
  doctor: string;
  summary: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface PatientProfile extends Patient {
  allergies: string[];
  medicalConditions: string[];
  emergencyContact: EmergencyContact;
}

const SIMULATED_LATENCY_MS = 600;

function delay<T>(value: T, ms: number = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const MOCK_HEALTH_SUMMARY: HealthMetric[] = [
  { id: 'hr', label: 'Heart Rate', value: '72', unit: 'bpm', icon: 'heart', trend: 'stable', status: 'normal' },
  { id: 'bp', label: 'Blood Pressure', value: '118/76', unit: 'mmHg', icon: 'pressure', trend: 'down', status: 'normal' },
  { id: 'sugar', label: 'Blood Glucose', value: '104', unit: 'mg/dL', icon: 'sugar', trend: 'up', status: 'watch' },
  { id: 'weight', label: 'Weight', value: '61.5', unit: 'kg', icon: 'weight', trend: 'stable', status: 'normal' },
];

const MOCK_HISTORY: MedicalHistoryEntry[] = [
  { id: 'h1', date: '2026-07-02', type: 'Lab Report', title: 'Complete Blood Count', doctor: 'Dr. Rhea Kapoor', summary: 'All parameters within normal range.' },
  { id: 'h2', date: '2026-06-18', type: 'Consultation', title: 'General Checkup', doctor: 'Dr. Vikram Nair', summary: 'Routine follow-up, no concerns raised.' },
  { id: 'h3', date: '2026-05-27', type: 'Prescription', title: 'Antihistamine course', doctor: 'Dr. Rhea Kapoor', summary: '5-day course for seasonal allergies.' },
];

let MOCK_PROFILE: PatientProfile = {
  id: 'PAT-2026-0417',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  phone: '+91 98765 43210',
  avatarUrl: '',
  bloodGroup: 'O+',
  abhaNumber: '14-2345-6789-0123',
  dateOfBirth: '1994-03-12',
  gender: 'Female',
  allergies: ['Penicillin', 'Peanuts'],
  medicalConditions: ['Seasonal Allergic Rhinitis'],
  emergencyContact: {
    name: 'Rohan Sharma',
    relation: 'Spouse',
    phone: '+91 98111 22334',
  },
};

/** TODO(API): GET /api/patients/:id/health-summary */
export async function getHealthSummary(_patientId: string): Promise<HealthMetric[]> {
  return delay(MOCK_HEALTH_SUMMARY);
}

/** TODO(API): GET /api/patients/:id/history?limit= */
export async function getRecentMedicalHistory(
  _patientId: string,
  limit: number = 3
): Promise<MedicalHistoryEntry[]> {
  return delay(MOCK_HISTORY.slice(0, limit));
}

/** TODO(API): GET /api/patients/:id/profile */
export async function getPatientProfile(_patientId: string): Promise<PatientProfile> {
  return delay({ ...MOCK_PROFILE });
}

/** TODO(API): PUT /api/patients/:id/profile  body: Partial<PatientProfile> */
export async function updatePatientProfile(
  _patientId: string,
  updates: Partial<PatientProfile>
): Promise<PatientProfile> {
  if (updates.email && !/\S+@\S+\.\S+/.test(updates.email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (updates.phone && updates.phone.replace(/\D/g, '').length < 10) {
    throw new Error('Please enter a valid phone number.');
  }
  MOCK_PROFILE = { ...MOCK_PROFILE, ...updates };
  return delay({ ...MOCK_PROFILE }, 900);
}