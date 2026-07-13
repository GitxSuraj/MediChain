/**
 * MOCKED HOSPITAL SERVICE
 * Replace mock bodies with real `fetch()` calls when the backend is ready.
 */

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface Hospital {
  id: string;
  name: string;
  rating: number;
  distanceKm: number;
  availableDoctors: number;
  emergencyAvailable: boolean;
  emergencyPhone?: string;
  address: string;
  specialties: string[];
  doctors: Doctor[];
}

export interface HospitalFilters {
  query?: string;
  specialty?: string;
  emergencyOnly?: boolean;
  sortBy?: 'distance' | 'rating';
}

const SIMULATED_LATENCY_MS = 650;

function delay<T>(value: T, ms: number = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const MOCK_HOSPITALS: Hospital[] = [
  {
    id: 'HOS-01',
    name: 'Fortis Escorts Heart Institute',
    rating: 4.7,
    distanceKm: 2.3,
    availableDoctors: 18,
    emergencyAvailable: true,
    emergencyPhone: '+91 11 4713 5000',
    address: 'Okhla Road, New Delhi',
    specialties: ['Cardiology', 'Cardiac Surgery', 'ICU'],
    doctors: [
      { id: 'D1', name: 'Dr. Rhea Kapoor', specialty: 'Cardiologist' },
      { id: 'D2', name: 'Dr. Ashok Verma', specialty: 'Cardiac Surgeon' },
    ],
  },
  {
    id: 'HOS-02',
    name: 'Apollo Hospital, Noida',
    rating: 4.5,
    distanceKm: 4.1,
    availableDoctors: 32,
    emergencyAvailable: true,
    emergencyPhone: '+91 120 471 9000',
    address: 'Sector 26, Noida',
    specialties: ['General Medicine', 'Orthopedics', 'Pediatrics'],
    doctors: [
      { id: 'D3', name: 'Dr. Vikram Nair', specialty: 'General Physician' },
      { id: 'D4', name: 'Dr. Priya Menon', specialty: 'Pediatrician' },
    ],
  },
  {
    id: 'HOS-03',
    name: 'Max Super Speciality Hospital',
    rating: 4.6,
    distanceKm: 5.8,
    availableDoctors: 24,
    emergencyAvailable: false,
    address: 'Saket, New Delhi',
    specialties: ['Dermatology', 'Oncology', 'Neurology'],
    doctors: [
      { id: 'D5', name: 'Dr. Sana Ahmed', specialty: 'Dermatologist' },
      { id: 'D6', name: 'Dr. Karan Malhotra', specialty: 'Neurologist' },
    ],
  },
  {
    id: 'HOS-04',
    name: 'Medanta - The Medicity',
    rating: 4.8,
    distanceKm: 8.2,
    availableDoctors: 41,
    emergencyAvailable: true,
    emergencyPhone: '+91 124 414 1414',
    address: 'Sector 38, Gurugram',
    specialties: ['Gastroenterology', 'Nephrology', 'Transplant'],
    doctors: [
      { id: 'D7', name: 'Dr. Ishaan Mehta', specialty: 'Gastroenterologist' },
      { id: 'D8', name: 'Dr. Neha Sinha', specialty: 'Nephrologist' },
    ],
  },
  {
    id: 'HOS-05',
    name: 'AIIMS Delhi',
    rating: 4.4,
    distanceKm: 9.6,
    availableDoctors: 56,
    emergencyAvailable: true,
    emergencyPhone: '+91 11 2658 8500',
    address: 'Ansari Nagar, New Delhi',
    specialties: ['General Medicine', 'Trauma Care', 'Oncology'],
    doctors: [
      { id: 'D9', name: 'Dr. Arjun Rathore', specialty: 'General Physician' },
      { id: 'D10', name: 'Dr. Meera Iyer', specialty: 'Oncologist' },
    ],
  },
  {
    id: 'HOS-06',
    name: 'BLK-Max Super Speciality Hospital',
    rating: 4.5,
    distanceKm: 6.9,
    availableDoctors: 29,
    emergencyAvailable: false,
    address: 'Pusa Road, New Delhi',
    specialties: ['Orthopedics', 'Cardiology', 'Dermatology'],
    doctors: [
      { id: 'D11', name: 'Dr. Tanvi Shah', specialty: 'Orthopedic Surgeon' },
      { id: 'D12', name: 'Dr. Rajeev Bhatia', specialty: 'Cardiologist' },
    ],
  },
];

export const ALL_SPECIALTIES = Array.from(
  new Set(MOCK_HOSPITALS.flatMap((h) => h.specialties))
).sort();

/** TODO(API): GET /api/hospitals/nearby?limit= */
export async function getNearbyHospitals(limit: number = 3): Promise<Hospital[]> {
  const sorted = [...MOCK_HOSPITALS].sort((a, b) => a.distanceKm - b.distanceKm);
  return delay(sorted.slice(0, limit));
}

/** TODO(API): GET /api/hospitals?query=&specialty=&emergencyOnly=&sortBy= */
export async function getAllHospitals(filters?: HospitalFilters): Promise<Hospital[]> {
  let results = [...MOCK_HOSPITALS];

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(
      (h) => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)
    );
  }

  if (filters?.specialty) {
    results = results.filter((h) => h.specialties.includes(filters.specialty!));
  }

  if (filters?.emergencyOnly) {
    results = results.filter((h) => h.emergencyAvailable);
  }

  results.sort((a, b) =>
    filters?.sortBy === 'rating' ? b.rating - a.rating : a.distanceKm - b.distanceKm
  );

  return delay(results);
}

/** TODO(API): GET /api/hospitals/:id */
export async function getHospitalById(id: string): Promise<Hospital | undefined> {
  return delay(MOCK_HOSPITALS.find((h) => h.id === id));
}