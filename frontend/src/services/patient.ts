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

/** TODO(API): GET /api/patients/:id/health-summary */
export async function getHealthSummary(_patientId: string): Promise<HealthMetric[]> {
  return delay(MOCK_HEALTH_SUMMARY);
}

/** TODO(API): GET /api/patients/:id/history?limit= */
export async function getRecentMedicalHistory(
  _patientId: string,
  limit: number = 3
): Promise<MedicalHistoryEntry[]> {
  const sorted = [...MOCK_HISTORY].sort((a, b) => b.date.localeCompare(a.date));
  return delay(sorted.slice(0, limit));
}

/** TODO(API): GET /api/patients/:id/history/full */
export async function getFullMedicalHistory(_patientId: string): Promise<MedicalHistoryEntry[]> {
  const sorted = [...MOCK_HISTORY].sort((a, b) => b.date.localeCompare(a.date));
  return delay(sorted);
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