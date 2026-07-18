const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function getHealth() {
  return request("/");
}

export function getHospitals(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return request(`/hospitals${query ? `?${query}` : ""}`);
}

export function updateBedAvailability(hospitalId, category, delta) {
  const hospitalToken = localStorage.getItem("medichain_hospital_token");
  return request(`/beds/${encodeURIComponent(hospitalId)}/${encodeURIComponent(category)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${hospitalToken}` },
    body: JSON.stringify({ delta }),
  });
}

export function createTransfer(payload) {
  return request("/transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function respondToTransfer(transferId, status) {
  const hospitalToken = localStorage.getItem("medichain_hospital_token");
  return request(`/transfers/${encodeURIComponent(transferId)}/respond`, {
    method: "POST",
    headers: { Authorization: `Bearer ${hospitalToken}` },
    body: JSON.stringify({ status }),
  });
}

export function getPatients() {
  return request("/patients");
}

export function getPatient(patientId) {
  return request(`/patients/${encodeURIComponent(patientId)}`);
}

export function getTransfers(hospital) {
  return request(`/transfers${hospital ? `?hospital=${encodeURIComponent(hospital)}` : ""}`);
}

export function getHospitalAppointmentRequests() {
  const token = localStorage.getItem("medichain_hospital_token");
  return request("/appointments/hospital/requests", { headers: { Authorization: `Bearer ${token}` } });
}

export function decideHospitalAppointment(appointmentId, status) {
  const token = localStorage.getItem("medichain_hospital_token");
  return request(`/appointments/hospital/${encodeURIComponent(appointmentId)}/decision`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
}

export { API_BASE_URL };
