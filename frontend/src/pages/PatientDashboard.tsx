import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHealthSummary, getRecentMedicalHistory, type HealthMetric, type MedicalHistoryEntry } from '../services/patient';
import { getUpcomingAppointment, type Appointment } from '../services/appointment';
import { getNearbyHospitals, type Hospital } from '../services/hospital';
import DashboardCard from '../components/DashboardCard';
import QuickActionCard from '../components/QuickActionCard';
import AppointmentCard from '../components/AppointmentCard';
import HospitalCard from '../components/HospitalCard';
import HealthScoreRing from '../components/HealthScoreRing';
import MedicationReminders from '../components/MedicationReminders';
import FloatingAIButton from '../components/FloatingAIButton';
import './PatientDashboard.css';

const QUICK_ACTIONS = [
  {
    label: 'Book Appointment',
    description: 'Schedule a visit with a doctor',
    path: '/book-appointment',
    accent: 'teal' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M12 14v4M10 16h4" />
      </svg>
    ),
  },
  {
    label: 'Find a Hospital',
    description: 'Browse hospitals near you',
    path: '/hospitals',
    accent: 'violet' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    label: 'Medical History',
    description: 'View reports & prescriptions',
    path: '/medical-history',
    accent: 'amber' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12a8 8 0 1 0 3-6.3" /><path d="M4 4v5h5" /><path d="M12 8v4l3 2" />
      </svg>
    ),
  },
  {
    label: 'Update Profile',
    description: 'Keep your health record current',
    path: '/profile',
    accent: 'coral' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
];

const HISTORY_TYPE_COLOR: Record<MedicalHistoryEntry['type'], string> = {
  Consultation: 'var(--color-teal-600)',
  'Lab Report': 'var(--color-violet-600)',
  Prescription: 'var(--color-amber-500)',
  Procedure: 'var(--color-coral-600)',
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [history, setHistory] = useState<MedicalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      getHealthSummary(user.id),
      getUpcomingAppointment(user.id),
      getNearbyHospitals(3),
      getRecentMedicalHistory(user.id, 3),
    ]).then(([metricsRes, apptRes, hospitalsRes, historyRes]) => {
      if (cancelled) return;
      setMetrics(metricsRes);
      setAppointment(apptRes);
      setHospitals(hospitalsRes);
      setHistory(historyRes);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="dashboard">
      {/* Welcome Banner — signature animated hero */}
      <section className="welcome-banner fade-in-up">
        <span className="welcome-banner__orb welcome-banner__orb--1" />
        <span className="welcome-banner__orb welcome-banner__orb--2" />

        <div className="welcome-banner__text">
          <h2>Welcome back, {firstName} 👋</h2>
          <p>Here's what's happening with your health today.</p>
        </div>

        <svg className="welcome-banner__ekg" viewBox="0 0 300 60" preserveAspectRatio="none">
          <path
            className="welcome-banner__ekg-path"
            d="M0 30 H60 L75 30 L85 8 L95 52 L105 30 L120 30 H160 L172 30 L182 14 L192 46 L202 30 L215 30 H300"
            fill="none"
          />
        </svg>

        <div className="welcome-banner__id">
          <span className="welcome-banner__id-label">Patient ID</span>
          <span className="welcome-banner__id-value mono">{user?.id}</span>
        </div>
      </section>

      {/* Health Summary */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h3>Health Summary</h3>
        </div>
        <div className="dashboard__metrics-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton--metric" />)
            : metrics.map((m, i) => <DashboardCard key={m.id} metric={m} index={i} />)}
        </div>
      </section>

      {/* Health Score + Reminders */}
      <div className="dashboard__two-col">
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3>Health Overview</h3>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ) : (
            <HealthScoreRing score={84} />
          )}
        </section>

        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3>Reminders</h3>
          </div>
          <MedicationReminders />
        </section>
      </div>

      <div className="dashboard__two-col">
        {/* Upcoming Appointment */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3>Upcoming Appointment</h3>
            <a href="/appointment-status" className="dashboard__section-link">View all</a>
          </div>
          {loading ? (
            <div className="skeleton skeleton--card" />
          ) : appointment ? (
            <AppointmentCard appointment={appointment} />
          ) : (
            <div className="dashboard__empty card-surface">
              <p>No upcoming appointments.</p>
              <a href="/book-appointment" className="btn btn-primary">Book Now</a>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="dashboard__quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionCard key={action.label} {...action} />
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard__two-col">
        {/* Nearby Hospitals */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3>Nearby Hospitals</h3>
            <a href="/hospitals" className="dashboard__section-link">See all</a>
          </div>
          <div className="dashboard__hospitals-grid">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton--hospital" />)
              : hospitals.map((h) => <HospitalCard key={h.id} hospital={h} variant="compact" />)}
          </div>
        </section>

        {/* Recent Medical History */}
        <section className="dashboard__section">
          <div className="dashboard__section-header">
            <h3>Recent Medical History</h3>
            <a href="/medical-history" className="dashboard__section-link">View all</a>
          </div>
          <div className="dashboard__history-list card-surface">
            {loading ? (
              <div className="skeleton skeleton--history" />
            ) : (
              history.map((entry) => (
                <a key={entry.id} href="/medical-history" className="history-row">
                  <span className="history-row__dot" style={{ background: HISTORY_TYPE_COLOR[entry.type] }} />
                  <div className="history-row__content">
                    <div className="history-row__top">
                      <span className="history-row__title">{entry.title}</span>
                      <span className="history-row__date mono">
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="history-row__summary text-secondary">{entry.summary}</p>
                    <span className="history-row__doctor">{entry.doctor} · {entry.type}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>
      </div>

      <FloatingAIButton />
    </div>
  );
}