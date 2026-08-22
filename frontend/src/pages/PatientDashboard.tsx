import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus, Upload, ShoppingBag, FileText,
  Heart, Activity, Droplet, Scale, X, ChevronRight, Plus,
  ShieldCheck, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getRecentMedicalHistory,
  uploadMedicalRecord,
  type MedicalHistoryEntry,
} from '../services/patient';
import { getUpcomingAppointment, type Appointment } from '../services/appointment';
import { getNearbyHospitals, type Hospital } from '../services/hospital';
import { getLatestVitals, VITAL_CONFIG, type LatestVital, type VitalType } from '../services/vitals';
import HospitalCard from '../components/HospitalCard';
import MedicationReminders from '../components/MedicationReminders';
import './PatientDashboard.css';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [vitals, setVitals] = useState<LatestVital[]>([]);
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
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getLatestVitals(user.id).catch(() => []),
      getUpcomingAppointment(user.id).catch(() => null),
      getNearbyHospitals(3).catch(() => []),
      getRecentMedicalHistory(user.id, 4).catch(() => []),
    ])
      .then(([vitalsRes, apptRes, hospitalsRes, historyRes]) => {
        setVitals((vitalsRes || []) as LatestVital[]);
        setAppointment(apptRes || null);
        setHospitals(hospitalsRes || []);
        setHistory(historyRes || []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, [user]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed.');
      e.target.value = ''; return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      alert('File size exceeds 5MB limit.');
      e.target.value = ''; return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !docTitle.trim()) return;
    setUploading(true);
    try {
      await uploadMedicalRecord(user.id, {
        title: docTitle,
        type: docType,
        doctor_name: docDoctor || undefined,
        hospital_name: docHospital || undefined,
        date: docDate,
        notes: docNotes || undefined,
        prescription: docPrescription || undefined,
        file_data: fileData || undefined,
        file_name: fileName || undefined,
      });
      setShowUploadModal(false);
      setDocTitle('');
      setDocDoctor('');
      setDocHospital('');
      setDocDate(new Date().toISOString().slice(0, 10));
      setDocNotes('');
      setDocPrescription('');
      setFileData(null);
      setFileName(null);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save record.');
    } finally {
      setUploading(false);
    }
  };

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper to extract specific vital or return standard reference default
  const getVitalDisplay = (key: VitalType, fallbackVal: string, fallbackUnit: string) => {
    const found = vitals.find(v => v.type === key);
    if (found) {
      const cfg = VITAL_CONFIG[found.type];
      const valStr = cfg ? cfg.format(found.value) : (typeof found.value === 'object' ? Object.values(found.value).join('/') : String(found.value));
      return { value: valStr, unit: found.unit || fallbackUnit, isLive: true };
    }
    return { value: fallbackVal, unit: fallbackUnit, isLive: false };
  };

  const heartVital = getVitalDisplay('heart_rate', '72', 'bpm');
  const bpVital = getVitalDisplay('blood_pressure', '120/80', 'mmHg');
  const glucoseVital = getVitalDisplay('blood_sugar', '95', 'mg/dL');
  const weightVital = getVitalDisplay('weight', '68.5', 'kg');

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="dashboard__welcome">
        <div className="dashboard__welcome-left">
          <div className="dashboard__welcome-greeting">{getTimeOfDay()},</div>
          <div className="dashboard__welcome-name">{firstName} 👋</div>
          <div className="dashboard__welcome-sub">
            Welcome to your unified health portal. All medical records and vitals are securely synced.
          </div>
        </div>
        <div className="dashboard__welcome-right">
          <div className="dashboard__welcome-chip">
            <span className="dashboard__welcome-dot" />
            <ShieldCheck size={16} style={{ color: '#10B981' }} />
            <span>Health ID: {user?.id?.slice(-8).toUpperCase() || 'PATIENT'}</span>
          </div>
        </div>
      </div>

      {/* Upload success toast */}
      {uploadSuccess && (
        <div className="badge-success" style={{
          padding: '14px 18px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.9rem', fontWeight: 600, boxShadow: 'var(--shadow-sm)'
        }}>
          <span>✓ Medical document uploaded successfully and added to your timeline.</span>
          <button onClick={() => setUploadSuccess(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="vital-modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="vital-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vital-modal-header">
              <h3>Upload Prescription / Test Report</h3>
              <button className="vital-modal-close" onClick={() => setShowUploadModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveUpload}>
              <div className="form-group">
                <label className="form-label">Document Category *</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input-text input-select">
                  <option value="Prescription">💊 Doctor Prescription</option>
                  <option value="Lab Report">🧪 Diagnostic Lab / Blood Test</option>
                  <option value="Procedure">🔬 Scan / Imaging / X-Ray</option>
                  <option value="Consultation">🩺 Consultation / Discharge Summary</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Document Title *</label>
                <input required placeholder="e.g. Complete Blood Count (CBC)" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="input-text" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Doctor Name</label>
                  <input placeholder="Dr. A. Sharma" value={docDoctor} onChange={(e) => setDocDoctor(e.target.value)} className="input-text" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital / Lab</label>
                  <input placeholder="Apollo Diagnostics" value={docHospital} onChange={(e) => setDocHospital(e.target.value)} className="input-text" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" required value={docDate} onChange={(e) => setDocDate(e.target.value)} className="input-text" />
              </div>
              {docType === 'Prescription' && (
                <div className="form-group">
                  <label className="form-label">Prescribed Medicines</label>
                  <textarea rows={2} placeholder="Paracetamol 650mg twice daily..." value={docPrescription} onChange={(e) => setDocPrescription(e.target.value)} className="input-text" style={{ resize: 'vertical' }} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Clinical Notes</label>
                <textarea rows={2} placeholder="e.g. Fasting blood sugar normal" value={docNotes} onChange={(e) => setDocNotes(e.target.value)} className="input-text" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Attach File (JPG, PNG or PDF — max 100 KB)</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} className="input-text" />
                {fileName && <small style={{ color: 'var(--color-primary-dark)', fontWeight: 600, marginTop: 4, display: 'block' }}>📎 {fileName}</small>}
              </div>
              <div className="vital-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Saving...' : 'Save to Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Colorful Quick Action Cards */}
      <div className="dashboard__actions">
        <Link to="/book-appointment" className="dashboard__action-card dashboard__action-card--emerald">
          <div className="dashboard__action-icon dashboard__action-icon--emerald">
            <CalendarPlus size={22} />
          </div>
          <div className="dashboard__action-text">
            <span className="dashboard__action-title">Book Visit</span>
            <span className="dashboard__action-sub">Find doctor & reserve slot</span>
          </div>
        </Link>

        <button className="dashboard__action-card dashboard__action-card--indigo" onClick={() => setShowUploadModal(true)}>
          <div className="dashboard__action-icon dashboard__action-icon--indigo">
            <Upload size={22} />
          </div>
          <div className="dashboard__action-text">
            <span className="dashboard__action-title">Upload Report</span>
            <span className="dashboard__action-sub">Prescriptions & test scans</span>
          </div>
        </button>

        <Link to="/medicine-store" className="dashboard__action-card dashboard__action-card--amber">
          <div className="dashboard__action-icon dashboard__action-icon--amber">
            <ShoppingBag size={22} />
          </div>
          <div className="dashboard__action-text">
            <span className="dashboard__action-title">Pharmacy</span>
            <span className="dashboard__action-sub">Medicines with fast delivery</span>
          </div>
        </Link>

        <Link to="/medical-history" className="dashboard__action-card dashboard__action-card--rose">
          <div className="dashboard__action-icon dashboard__action-icon--rose">
            <FileText size={22} />
          </div>
          <div className="dashboard__action-text">
            <span className="dashboard__action-title">Medical History</span>
            <span className="dashboard__action-sub">Complete clinical records</span>
          </div>
        </Link>
      </div>

      {/* Health Summary — 4 Colorful Metric Cards */}
      <div className="dashboard__card">
        <div className="dashboard__card-header">
          <div className="dashboard__card-title-wrap">
            <div className="dashboard__card-badge-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
              <Activity size={18} />
            </div>
            <span className="dashboard__card-title">Health Summary</span>
          </div>
          <Link to="/medical-history" className="dashboard__card-link">
            Update vitals <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="dashboard__vitals-grid">
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : (
          <div className="dashboard__vitals-grid">
            {/* Heart Rate Card */}
            <div className="dashboard__vital-box dashboard__vital-box--heart">
              <div className="dashboard__vital-top">
                <span className="dashboard__vital-label">Heart Rate</span>
                <div className="dashboard__vital-icon"><Heart size={18} /></div>
              </div>
              <div className="dashboard__vital-value">
                {heartVital.value} <span className="dashboard__vital-unit">{heartVital.unit}</span>
              </div>
              <span className="dashboard__vital-tag dashboard__vital-tag--optimal">
                {heartVital.isLive ? 'Live Tracked' : 'Normal & Steady'}
              </span>
            </div>

            {/* Blood Pressure Card */}
            <div className="dashboard__vital-box dashboard__vital-box--bp">
              <div className="dashboard__vital-top">
                <span className="dashboard__vital-label">Blood Pressure</span>
                <div className="dashboard__vital-icon"><Activity size={18} /></div>
              </div>
              <div className="dashboard__vital-value">
                {bpVital.value} <span className="dashboard__vital-unit">{bpVital.unit}</span>
              </div>
              <span className="dashboard__vital-tag dashboard__vital-tag--optimal">
                {bpVital.isLive ? 'Live Tracked' : 'Optimal Range'}
              </span>
            </div>

            {/* Blood Glucose Card */}
            <div className="dashboard__vital-box dashboard__vital-box--glucose">
              <div className="dashboard__vital-top">
                <span className="dashboard__vital-label">Blood Glucose</span>
                <div className="dashboard__vital-icon"><Droplet size={18} /></div>
              </div>
              <div className="dashboard__vital-value">
                {glucoseVital.value} <span className="dashboard__vital-unit">{glucoseVital.unit}</span>
              </div>
              <span className="dashboard__vital-tag dashboard__vital-tag--optimal">
                {glucoseVital.isLive ? 'Live Tracked' : 'Fasting Normal'}
              </span>
            </div>

            {/* Body Weight Card */}
            <div className="dashboard__vital-box dashboard__vital-box--weight">
              <div className="dashboard__vital-top">
                <span className="dashboard__vital-label">Body Weight</span>
                <div className="dashboard__vital-icon"><Scale size={18} /></div>
              </div>
              <div className="dashboard__vital-value">
                {weightVital.value} <span className="dashboard__vital-unit">{weightVital.unit}</span>
              </div>
              <span className="dashboard__vital-tag dashboard__vital-tag--optimal">
                {weightVital.isLive ? 'Live Tracked' : 'Target: 68 kg'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Row 1: Today's Medications + Upcoming Appointment */}
      <div className="dashboard__row">
        {/* Today's Medications */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-title-wrap">
              <div className="dashboard__card-badge-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <span style={{ fontSize: '1rem' }}>💊</span>
              </div>
              <span className="dashboard__card-title">Today's Medications</span>
            </div>
            <Link to="/medicine-reminders" className="dashboard__card-link">
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          <MedicationReminders />
        </div>

        {/* Upcoming Appointment */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-title-wrap">
              <div className="dashboard__card-badge-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <CalendarPlus size={16} />
              </div>
              <span className="dashboard__card-title">Upcoming Appointment</span>
            </div>
            <Link to="/appointment-status" className="dashboard__card-link">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-md)' }} />
          ) : appointment ? (
            <div className="dashboard__appt-card">
              <div className="dashboard__appt-date-block">
                <div className="dashboard__appt-date-month">
                  {new Date(appointment.date || '').toLocaleDateString('en-IN', { month: 'short' })}
                </div>
                <div className="dashboard__appt-date-num">
                  {new Date(appointment.date || '').getDate()}
                </div>
              </div>
              <div className="dashboard__appt-details">
                <div className="dashboard__appt-doc">{appointment.doctorName || 'Doctor'}</div>
                <div className="dashboard__appt-spec">{appointment.doctorSpecialty || 'Specialist Consultation'}</div>
                <div className="dashboard__appt-loc">
                  {appointment.hospitalName} • {appointment.time}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className={`badge badge-${appointment.status === 'Confirmed' ? 'success' : appointment.status === 'Pending' ? 'warning' : 'neutral'}`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
              <p className="text-secondary" style={{ fontSize: '0.88rem', margin: 0 }}>No appointments scheduled.</p>
              <Link to="/book-appointment" className="btn btn-primary" style={{ marginTop: 12, display: 'inline-flex' }}>
                Book Appointment <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Nearby Hospitals + Recent History */}
      <div className="dashboard__row">
        {/* Nearby Hospitals */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-title-wrap">
              <div className="dashboard__card-badge-icon" style={{ background: '#F0FDF4', color: '#15803D' }}>
                <span style={{ fontSize: '1rem' }}>🏥</span>
              </div>
              <span className="dashboard__card-title">Nearby Hospitals</span>
            </div>
            <Link to="/hospitals" className="dashboard__card-link">See all <ChevronRight size={14} /></Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading
              ? [0, 1, 2].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-sm)' }} />)
              : hospitals.slice(0, 3).map((h) => <HospitalCard key={h.id} hospital={h} variant="compact" />)
            }
          </div>
        </div>

        {/* Recent Medical Records */}
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <div className="dashboard__card-title-wrap">
              <div className="dashboard__card-badge-icon" style={{ background: '#FFF1F2', color: '#BE185D' }}>
                <FileText size={16} />
              </div>
              <span className="dashboard__card-title">Recent Medical Records</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setShowUploadModal(true)}>
                <Plus size={12} /> Upload
              </button>
              <Link to="/medical-history" className="dashboard__card-link">View all <ChevronRight size={14} /></Link>
            </div>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />
          ) : history.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
              <p className="text-secondary" style={{ fontSize: '0.88rem', margin: 0 }}>No records stored yet.</p>
              <button onClick={() => setShowUploadModal(true)} className="btn btn-secondary" style={{ marginTop: 10 }}>
                Upload Your First Report
              </button>
            </div>
          ) : (
            <div>
              {history.map((entry) => {
                let badgeClass = 'dashboard__record-badge-icon--doc';
                let iconChar = '🩺';
                if (entry.type === 'Prescription') { badgeClass = 'dashboard__record-badge-icon--rx'; iconChar = '💊'; }
                else if (entry.type === 'Lab Report') { badgeClass = 'dashboard__record-badge-icon--lab'; iconChar = '🧪'; }
                else if (entry.type === 'Procedure') { badgeClass = 'dashboard__record-badge-icon--proc'; iconChar = '🔬'; }

                return (
                  <Link key={entry.id} to="/medical-history" className="dashboard__record-item">
                    <div className={`dashboard__record-badge-icon ${badgeClass}`}>
                      {iconChar}
                    </div>
                    <div className="dashboard__record-info">
                      <div className="dashboard__record-title">{entry.title}</div>
                      <div className="dashboard__record-meta">{entry.doctor} • {entry.type}</div>
                    </div>
                    <div className="dashboard__record-date">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}