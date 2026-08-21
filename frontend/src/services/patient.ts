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

export type MedicalHistoryType = 'Consultation' | 'Lab Report' | 'Prescription' | 'Procedure';

export interface LabValue {
  parameter: string;
  value: string;
  referenceRange: string;
  flag: 'normal' | 'high' | 'low';
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  duration: string;
}

export interface MedicalHistoryEntry {
  id: string;
  date: string;
  type: MedicalHistoryType;
  title: string;
  doctor: string;
  hospital: string;
  summary: string;
  labValues?: LabValue[];
  prescriptionItems?: PrescriptionItem[];
  /** Optional file attachment name (for uploaded documents) */
  fileName?: string;
  /** Optional base64 data URI of the attached file */
  fileData?: string;
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
  {
    id: 'h1',
    date: '2026-07-02',
    type: 'Lab Report',
    title: 'Complete Blood Count',
    doctor: 'Dr. Rhea Kapoor',
    hospital: 'Fortis Escorts Heart Institute',
    summary: 'All parameters within normal range.',
    labValues: [
      { parameter: 'Hemoglobin', value: '13.8 g/dL', referenceRange: '13.0–17.0', flag: 'normal' },
      { parameter: 'WBC Count', value: '7,200 /µL', referenceRange: '4,000–11,000', flag: 'normal' },
      { parameter: 'Platelet Count', value: '410,000 /µL', referenceRange: '150,000–450,000', flag: 'normal' },
    ],
  },
  {
    id: 'h2',
    date: '2026-06-18',
    type: 'Consultation',
    title: 'General Checkup',
    doctor: 'Dr. Vikram Nair',
    hospital: 'Apollo Hospital, Noida',
    summary: 'Routine follow-up, no concerns raised. Advised to continue current lifestyle and re-check in 6 months.',
  },
  {
    id: 'h3',
    date: '2026-05-27',
    type: 'Prescription',
    title: 'Antihistamine course',
    doctor: 'Dr. Rhea Kapoor',
    hospital: 'Fortis Escorts Heart Institute',
    summary: '5-day course prescribed for seasonal allergic rhinitis.',
    prescriptionItems: [
      { medicine: 'Cetirizine 10mg', dosage: '1 tablet, once daily (night)', duration: '5 days' },
      { medicine: 'Fluticasone Nasal Spray', dosage: '2 sprays each nostril, once daily', duration: '10 days' },
    ],
  },
  {
    id: 'h4',
    date: '2026-05-14',
    type: 'Consultation',
    title: 'Pediatric Follow-up',
    doctor: 'Dr. Priya Menon',
    hospital: 'Apollo Hospital, Noida',
    summary: 'Follow-up on seasonal allergy medication response. Symptoms improved significantly.',
  },
  {
    id: 'h5',
    date: '2026-04-09',
    type: 'Lab Report',
    title: 'Fasting Lipid Profile',
    doctor: 'Dr. Vikram Nair',
    hospital: 'Apollo Hospital, Noida',
    summary: 'LDL cholesterol slightly elevated; dietary adjustment recommended.',
    labValues: [
      { parameter: 'Total Cholesterol', value: '198 mg/dL', referenceRange: '< 200', flag: 'normal' },
      { parameter: 'LDL Cholesterol', value: '132 mg/dL', referenceRange: '< 100', flag: 'high' },
      { parameter: 'HDL Cholesterol', value: '52 mg/dL', referenceRange: '> 40', flag: 'normal' },
      { parameter: 'Triglycerides', value: '138 mg/dL', referenceRange: '< 150', flag: 'normal' },
    ],
  },
  {
    id: 'h6',
    date: '2026-02-21',
    type: 'Procedure',
    title: 'Echocardiogram (2D Echo)',
    doctor: 'Dr. Rhea Kapoor',
    hospital: 'Fortis Escorts Heart Institute',
    summary: 'Ejection fraction normal at 62%. No structural abnormalities detected. Routine screening, no follow-up required.',
  },
  {
    id: 'h7',
    date: '2025-12-11',
    type: 'Prescription',
    title: 'Post-viral fatigue management',
    doctor: 'Dr. Vikram Nair',
    hospital: 'Apollo Hospital, Noida',
    summary: 'Supportive care prescribed following viral fever.',
    prescriptionItems: [
      { medicine: 'Paracetamol 650mg', dosage: 'As needed for fever, max 3/day', duration: '5 days' },
      { medicine: 'Multivitamin', dosage: '1 tablet, once daily', duration: '30 days' },
    ],
  },
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** GET /patients/:id/health-summary */
export async function getHealthSummary(_patientId: string): Promise<HealthMetric[]> {
  return delay(MOCK_HEALTH_SUMMARY);
}

/** GET /patients/:id/history */
export async function getRecentMedicalHistory(
  patientId: string,
  limit: number = 3
): Promise<MedicalHistoryEntry[]> {
  const token = localStorage.getItem('medichain_token') || '';
  if (!token || !patientId) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.slice(0, limit).map((r: any) => ({
          id: r.record_id || r._id || String(Date.now()),
          date: r.date || new Date().toISOString().split('T')[0],
          type: (r.type as MedicalHistoryType) || 'Consultation',
          title: r.title || r.diagnosis || 'Medical Record',
          doctor: r.doctor_name || 'Doctor',
          hospital: r.hospital_name || 'Hospital',
          summary: r.notes || r.diagnosis || r.prescription || '',
          prescriptionItems: r.prescription ? [{ medicine: r.prescription, dosage: 'As prescribed', duration: 'Follow regimen' }] : undefined,
          fileName: r.file_name,
          fileData: r.file_data,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend history fetch error:', err);
  }
  return [];
}

/** GET /patients/:id/history/full */
export async function getFullMedicalHistory(patientId: string): Promise<MedicalHistoryEntry[]> {
  return getRecentMedicalHistory(patientId, 200);
}

/** GET /auth/profile */
export async function getPatientProfile(_patientId: string): Promise<PatientProfile> {
  const token = localStorage.getItem('medichain_token') || 'demo-session-token-ananya';
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const profile = await res.json();
      return {
        ...MOCK_PROFILE,
        ...profile,
      };
    }
  } catch (err) {
    console.warn('Backend getPatientProfile error:', err);
  }
  return delay({ ...MOCK_PROFILE });
}

/** PUT /auth/profile */
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

