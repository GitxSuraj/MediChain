import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getHealthSummary,
  getRecentMedicalHistory,
  uploadMedicalRecord,
  type HealthMetric,
  type MedicalHistoryEntry,
} from '../services/patient';
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

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('Prescription');
  const [docTitle, setDocTitle] = useState('');
  const [docDoctor, setDocDoctor] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [docNotes, setDocNotes] = useState('');
  const [docPrescription, setDocPrescription] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const loadData = () => {
    if (!user) return;
    Promise.all([
      getHealthSummary(user.id),
      getUpcomingAppointment(user.id),
      getNearbyHospitals(3),
      getRecentMedicalHistory(user.id, 4),
    ]).then(([metricsRes, apptRes, hospitalsRes, historyRes]) => {
      setMetrics(metricsRes);
      setAppointment(apptRes);
      setHospitals(hospitalsRes);
      setHistory(historyRes);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !docTitle) return;
    setUploading(true);
    try {
      await uploadMedicalRecord(user.id, {
        title: docTitle,
        type: docType,
        date: docDate,
        doctor_name: docDoctor || 'Self-Uploaded / Clinic Doctor',
        hospital_name: docHospital || 'Diagnostic Center / Lab',
        diagnosis: docTitle,
        prescription: docType === 'Prescription' ? docPrescription : undefined,
        notes: docNotes || (docType === 'Prescription' ? docPrescription : docTitle),
        file_data: fileData || undefined,
        file_name: fileName || undefined,
      });

      setShowUploadModal(false);
      setDocTitle('');
      setDocDoctor('');
      setDocHospital('');
      setDocNotes('');
      setDocPrescription('');
      setFileData(null);
      setFileName(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

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
      label: 'Upload Prescription & Reports',
      description: 'Store test results & lab documents',
      onClick: () => setShowUploadModal(true),
      accent: 'violet' as const,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      label: 'Pharmacy Store',
      description: 'Order medicines with home delivery',
      path: '/medicine-store',
      accent: 'amber' as const,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
          <path d="M8.5 8.5l7 7" />
        </svg>
      ),
    },
    {
      label: 'Medical History',
      description: 'View full records & health vitals',
      path: '/medical-history',
      accent: 'coral' as const,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12a8 8 0 1 0 3-6.3" /><path d="M4 4v5h5" /><path d="M12 8v4l3 2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
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

      {uploadSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✅ <strong>Document Uploaded!</strong> Your prescription/report has been safely added to your medical history.</span>
          <button className="btn btn-secondary" onClick={() => setUploadSuccess(false)}>Dismiss</button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="vital-modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="vital-modal-card card-surface" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="vital-modal-header">
              <h3>📄 Upload Prescription / Test Report</h3>
              <button className="vital-modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label>Document Category *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="input-select"
                >
                  <option value="Prescription">💊 Doctor Prescription</option>
                  <option value="Lab Report">🧪 Diagnostic Lab / Blood Test Report</option>
                  <option value="Procedure">🔬 Scan / Imaging / X-Ray Report</option>
                  <option value="Consultation">🩺 Consultation / Discharge Summary</option>
                </select>
              </div>

              <div className="form-group">
                <label>Report / Document Title *</label>
                <input
                  required
                  placeholder="e.g. Complete Blood Count (CBC), Dr. Verma Prescription"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="input-text"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Doctor Name (optional)</label>
                  <input
                    placeholder="e.g. Dr. A. Sharma"
                    value={docDoctor}
                    onChange={(e) => setDocDoctor(e.target.value)}
                    className="input-text"
                  />
                </div>
                <div className="form-group">
                  <label>Hospital / Lab Name</label>
                  <input
                    placeholder="e.g. Apollo Diagnostics"
                    value={docHospital}
                    onChange={(e) => setDocHospital(e.target.value)}
                    className="input-text"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Date of Document *</label>
                <input
                  type="date"
                  required
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="input-text"
                />
              </div>

              {docType === 'Prescription' && (
                <div className="form-group">
                  <label>Prescribed Medicines & Dosage</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paracetamol 650mg (1 tablet twice daily), Amoxicillin 500mg (1 cap after food for 5 days)"
                    value={docPrescription}
                    onChange={(e) => setDocPrescription(e.target.value)}
                    className="input-text"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Clinical Notes / Test Summary</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting blood sugar 94 mg/dL, normal hemoglobin 14.2 g/dL"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="input-text"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* File Attachment Upload */}
              <div className="form-group">
                <label>Attach File / Photo / PDF Scan (optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="input-text"
                />
                {fileName && (
                  <small style={{ color: '#0f766e', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    📎 Attached: {fileName}
                  </small>
                )}
              </div>

              <div className="vital-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Save Document to Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3>Recent Medical History</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => setShowUploadModal(true)}
              >
                + Upload Report
              </button>
            </div>
            <a href="/medical-history" className="dashboard__section-link">View all</a>
          </div>
          <div className="dashboard__history-list card-surface">
            {loading ? (
              <div className="skeleton skeleton--history" />
            ) : history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <p>No medical records or reports found.</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem' }}
                  onClick={() => setShowUploadModal(true)}
                >
                  + Upload Your First Prescription / Report
                </button>
              </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span className="history-row__doctor">{entry.doctor} · {entry.type}</span>
                      {entry.fileName && (
                        <span style={{ fontSize: '0.7rem', color: '#0f766e', background: '#f0fdfa', padding: '1px 6px', borderRadius: '4px' }}>
                          📎 {entry.fileName}
                        </span>
                      )}
                    </div>
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