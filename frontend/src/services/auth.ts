import type { LoginCredentials, Patient, RegisterCredentials } from '../types/auth';

/**
 * MOCKED AUTH SERVICE
 * -------------------
 * Every function here isolates a future REST call.
 * To connect to a real backend, replace only the body of each
 * exported function with an equivalent `fetch()` call — nothing
 * outside this file needs to change.
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || 'Request failed.');
  return body;
}

/**
 * TODO(API): Replace with
 * const res = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(credentials),
 * });
 * if (!res.ok) throw new Error((await res.json()).message);
 * return res.json();
 */
export async function loginRequest(
  credentials: LoginCredentials
): Promise<{ user: Patient; token: string }> {
  return api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
}

export async function registerRequest(credentials: RegisterCredentials): Promise<{ user: Patient; token: string }> {
  return api('/auth/register', { method: 'POST', body: JSON.stringify(credentials) });
}

/**
 * TODO(API): Replace with
 * const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
 */
export async function fetchCurrentUser(token: string): Promise<Patient> {
  return api('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}

/**
 * TODO(API): Replace with
 * await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
 */
export async function logoutRequest(): Promise<void> { return; }
