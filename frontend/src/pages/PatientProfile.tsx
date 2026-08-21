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
  const { user, updateUser } = useAuth();
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
      updateUser({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, bloodGroup: updated.bloodGroup, abhaNumber: updated.abhaNumber, dateOfBirth: updated.dateOfBirth, gender: updated.gender });
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
      <div className="profile">
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  const initials = profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="profile">
      {/* Header card */}
      <div className="profile__header-card">
        <div className="profile__avatar">{initials}</div>
        <div className="profile__header-info">
          <div className="profile__name">{profile.name}</div>
          <div className="profile__email">{profile.email}</div>
          <div className="profile__meta-row">
            {profile.abhaNumber && (
              <span className="profile__abha">ABHA: {profile.abhaNumber}</span>
            )}
            {profile.bloodGroup && (
              <span className="profile__blood-group">{profile.bloodGroup}</span>
            )}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          {dirty && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Unsaved changes</span>
          )}
          <button className="btn btn-secondary" onClick={() => setDirty(false)} disabled={!dirty || saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Personal Information */}
      <div className="profile__section">
        <h3 className="profile__section-title">Personal Information</h3>
        <div className="profile__grid">
          <ProfileField label="Full Name" name="name" value={profile.name} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)} />
          <ProfileField label="Email Address" name="email" type="email" value={profile.email} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('email', e.target.value)} />
          <ProfileField label="Phone Number" name="phone" type="tel" value={profile.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('phone', e.target.value)} />
          <ProfileField label="Date of Birth" name="dateOfBirth" type="date" value={profile.dateOfBirth} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('dateOfBirth', e.target.value)} />
          <ProfileField label="Gender" name="gender" type="select" value={profile.gender} options={GENDERS} onChange={(e) => updateField('gender', e.target.value)} />
        </div>
      </div>

      {/* Medical Information */}
      <div className="profile__section">
        <h3 className="profile__section-title">Medical Information</h3>
        <div className="profile__grid--2 profile__grid" style={{ marginBottom: 16 }}>
          <ProfileField label="Blood Group" name="bloodGroup" type="select" value={profile.bloodGroup} options={BLOOD_GROUPS} onChange={(e) => updateField('bloodGroup', e.target.value)} />
          <ProfileField label="ABHA Number" name="abhaNumber" mono value={profile.abhaNumber} onChange={(e: ChangeEvent<HTMLInputElement>) => updateField('abhaNumber', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
      </div>

      {/* Emergency Contact */}
      <div className="profile__section">
        <h3 className="profile__section-title">Emergency Contact</h3>
        <div className="profile__grid">
          <ProfileField label="Contact Name" name="emergencyName" value={profile.emergencyContact.name} onChange={(e: ChangeEvent<HTMLInputElement>) => updateEmergencyField('name', e.target.value)} />
          <ProfileField label="Relationship" name="emergencyRelation" value={profile.emergencyContact.relation} onChange={(e: ChangeEvent<HTMLInputElement>) => updateEmergencyField('relation', e.target.value)} />
          <ProfileField label="Phone Number" name="emergencyPhone" type="tel" value={profile.emergencyContact.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => updateEmergencyField('phone', e.target.value)} />
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
