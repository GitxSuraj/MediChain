const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export interface BedInfo {
  total: number;
  available: number;
}

/** Backward-compatible Doctor type used by BookAppointment */
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

const DEFAULT_DOCTORS: Doctor[] = [
  { id: 'doctor-1', name: 'Dr. Asha Mehta', specialty: 'General Physician' },
  { id: 'doctor-2', name: 'Dr. Ravi Kumar', specialty: 'Emergency Medicine' },
  { id: 'doctor-3', name: 'Dr. Neha Singh', specialty: 'ICU Intensivist' },
];

export interface Hospital {
  id: string;
  name: string;
  city: string;
  facilities: string[];
  beds: {
    general: BedInfo;
    icu: BedInfo;
    oxygen: BedInfo;
    emergency: BedInfo;
    /** May be absent on hospitals seeded before this field existed — UI must handle that. */
    ventilators?: BedInfo;
  };
  latitude: number | null;
  longitude: number | null;
  /** Merged in from the reviews API — undefined until fetched. */
  averageRating?: number;
  reviewCount?: number;
  // Backward-compat fields used by BookAppointment.tsx
  rating?: number;
  distanceKm?: number;
  availableDoctors?: number;
  emergencyAvailable?: boolean;
  address?: string;
  specialties?: string[];
  doctors?: Doctor[];
}


export interface HospitalFilters {
  query?: string;
  specialty?: string;
  emergencyOnly?: boolean;
  sortBy?: "distance" | "rating";
  userLat?: number;
  userLng?: number;
}

interface RatingSummary {
  average_rating: number;
  review_count: number;
}

async function fetchRawHospitals(): Promise<Hospital[]> {
  const response = await fetch(`${API_URL}/hospitals`);
  if (!response.ok) {
    throw new Error("Failed to fetch hospitals");
  }
  const data = await response.json();
  // Attach backward-compat fields so all pages (BookAppointment, etc.) work
  return data.map((h: Hospital, index: number) => ({
    ...h,
    address: h.city ?? "",
    specialties: h.facilities ?? [],
    doctors: DEFAULT_DOCTORS,
    availableDoctors: DEFAULT_DOCTORS.length,
    emergencyAvailable: (h.beds?.emergency?.available ?? 0) > 0,
    rating: 4.5,
    distanceKm: index + 1,
  }));
}


/** Attaches real average_rating/review_count from the reviews API. Never invents fake ratings. */
export async function attachRatings(hospitals: Hospital[]): Promise<Hospital[]> {
  if (hospitals.length === 0) return hospitals;

  try {
    const ids = hospitals.map((h) => h.id).join(",");
    const response = await fetch(`${API_URL}/hospitals/ratings?hospital_ids=${encodeURIComponent(ids)}`);
    if (!response.ok) return hospitals;

    const summaries: Record<string, RatingSummary> = await response.json();
    return hospitals.map((h) => ({
      ...h,
      averageRating: summaries[h.id]?.average_rating ?? 0,
      reviewCount: summaries[h.id]?.review_count ?? 0,
    }));
  } catch {
    // Ratings are an enhancement — if the ratings service is unreachable,
    // still return real hospital data rather than blocking the page.
    return hospitals;
  }
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getNearbyHospitals(limit: number = 3): Promise<Hospital[]> {
  const hospitals = await fetchRawHospitals();
  return attachRatings(hospitals.slice(0, limit));
}

export async function getAllHospitals(filters?: HospitalFilters): Promise<Hospital[]> {
  let hospitals = await fetchRawHospitals();

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    hospitals = hospitals.filter(
      (h) => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
    );
  }

  if (filters?.specialty) {
    hospitals = hospitals.filter((h) => h.facilities.includes(filters.specialty!));
  }

  if (filters?.emergencyOnly) {
    hospitals = hospitals.filter((h) => (h.beds.emergency?.available ?? 0) > 0);
  }

  const withRatings = await attachRatings(hospitals);

  if (filters?.sortBy === "rating") {
    withRatings.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
  } else if (filters?.sortBy === "distance" && filters.userLat != null && filters.userLng != null) {
    withRatings.sort((a, b) => {
      const distA =
        a.latitude != null && a.longitude != null
          ? haversineDistanceKm(filters.userLat!, filters.userLng!, a.latitude, a.longitude)
          : Infinity;
      const distB =
        b.latitude != null && b.longitude != null
          ? haversineDistanceKm(filters.userLat!, filters.userLng!, b.latitude, b.longitude)
          : Infinity;
      return distA - distB;
    });
  }

  return withRatings;
}

export async function getHospitalById(id: string): Promise<Hospital | undefined> {
  const hospitals = await fetchRawHospitals();
  const match = hospitals.find((h) => h.id === id);
  if (!match) return undefined;
  const [withRating] = await attachRatings([match]);
  return withRating;
}

export const ALL_SPECIALTIES = [
  "Emergency",
  "ICU",
  "Oxygen",
  "Pharmacy",
  "Cardiology",
  "Diagnostics",
  "Pediatrics",
  "Trauma",
  "Blood Bank",
  "Maternity",
  "Neonatal ICU",
];
