const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
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
  return request(`/beds/${hospitalId}/${category}`, {
    method: "POST",
    body: JSON.stringify({ delta }),
  });
}

export { API_BASE_URL };
