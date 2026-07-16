import { useEffect, useState, type ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPatientProfile,
  updatePatientProfile,
  type PatientProfile as PatientProfileType,
} from '../services/patient';
import ProfileField from '../components/ProfileField';
import TagInput from '../components/TagInput';
import Toast from '../components/Toast';
import './PatientProfile.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Female', 'Male', 'Other'];

export default function PatientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) return;
    getPatientProfile(user.id).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [user]);

  function updateField(field: keyof PatientProfileType, value: string) {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
    setDirty(true);
  }

  function updateEmergencyField(field: keyof PatientProfileType['emergencyContact'], value: string) {
    setProfile((prev) =>
      prev ? { ...prev, emergencyContact: { ...prev.emergencyContact, [field]: value } } : prev
    );
    setDirty(true);
  }

  async function handleSave() {
    if (!profile || !user) return;
    setSaving(true);
    try {
      const updated = await updatePatientProfile(user.id, profile);
      setProfile(updated);
      setDirty(false);
      setToast({ message: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not save changes.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="profile-page">
        <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 320, marginTop: 24, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const initials = profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="profile-page">
      {/* Header card */}
      <section className="profile-header card-surface fade-in-up">
        <div className="profile-header__left">
          <div className="profile-header__avatar-wrap">
            <div className="profile-header__avatar">{initials}</div>
            <button className="profile-header__avatar-edit" title="Change photo (not connected)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 4h4v4M9 20H5v-4M20 4l-7 7M4 20l7-7" />
              </svg>
            </button>
          </div>
          <div>
            <h2>{profile.name}</h2>
            <p className="text-secondary">{profile.email}</p>
            <span className="profile-header__abha mono">ABHA: {profile.abhaNumber}</span>
          </div>
        </div>
        <span className="profile-header__blood-badge">
          {profile.bloodGroup}
          <span>Blood Group</span>
        </span>
      </section>

      {/* Personal Information */}
      <section className="profile-section card-surface fade-in-up">
        <h3 className="profile-section__title">Personal Information</h3>
        <div className="profile-section__grid">
          <ProfileField label="Full Name" name="name" value={profile.name} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} />
          <ProfileField label="Email Address" name="email" type="email" value={profile.email} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('email', e.target.value)} />
          <ProfileField label="Phone Number" name="phone" type="tel" value={profile.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('phone', e.target.value)} />
          <ProfileField label="Date of Birth" name="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('dateOfBirth', e.target.value)} />
          <ProfileField label="Gender" name="gender" type="select" value={profile.gender} options={GENDERS} onChange={(e) => updateField('gender', e.target.value)} />
        </div>
      </section>

      {/* Medical Information */}
      <section className="profile-section card-surface fade-in-up">
        <h3 className="profile-section__title">Medical Information</h3>
        <div className="profile-section__grid">
          <ProfileField label="Blood Group" name="bloodGroup" type="select" value={profile.bloodGroup} options={BLOOD_GROUPS} onChange={(e) => updateField('bloodGroup', e.target.value)} />
          <ProfileField label="ABHA Number" name="abhaNumber" mono value={profile.abhaNumber} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('abhaNumber', e.target.value)} />
        </div>
        <div className="profile-section__tags">
          <TagInput
            label="Allergies"
            tags={profile.allergies}
            tone="coral"
            placeholder="e.g. Penicillin"
            onChange={(allergies) => { setProfile((p) => (p ? { ...p, allergies } : p)); setDirty(true); }}
          />
          <TagInput
            label="Medical Conditions"
            tags={profile.medicalConditions}
            tone="violet"
            placeholder="e.g. Hypertension"
            onChange={(medicalConditions) => { setProfile((p) => (p ? { ...p, medicalConditions } : p)); setDirty(true); }}
          />
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="profile-section card-surface fade-in-up">
        <h3 className="profile-section__title">Emergency Contact</h3>
        <div className="profile-section__grid">
          <ProfileField label="Contact Name" name="emergencyName" value={profile.emergencyContact.name} onChange={(e: ChangeEvent<HTMLInputElement>) => updateEmergencyField('name', e.target.value)} />
          <ProfileField label="Relationship" name="emergencyRelation" value={profile.emergencyContact.relation} onChange={(e: ChangeEvent<HTMLInputElement>) => updateEmergencyField('relation', e.target.value)} />
          <ProfileField label="Phone Number" name="emergencyPhone" type="tel" value={profile.emergencyContact.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => updateEmergencyField('phone', e.target.value)} />
        </div>
      </section>

      {/* Save bar */}
      <div className="profile-save-bar">
        <span className="profile-save-bar__status">
          {dirty ? 'You have unsaved changes' : 'All changes saved'}
        </span>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <span className="spinner" /> : 'Save Changes'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}