export interface BedInfo {
  total: number;
  available: number;
}

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
  };
}

export interface HospitalFilters {
  query?: string;
  specialty?: string;
  emergencyOnly?: boolean;
  sortBy?: "distance" | "rating";
}

const API_URL = "http://127.0.0.1:8000";

export async function getNearbyHospitals(limit: number = 3): Promise<Hospital[]> {
  const response = await fetch(`${API_URL}/hospitals`);

  if (!response.ok) {
    throw new Error("Failed to fetch hospitals");
  }

  const hospitals: Hospital[] = await response.json();

  return hospitals.slice(0, limit);
}

export async function getAllHospitals(
  filters?: HospitalFilters
): Promise<Hospital[]> {
  const response = await fetch(`${API_URL}/hospitals`);

  if (!response.ok) {
    throw new Error("Failed to fetch hospitals");
  }

  let hospitals: Hospital[] = await response.json();

  if (filters?.query) {
    const q = filters.query.toLowerCase();
    hospitals = hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
    );
  }

  if (filters?.specialty) {
    hospitals = hospitals.filter((h) =>
      h.facilities.includes(filters.specialty!)
    );
  }

  if (filters?.sortBy === "rating") {
    // Backend doesn't return ratings, so keep current order.
  }

  return hospitals;
}

export async function getHospitalById(
  id: string
): Promise<Hospital | undefined> {
  const response = await fetch(`${API_URL}/hospitals`);

  if (!response.ok) {
    throw new Error("Failed to fetch hospitals");
  }

  const hospitals: Hospital[] = await response.json();

  return hospitals.find((h) => h.id === id);
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
];