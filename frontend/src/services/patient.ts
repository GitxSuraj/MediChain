import type { Patient } from '../types/auth';
import { getLatestVitals, VITAL_CONFIG, type VitalType } from './vitals';

/**
 * Patient service — health metrics, medical history, documents, and profile.
 * Integrates with the vitals API and document upload endpoints.
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
  fileData?: string;
  fileName?: string;
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

export async function getHealthSummary(patientId: string): Promise<HealthMetric[]> {
  try {
    const vitals = await getLatestVitals(patientId);
    if (vitals.length === 0) {
      return [
        { id: 'hr', label: 'Heart Rate', value: '--', unit: 'bpm', icon: 'heart', trend: 'stable', status: 'normal' },
        { id: 'bp', label: 'Blood Pressure', value: '--/--', unit: 'mmHg', icon: 'pressure', trend: 'stable', status: 'normal' },
        { id: 'sugar', label: 'Blood Glucose', value: '--', unit: 'mg/dL', icon: 'sugar', trend: 'stable', status: 'normal' },
        { id: 'weight', label: 'Weight', value: '--', unit: 'kg', icon: 'weight', trend: 'stable', status: 'normal' },
      ];
    }
    return vitals.map(v => {
      const config = VITAL_CONFIG[v.type as VitalType];
      return {
        id: v.type,
        label: config?.label ?? v.type,
        value: config?.format(v.value) ?? JSON.stringify(v.value),
        unit: v.unit || config?.unit,
        icon: config?.icon ?? 'heart',
        trend: 'stable' as const,
        status: 'normal' as const,
      };
    });
  } catch {
    return [
      { id: 'hr', label: 'Heart Rate', value: '--', unit: 'bpm', icon: 'heart', trend: 'stable', status: 'normal' },
      { id: 'bp', label: 'Blood Pressure', value: '--/--', unit: 'mmHg', icon: 'pressure', trend: 'stable', status: 'normal' },
      { id: 'sugar', label: 'Blood Glucose', value: '--', unit: 'mg/dL', icon: 'sugar', trend: 'stable', status: 'normal' },
      { id: 'weight', label: 'Weight', value: '--', unit: 'kg', icon: 'weight', trend: 'stable', status: 'normal' },
    ];
  }
}

export async function getRecentMedicalHistory(patientId: string, limit: number = 3): Promise<MedicalHistoryEntry[]> {
  const all = await getFullMedicalHistory(patientId);
  return all.slice(0, limit);
}

/** GET /patients/:id/history */
export async function getFullMedicalHistory(patientId: string): Promise<MedicalHistoryEntry[]> {
  const token = localStorage.getItem('medichain_patient_token') || localStorage.getItem('medichain_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/patients/${encodeURIComponent(patientId)}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ([]));
  if (!response.ok) throw new Error(body.detail || 'Could not load medical history.');
  return (Array.isArray(body) ? body : []).map((record: any, index: number) => ({
    id: record.id || `${record.date}-${record.doctor_name}-${index}`,
    date: record.date || new Date().toISOString().slice(0, 10),
    type: (record.type as MedicalHistoryType) || (record.prescription ? 'Prescription' : 'Consultation'),
    title: record.title || record.diagnosis || 'Medical Record',
    doctor: record.doctor_name || 'Doctor',
    hospital: record.hospital_name || 'Hospital / Lab',
    summary: record.notes || record.prescription || record.diagnosis || 'Recorded entry',
    prescriptionItems: record.prescription ? [{ medicine: record.prescription, dosage: '', duration: '' }] : undefined,
    fileData: record.file_data,
    fileName: record.file_name,
  }));
}

/** POST /patients/:id/documents — upload prescription or test report */
export async function uploadMedicalRecord(
  patientId: string,
  payload: {
    title: string;
    type: string;
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
  const token = localStorage.getItem('medichain_patient_token') || localStorage.getItem('medichain_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/patients/${encodeURIComponent(patientId)}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Failed to upload document.');
  return {
    id: body.id,
    date: body.date,
    type: body.type,
    title: body.title,
    doctor: body.doctor_name,
    hospital: body.hospital_name,
    summary: body.notes || body.prescription || body.diagnosis,
    fileData: body.file_data,
    fileName: body.file_name,
  };
}

/** GET /auth/profile */
export async function getPatientProfile(_patientId: string): Promise<PatientProfile> {
  const token = localStorage.getItem('medichain_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Could not load profile.');
  return body;
}

/** PUT /auth/profile */
export async function updatePatientProfile(
  _patientId: string,
  updates: Partial<PatientProfile>
): Promise<PatientProfile> {
  const token = localStorage.getItem('medichain_token');
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/auth/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(updates),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || 'Could not save profile.');
  return body;
}
