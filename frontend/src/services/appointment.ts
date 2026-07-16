/**
 * MOCKED APPOINTMENT SERVICE
 * Replace mock bodies with real `fetch()` calls when the backend is ready.
 */

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type AppointmentMode = 'In-Person' | 'Video Call';

export interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  hospitalName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  mode: AppointmentMode;
  avatarInitials: string;
  symptoms?: string;
}

export interface BookAppointmentPayload {
  hospitalId: string;
  hospitalName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  symptoms: string;
  date: string;
  time: string;
}

const SIMULATED_LATENCY_MS = 700;

function delay<T>(value: T, ms: number = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-1042',
    doctorName: 'Dr. Rhea Kapoor',
    doctorSpecialty: 'Cardiologist',
    hospitalName: 'Fortis Escorts Heart Institute',
    date: '2026-07-18',
    time: '10:30 AM',
    status: 'Confirmed',
    mode: 'In-Person',
    avatarInitials: 'RK',
    symptoms: 'Occasional chest tightness during exercise.',
  },
  {
    id: 'APT-1045',
    doctorName: 'Dr. Ishaan Mehta',
    doctorSpecialty: 'Gastroenterologist',
    hospitalName: 'Medanta - The Medicity',
    date: '2026-07-25',
    time: '3:00 PM',
    status: 'Pending',
    mode: 'In-Person',
    avatarInitials: 'IM',
    symptoms: 'Mild abdominal discomfort after meals for a week.',
  },
  {
    id: 'APT-1038',
    doctorName: 'Dr. Vikram Nair',
    doctorSpecialty: 'General Physician',
    hospitalName: 'Apollo Hospital, Noida',
    date: '2026-06-18',
    time: '4:00 PM',
    status: 'Completed',
    mode: 'In-Person',
    avatarInitials: 'VN',
    symptoms: 'Routine annual checkup.',
  },
  {
    id: 'APT-1031',
    doctorName: 'Dr. Priya Menon',
    doctorSpecialty: 'Pediatrician',
    hospitalName: 'Apollo Hospital, Noida',
    date: '2026-05-14',
    time: '9:30 AM',
    status: 'Completed',
    mode: 'Video Call',
    avatarInitials: 'PM',
    symptoms: 'Follow-up on seasonal allergy medication.',
  },
  {
    id: 'APT-1029',
    doctorName: 'Dr. Sana Ahmed',
    doctorSpecialty: 'Dermatologist',
    hospitalName: 'Max Super Speciality Hospital',
    date: '2026-06-02',
    time: '11:15 AM',
    status: 'Cancelled',
    mode: 'Video Call',
    avatarInitials: 'SA',
    symptoms: 'Persistent skin rash on forearm.',
  },
];

/** Available slots — TODO(API): GET /api/hospitals/:id/doctors/:id/slots?date= */
export const AVAILABLE_TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

/** TODO(API): GET /api/patients/:id/appointments/upcoming */
export async function getUpcomingAppointment(_patientId: string): Promise<Appointment | null> {
  const upcoming = MOCK_APPOINTMENTS.find((a) => a.status === 'Confirmed' || a.status === 'Pending');
  return delay(upcoming ?? null);
}

/** TODO(API): GET /api/patients/:id/appointments */
export async function getAppointments(_patientId: string): Promise<Appointment[]> {
  const sorted = [...MOCK_APPOINTMENTS].sort((a, b) => b.date.localeCompare(a.date));
  return delay(sorted);
}

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

/** TODO(API): POST /api/appointments */
export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  if (!payload.hospitalId || !payload.doctorId) {
    throw new Error('Please select a hospital and doctor.');
  }
  if (!payload.symptoms.trim()) {
    throw new Error('Please describe your symptoms.');
  }
  if (!payload.date) {
    throw new Error('Please select a date.');
  }
  if (!payload.time) {
    throw new Error('Please select a time slot.');
  }

  const newAppointment: Appointment = {
    id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
    doctorName: payload.doctorName,
    doctorSpecialty: payload.doctorSpecialty,
    hospitalName: payload.hospitalName,
    date: payload.date,
    time: payload.time,
    status: 'Pending',
    mode: 'In-Person',
    avatarInitials: initialsOf(payload.doctorName),
    symptoms: payload.symptoms,
  };

  MOCK_APPOINTMENTS.unshift(newAppointment);
  return delay(newAppointment, 1100);
}

/** TODO(API): PATCH /api/appointments/:id/cancel */
export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  const appt = MOCK_APPOINTMENTS.find((a) => a.id === appointmentId);
  if (!appt) throw new Error('Appointment not found.');
  if (appt.status === 'Completed' || appt.status === 'Cancelled') {
    throw new Error(`Cannot cancel an appointment that is already ${appt.status.toLowerCase()}.`);
  }
  appt.status = 'Cancelled';
  return delay({ ...appt }, 600);
}