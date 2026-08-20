const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export type ReminderDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_DAYS: ReminderDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface Reminder {
  id: string;
  patient_id: string;
  medicine_name: string;
  dosage: string;
  times: string[];
  days: ReminderDay[];
  is_active: boolean;
  created_at: string;
}

export interface ReminderInput {
  medicine_name: string;
  dosage: string;
  times: string[];
  days: ReminderDay[];
  is_active: boolean;
}

async function parseOrThrow(response: Response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export async function getReminders(patientId: string): Promise<Reminder[]> {
  const response = await fetch(`${API_URL}/patients/${encodeURIComponent(patientId)}/reminders`);
  return parseOrThrow(response);
}

export async function createReminder(patientId: string, data: ReminderInput): Promise<Reminder> {
  const response = await fetch(`${API_URL}/patients/${encodeURIComponent(patientId)}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseOrThrow(response);
}

export async function updateReminder(
  patientId: string,
  reminderId: string,
  data: Partial<ReminderInput>
): Promise<Reminder> {
  const response = await fetch(
    `${API_URL}/patients/${encodeURIComponent(patientId)}/reminders/${encodeURIComponent(reminderId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
  return parseOrThrow(response);
}

export async function deleteReminder(patientId: string, reminderId: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/patients/${encodeURIComponent(patientId)}/reminders/${encodeURIComponent(reminderId)}`,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
}
