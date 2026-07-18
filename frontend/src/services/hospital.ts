/** Hospital directory and booking now use the same MongoDB hospital records as live beds. */
export interface Doctor { id: string; name: string; specialty: string; }
export interface Hospital {
  id: string; name: string; rating: number; distanceKm: number; availableDoctors: number;
  emergencyAvailable: boolean; emergencyPhone?: string; address: string; specialties: string[]; doctors: Doctor[];
  beds?: Record<string, { total: number; available: number }>;
}
export interface HospitalFilters { query?: string; specialty?: string; emergencyOnly?: boolean; sortBy?: 'distance' | 'rating'; }
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DOCTORS = [
  { id: 'doctor-1', name: 'Dr. Asha Mehta', specialty: 'General Physician' },
  { id: 'doctor-2', name: 'Dr. Ravi Kumar', specialty: 'Emergency Medicine' },
  { id: 'doctor-3', name: 'Dr. Neha Singh', specialty: 'ICU Intensivist' },
];
async function records(): Promise<Hospital[]> {
  const res = await fetch(`${API}/hospitals`); const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Unable to load hospitals.');
  return data.map((h: any, index: number) => ({ id: h.id, name: h.name, rating: 4.5, distanceKm: index + 1,
    availableDoctors: DOCTORS.length, emergencyAvailable: Boolean(h.beds?.emergency?.available),
    address: `${h.city}`, specialties: h.facilities || [], doctors: DOCTORS, beds: h.beds }));
}
export const ALL_SPECIALTIES = ['Emergency', 'ICU', 'Oxygen', 'Cardiology', 'Pediatrics', 'Trauma', 'Maternity'];
export async function getNearbyHospitals(limit = 3): Promise<Hospital[]> { return (await records()).slice(0, limit); }
export async function getAllHospitals(filters?: HospitalFilters): Promise<Hospital[]> {
  let items = await records();
  if (filters?.query) { const q = filters.query.toLowerCase(); items = items.filter(h => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)); }
  if (filters?.specialty) items = items.filter(h => h.specialties.some(s => s.toLowerCase() === filters.specialty!.toLowerCase()));
  if (filters?.emergencyOnly) items = items.filter(h => h.emergencyAvailable);
  return items;
}
export async function getHospitalById(id: string): Promise<Hospital | undefined> { return (await records()).find(h => h.id === id); }
