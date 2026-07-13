import type { LoginCredentials, Patient } from '../types/auth';

/**
 * MOCKED AUTH SERVICE
 * -------------------
 * Every function here isolates a future REST call.
 * To connect to a real backend, replace only the body of each
 * exported function with an equivalent `fetch()` call — nothing
 * outside this file needs to change.
 */

const MOCK_PATIENT: Patient = {
  id: 'PAT-2026-0417',
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.com',
  phone: '+91 98765 43210',
  avatarUrl: '',
  bloodGroup: 'O+',
  abhaNumber: '14-2345-6789-0123',
  dateOfBirth: '1994-03-12',
  gender: 'Female',
};

const SIMULATED_LATENCY_MS = 800;

function delay<T>(value: T, ms: number = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
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
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required.');
  }
  if (credentials.password.length < 4) {
    throw new Error('Invalid email or password.');
  }
  return delay({ user: MOCK_PATIENT, token: `mock-jwt-${Date.now()}` });
}

/**
 * TODO(API): Replace with
 * const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
 */
export async function fetchCurrentUser(token: string): Promise<Patient> {
  if (!token) throw new Error('No active session.');
  return delay(MOCK_PATIENT, 400);
}

/**
 * TODO(API): Replace with
 * await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
 */
export async function logoutRequest(): Promise<void> {
  return delay(undefined, 200);
}