  const token = localStorage.getItem('medichain_token') || 'demo-session-token-ananya';
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      return { ...MOCK_PROFILE, ...updated };
    }
  } catch (err) {
    console.warn('Backend updatePatientProfile error:', err);
  }

  MOCK_PROFILE = { ...MOCK_PROFILE, ...updates };
  return delay({ ...MOCK_PROFILE }, 900);
}

/** POST /patients/{id}/documents — Upload a medical document (prescription, lab report, etc.) */
export async function uploadMedicalRecord(
  patientId: string,
  payload: {
    title: string;
    type?: string;
    date?: string;
    doctor_name?: string;
    hospital_name?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    file_data?: string;
    file_name?: string;
  }
): Promise<MedicalHistoryEntry> {
  const token = localStorage.getItem('medichain_token') || '';
  const res = await fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to upload document.');
  }
  const data = await res.json();
  return {
    id: data.record_id || String(Date.now()),
    date: data.date || new Date().toISOString().split('T')[0],
    type: (data.type as MedicalHistoryType) || 'Prescription',
    title: data.title || data.diagnosis || payload.title,
    doctor: data.doctor_name || payload.doctor_name || 'Self-Uploaded',
    hospital: data.hospital_name || payload.hospital_name || 'External',
    summary: data.notes || data.diagnosis || '',
    fileName: payload.file_name,
  };
}