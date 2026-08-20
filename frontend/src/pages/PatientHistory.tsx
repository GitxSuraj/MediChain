import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPatientProfile, type PatientProfile } from '../services/patient';
import AllergyBanner from '../components/AllergyBanner';
import SearchBar from '../components/SearchBar';
import './PatientHistory.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Person B contract (roadmap section 13):
// GET /patients/{id}/history -> HistoryEntry[]
interface HistoryEntry {
  date: string;
  diagnosis: string;
  prescription: string;
  doctor_name: string;
  hospital_name: string;
  notes: string;
}

type FetchState = 'loading' | 'ready' | 'unavailable' | 'error';

export default function PatientHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [state, setState] = useState<FetchState>('loading');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    getPatientProfile(user.id).then(setProfile);

    fetch(`${API_URL}/patients/${encodeURIComponent(user.id)}/history`)
      .then((res) => {
        if (res.status === 404) {
          setState('unavailable');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load medical history.');
        return res.json();
      })
      .then((data: HistoryEntry[] | null) => {
        if (data === null) return;
        setHistory([...data].sort((a, b) => b.date.localeCompare(a.date)));
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [user]);

  const filtered = useMemo(() => {
    if (!query.trim()) return history;
    const q = query.toLowerCase();
    return history.filter(
      (h) =>
        h.diagnosis.toLowerCase().includes(q) ||
        h.doctor_name.toLowerCase().includes(q) ||
        h.hospital_name.toLowerCase().includes(q)
    );
  }, [history, query]);

  return (
    <div className="patient-history">
      {profile && (
        <AllergyBanner
          allergies={profile.allergies}
          medicalConditions={profile.medicalConditions}
          bloodGroup={profile.bloodGroup}
        />
      )}

      <div className="patient-history__controls">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by diagnosis, doctor, or hospital..." />
      </div>

      {state === 'loading' && (
        <div className="patient-history__skeletons">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {state === 'unavailable' && (
        <div className="patient-history__empty card-surface">
          <p>Medical history isn't available yet — this depends on a backend endpoint (Person B's <code className="mono">/patients/&#123;id&#125;/history</code>) that hasn't been implemented.</p>
        </div>
      )}

      {state === 'error' && (
        <div className="patient-history__empty card-surface">
          <p>Couldn't load your medical history right now. Please try again shortly.</p>
        </div>
      )}

      {state === 'ready' && filtered.length === 0 && (
        <div className="patient-history__empty card-surface">
          <p>{history.length === 0 ? 'No medical history on record yet.' : 'No records match your search.'}</p>
          {history.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setQuery('')}>Clear Search</button>
          )}
        </div>
      )}

      {state === 'ready' && filtered.length > 0 && (
        <div className="patient-history__timeline">
          {filtered.map((entry, i) => (
            <div key={`${entry.date}-${i}`} className="card-surface" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                <h4 style={{ margin: 0 }}>{entry.diagnosis}</h4>
                <span className="mono text-secondary" style={{ fontSize: '0.8rem' }}>
                  {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-secondary" style={{ margin: '0 0 var(--space-2)', fontSize: '0.85rem' }}>
                {entry.doctor_name} · {entry.hospital_name}
              </p>
              {entry.prescription && (
                <p style={{ margin: '0 0 var(--space-1)', fontSize: '0.9rem' }}>
                  <strong>Prescription:</strong> {entry.prescription}
                </p>
              )}
              {entry.notes && (
                <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
