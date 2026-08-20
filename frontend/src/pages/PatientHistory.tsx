import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFullMedicalHistory,
  getPatientProfile,
  updatePatientProfile,
  uploadMedicalRecord,
  type MedicalHistoryEntry,
  type MedicalHistoryType,
  type PatientProfile,
} from '../services/patient';
import { getVitals, addVital, deleteVital, type VitalRecord, type VitalType, VITAL_CONFIG } from '../services/vitals';
import MedicalTimelineItem from '../components/MedicalTimelineItem';
import AllergyBanner from '../components/AllergyBanner';
import FilterTabs from '../components/FilterTabs';
import SearchBar from '../components/SearchBar';
import './PatientHistory.css';

type FilterValue = 'All' | MedicalHistoryType | 'My Vitals';

const ALLERGY_PRESETS = ['Penicillin', 'Sulfa Drugs', 'Aspirin', 'Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy', 'Latex', 'Dust / Pollen'];
const CONDITION_PRESETS = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'GERD / Acidity', 'Hypothyroidism', 'High Cholesterol', 'Migraine', 'Arthritis'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MedicalHistoryEntry[]>([]);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterValue>('All');
  const [query, setQuery] = useState('');

  // Modals state
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);

  // Vitals form
  const [vitalType, setVitalType] = useState<VitalType>('blood_pressure');
  const [vitalValues, setVitalValues] = useState<Record<string, any>>({});
  const [vitalNotes, setVitalNotes] = useState('');
  const [savingVital, setSavingVital] = useState(false);

  // Document / Report Upload Form
  const [docType, setDocType] = useState('Prescription');
  const [docTitle, setDocTitle] = useState('');
  const [docDoctor, setDocDoctor] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [docNotes, setDocNotes] = useState('');
  const [docPrescription, setDocPrescription] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Allergies & Conditions Form
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [editConditions, setEditConditions] = useState<string[]>([]);
  const [editBloodGroup, setEditBloodGroup] = useState('O+');
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = () => {
    if (!user) return;
    Promise.all([getFullMedicalHistory(user.id), getPatientProfile(user.id), getVitals(user.id)])
      .then(([h, p, v]) => {
        setHistory(h);
        setProfile(p);
        setVitals(v);
        if (p) {
          setEditAllergies(p.allergies || []);
          setEditConditions(p.medicalConditions || []);
          setEditBloodGroup(p.bloodGroup || 'O+');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const counts = useMemo(() => {
    const base: Record<string, number> = {
      All: history.length + vitals.length,
      Consultation: 0,
      'Lab Report': 0,
      Prescription: 0,
      Procedure: 0,
      'My Vitals': vitals.length,
    };
    history.forEach((h) => { if (base[h.type] !== undefined) base[h.type] += 1; });
    return base;
  }, [history, vitals]);

  const filteredHistory = useMemo(() => {
    let results = filter === 'All' ? history : history.filter((h) => h.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.doctor.toLowerCase().includes(q) ||
          h.hospital.toLowerCase().includes(q) ||
          h.summary.toLowerCase().includes(q)
      );
    }
    return results;
  }, [history, filter, query]);

  // Handle Vital Submission
  const handleAddVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingVital(true);
    try {
      let unit = '';
      let parsedValue: Record<string, any> = {};
      if (vitalType === 'blood_pressure') {
        unit = 'mmHg';
        parsedValue = { systolic: Number(vitalValues.systolic || 120), diastolic: Number(vitalValues.diastolic || 80) };
      } else if (vitalType === 'blood_sugar') {
        unit = 'mg/dL';
        parsedValue = { level: Number(vitalValues.level || 100), fasting: Boolean(vitalValues.fasting) };
      } else if (vitalType === 'weight') {
        unit = 'kg';
        parsedValue = { value: Number(vitalValues.value || 65) };
      } else if (vitalType === 'heart_rate') {
        unit = 'bpm';
        parsedValue = { value: Number(vitalValues.value || 72) };
      } else if (vitalType === 'temperature') {
        unit = '°F';
        parsedValue = { value: Number(vitalValues.value || 98.6) };
      } else if (vitalType === 'spo2') {
        unit = '%';
        parsedValue = { value: Number(vitalValues.value || 98) };
      }

      const newVital = await addVital(user.id, { type: vitalType, value: parsedValue, unit, notes: vitalNotes });
      setVitals([newVital, ...vitals]);
      setShowVitalModal(false);
      setVitalValues({});
      setVitalNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to add vital');
    } finally {
      setSavingVital(false);
    }
  };

  const handleDeleteVital = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this vital reading?')) return;
    try {
      await deleteVital(user.id, id);
      setVitals(vitals.filter((v) => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete vital');
    }
  };

  // Handle Document / Report Upload
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
    setUploadingDoc(true);
    try {
      const newRecord = await uploadMedicalRecord(user.id, {
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

      setHistory([newRecord, ...history]);
      setShowUploadModal(false);
      setDocTitle('');
      setDocDoctor('');
      setDocHospital('');
      setDocNotes('');
      setDocPrescription('');
      setFileData(null);
      setFileName(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload report.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle Allergies & Conditions Update
  const toggleAllergy = (allergy: string) => {
    if (editAllergies.includes(allergy)) {
      setEditAllergies(editAllergies.filter((a) => a !== allergy));
    } else {
      setEditAllergies([...editAllergies, allergy]);
    }
  };

  const addCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAllergy.trim() && !editAllergies.includes(customAllergy.trim())) {
      setEditAllergies([...editAllergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const toggleCondition = (condition: string) => {
    if (editConditions.includes(condition)) {
      setEditConditions(editConditions.filter((c) => c !== condition));
    } else {
      setEditConditions([...editConditions, condition]);
    }
  };

  const addCustomCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCondition.trim() && !editConditions.includes(customCondition.trim())) {
      setEditConditions([...editConditions, customCondition.trim()]);
      setCustomCondition('');
    }
  };

  const handleSaveAllergies = async () => {
    if (!user || !profile) return;
    setSavingProfile(true);
    try {
      const updated = await updatePatientProfile(user.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        bloodGroup: editBloodGroup,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        allergies: editAllergies,
        medicalConditions: editConditions,
        emergencyContact: profile.emergencyContact,
      });
      setProfile(updated);
      setShowAllergyModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update allergies & conditions.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="patient-history-page">
      {/* Allergy & Condition Banner */}
      {profile && (
        <AllergyBanner
          allergies={profile.allergies}
          medicalConditions={profile.medicalConditions}
          bloodGroup={profile.bloodGroup}
          onEdit={() => {
            setEditAllergies(profile.allergies || []);
            setEditConditions(profile.medicalConditions || []);
            setEditBloodGroup(profile.bloodGroup || 'O+');
            setShowAllergyModal(true);
          }}
        />
      )}

      {/* Header action row */}
      <div className="history-header-actions">
        <div>
          <h2>Medical History & Health Records</h2>
          <p className="text-secondary">Manage prescriptions, lab test reports, health vitals, and ongoing conditions.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (profile) {
                setEditAllergies(profile.allergies || []);
                setEditConditions(profile.medicalConditions || []);
                setEditBloodGroup(profile.bloodGroup || 'O+');
              }
              setShowAllergyModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ⚠️ Allergies & Conditions
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowUploadModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#4f46e5', borderColor: '#4f46e5' }}
          >
            📄 + Add Report / Prescription
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setShowVitalModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🩺 + Log Health Vital
          </button>
        </div>
      </div>

      {/* Modal 1: Add Health Vital */}
      {showVitalModal && (
        <div className="vital-modal-backdrop" onClick={() => setShowVitalModal(false)}>
          <div className="vital-modal-card card-surface" onClick={(e) => e.stopPropagation()}>
            <div className="vital-modal-header">
              <h3>Log Health Vital</h3>
              <button className="vital-modal-close" onClick={() => setShowVitalModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddVital}>
              <div className="form-group">
                <label>Metric Type</label>
                <select
                  value={vitalType}
                  onChange={(e) => {
                    setVitalType(e.target.value as VitalType);
                    setVitalValues({});
                  }}
                  className="input-select"
                >
                  <option value="blood_pressure">🩺 Blood Pressure (mmHg)</option>
                  <option value="blood_sugar">🩸 Blood Sugar (mg/dL)</option>
                  <option value="heart_rate">❤️ Heart Rate (bpm)</option>
                  <option value="weight">⚖️ Weight (kg)</option>
                  <option value="temperature">🌡️ Body Temperature (°F)</option>
                  <option value="spo2">🫁 Oxygen Saturation SpO2 (%)</option>
                </select>
              </div>

              {vitalType === 'blood_pressure' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Systolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      required
                      value={vitalValues.systolic || ''}
                      onChange={(e) => setVitalValues({ ...vitalValues, systolic: e.target.value })}
                      className="input-text"
                    />
                  </div>
                  <div className="form-group">
                    <label>Diastolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      required
                      value={vitalValues.diastolic || ''}
                      onChange={(e) => setVitalValues({ ...vitalValues, diastolic: e.target.value })}
                      className="input-text"
                    />
                  </div>
                </div>
              )}

              {vitalType === 'blood_sugar' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div className="form-group">
                    <label>Level (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 95"
                      required
                      value={vitalValues.level || ''}
                      onChange={(e) => setVitalValues({ ...vitalValues, level: e.target.value })}
                      className="input-text"
                    />
                  </div>
                  <div className="form-group" style={{ paddingTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(vitalValues.fasting)}
                        onChange={(e) => setVitalValues({ ...vitalValues, fasting: e.target.checked })}
                      />
                      Fasting Reading
                    </label>
                  </div>
                </div>
              )}

              {['weight', 'heart_rate', 'temperature', 'spo2'].includes(vitalType) && (
                <div className="form-group">
                  <label>
                    {vitalType === 'weight' ? 'Weight (kg)' :
                     vitalType === 'heart_rate' ? 'Heart Rate (bpm)' :
                     vitalType === 'temperature' ? 'Temperature (°F)' : 'SpO2 Level (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Enter reading value"
                    value={vitalValues.value || ''}
                    onChange={(e) => setVitalValues({ ...vitalValues, value: e.target.value })}
                    className="input-text"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Morning reading, after breakfast"
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  className="input-text"
                />
              </div>

              <div className="vital-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVitalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingVital}>
                  {savingVital ? 'Saving...' : 'Save Vital Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Medical Report & Prescription */}
      {showUploadModal && (
        <div className="vital-modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div className="vital-modal-card card-surface" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="vital-modal-header">
              <h3>📄 Add Medical Report / Prescription</h3>
              <button className="vital-modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label>Record Type *</label>
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
                  placeholder="e.g. Lipid Profile Test, Dr. Kapoor Prescription"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="input-text"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Doctor Name</label>
                  <input
                    placeholder="e.g. Dr. Rhea Kapoor"
                    value={docDoctor}
                    onChange={(e) => setDocDoctor(e.target.value)}
                    className="input-text"
                  />
                </div>
                <div className="form-group">
                  <label>Hospital / Diagnostic Lab</label>
                  <input
                    placeholder="e.g. Max Hospital / City Lab"
                    value={docHospital}
                    onChange={(e) => setDocHospital(e.target.value)}
                    className="input-text"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Date of Record *</label>
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
                  <label>Prescribed Medications & Dosages</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Cetirizine 10mg (1 tablet at night), Paracetamol 650mg (SOS)"
                    value={docPrescription}
                    onChange={(e) => setDocPrescription(e.target.value)}
                    className="input-text"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Clinical Notes / Findings</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting glucose 95 mg/dL, normal lipid levels. Advised regular follow up."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="input-text"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Attach Scan / Photo / PDF (optional)</label>
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
                <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                  {uploadingDoc ? 'Uploading...' : 'Save to Medical History'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Manage Allergies & Ongoing Conditions */}
      {showAllergyModal && (
        <div className="vital-modal-backdrop" onClick={() => setShowAllergyModal(false)}>
          <div className="vital-modal-card card-surface" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="vital-modal-header">
              <h3>⚠️ Manage Allergies & Ongoing Conditions</h3>
              <button className="vital-modal-close" onClick={() => setShowAllergyModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Blood Group */}
              <div className="form-group">
                <label>Blood Group</label>
                <select
                  value={editBloodGroup}
                  onChange={(e) => setEditBloodGroup(e.target.value)}
                  className="input-select"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Known Allergies */}
              <div className="form-group">
                <label>Known Allergies (Click to toggle or add custom)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {ALLERGY_PRESETS.map((allergy) => {
                    const active = editAllergies.includes(allergy);
                    return (
                      <button
                        type="button"
                        key={allergy}
                        onClick={() => toggleAllergy(allergy)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          border: active ? '1px solid #e11d48' : '1px solid #cbd5e1',
                          background: active ? '#ffe4e6' : '#ffffff',
                          color: active ? '#9f1239' : '#475569',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {active ? '✓ ' : '+ '} {allergy}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="Add other allergy (e.g. Ciprofloxacin, Eggs)..."
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    className="input-text"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergy(e); } }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={addCustomAllergy}>
                    Add
                  </button>
                </div>

                {editAllergies.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                    <strong>Selected Allergies:</strong>{' '}
                    {editAllergies.map((a) => (
                      <span
                        key={a}
                        onClick={() => toggleAllergy(a)}
                        style={{
                          display: 'inline-block',
                          margin: '2px 4px',
                          padding: '2px 8px',
                          background: '#ffe4e6',
                          color: '#9f1239',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        title="Click to remove"
                      >
                        {a} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ongoing Medical Conditions */}
              <div className="form-group">
                <label>Ongoing Medical Conditions (Click to toggle or add custom)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {CONDITION_PRESETS.map((cond) => {
                    const active = editConditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          border: active ? '1px solid #7c3aed' : '1px solid #cbd5e1',
                          background: active ? '#ede9fe' : '#ffffff',
                          color: active ? '#5b21b6' : '#475569',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {active ? '✓ ' : '+ '} {cond}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder="Add other condition (e.g. PCOD, Fatty Liver)..."
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    className="input-text"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCondition(e); } }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={addCustomCondition}>
                    Add
                  </button>
                </div>

                {editConditions.length > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                    <strong>Selected Conditions:</strong>{' '}
                    {editConditions.map((c) => (
                      <span
                        key={c}
                        onClick={() => toggleCondition(c)}
                        style={{
                          display: 'inline-block',
                          margin: '2px 4px',
                          padding: '2px 8px',
                          background: '#ede9fe',
                          color: '#5b21b6',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        title="Click to remove"
                      >
                        {c} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="vital-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAllergyModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveAllergies} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Allergies & Conditions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vitals Summary Grid */}
      {vitals.length > 0 && filter === 'All' && (
        <div className="vitals-quick-summary">
          <div className="vitals-quick-header">
            <h3>Recent Vitals Readings</h3>
            <button className="link-btn" onClick={() => setFilter('My Vitals')}>View All Vitals ({vitals.length}) →</button>
          </div>
          <div className="vitals-mini-grid">
            {vitals.slice(0, 4).map((v) => {
              const cfg = VITAL_CONFIG[v.type];
              return (
                <div key={v.id} className="vital-mini-card card-surface">
                  <span className="vital-mini-label">{cfg?.label || v.type}</span>
                  <div className="vital-mini-value">
                    {v.type === 'blood_pressure' ? `${v.value.systolic}/${v.value.diastolic}` : v.type === 'blood_sugar' ? v.value.level : v.value.value}
                    <span className="vital-mini-unit">{v.unit}</span>
                  </div>
                  <span className="vital-mini-date">{new Date(v.recorded_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="patient-history__controls">
        <FilterTabs
          options={[
            { label: 'All Records', value: 'All', count: counts.All },
            { label: 'My Vitals', value: 'My Vitals', count: counts['My Vitals'] },
            { label: 'Consultations', value: 'Consultation', count: counts.Consultation },
            { label: 'Lab Reports', value: 'Lab Report', count: counts['Lab Report'] },
            { label: 'Prescriptions', value: 'Prescription', count: counts.Prescription },
            { label: 'Procedures', value: 'Procedure', count: counts.Procedure },
          ]}
          active={filter}
          onChange={(f) => setFilter(f as FilterValue)}
        />
        {filter !== 'My Vitals' && (
          <SearchBar value={query} onChange={setQuery} placeholder="Search doctor, hospital, diagnosis, prescription..." />
        )}
      </div>

      {loading ? (
        <div className="patient-history__skeletons">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : error ? (
        <div className="patient-history__empty card-surface"><p>{error}</p></div>
      ) : filter === 'My Vitals' ? (
        <div className="vitals-full-list">
          {vitals.length === 0 ? (
            <div className="patient-history__empty card-surface">
              <p>No health vitals recorded yet.</p>
              <button className="btn btn-primary" onClick={() => setShowVitalModal(true)}>
                + Log Your First Vital Reading
              </button>
            </div>
          ) : (
            <div className="vitals-cards-grid">
              {vitals.map((v) => {
                const cfg = VITAL_CONFIG[v.type];
                return (
                  <div key={v.id} className="vital-full-card card-surface">
                    <div className="vital-card-top">
                      <span className="vital-card-badge">{cfg?.label || v.type.replace('_', ' ')}</span>
                      <button
                        className="btn-icon-delete"
                        onClick={() => handleDeleteVital(v.id)}
                        title="Delete reading"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="vital-card-reading">
                      <span className="reading-number">
                        {v.type === 'blood_pressure' ? `${v.value.systolic}/${v.value.diastolic}` : v.type === 'blood_sugar' ? v.value.level : v.value.value}
                      </span>
                      <span className="reading-unit">{v.unit}</span>
                      {v.type === 'blood_sugar' && v.value.fasting && <span className="tag-fasting">Fasting</span>}
                    </div>
                    {v.notes && <p className="vital-card-notes">“{v.notes}”</p>}
                    <span className="vital-card-timestamp">
                      📅 {new Date(v.recorded_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="patient-history__empty card-surface">
          <p>No clinical records match your selection.</p>
          <button className="btn btn-secondary" onClick={() => { setFilter('All'); setQuery(''); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="patient-history__timeline">
          {filteredHistory.map((entry, index) => (
            <MedicalTimelineItem key={entry.id} entry={entry} isLast={index === filteredHistory.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
