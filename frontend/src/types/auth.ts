export interface AuthUser {
  role: "patient" | "doctor" | "admin" | "";
  patient_id: string;
  hospital_id: string;
}