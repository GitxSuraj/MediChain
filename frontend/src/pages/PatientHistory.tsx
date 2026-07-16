import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFullMedicalHistory,
  getPatientProfile,
  type MedicalHistoryEntry,
  type MedicalHistoryType,
  type PatientProfile,
} from '../services/patient';
import MedicalTimelineItem from '../components/MedicalTimelineItem';
import AllergyBanner from '../components/AllergyBanner';
import FilterTabs from '../components/FilterTabs';
import SearchBar from '../components/SearchBar';
import './PatientHistory.css';

type FilterValue = 'All' | MedicalHistoryType;

export default function PatientHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MedicalHistoryEntry[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([getFullMedicalHistory(user.id), getPatientProfile(user.id)]).then(([h, p]) => {
      setHistory(h);
      setProfile(p);
      setLoading(false);
    });
  }, [user]);

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      All: history.length,
      Consultation: 0,
      'Lab Report': 0,
      Prescription: 0,
      Procedure: 0,
    };
    history.forEach((h) => { base[h.type] += 1; });
    return base;
  }, [history]);

  const filtered = useMemo(() => {
    let results = filter === 'All' ? history : history.filter((h) => h.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.doctor.toLowerCase().includes(q) ||
          h.hospital.toLowerCase().includes(q)
      );
    }
    return results;
  }, [history, filter, query]);

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
        <FilterTabs
          options={[
            { label: 'All', value: 'All', count: counts.All },
            { label: 'Consultations', value: 'Consultation', count: counts.Consultation },
            { label: 'Lab Reports', value: 'Lab Report', count: counts['Lab Report'] },
            { label: 'Prescriptions', value: 'Prescription', count: counts.Prescription },
            { label: 'Procedures', value: 'Procedure', count: counts.Procedure },
          ]}
          active={filter}
          onChange={setFilter}
        />
        <SearchBar value={query} onChange={setQuery} placeholder="Search by title, doctor, or hospital..." />
      </div>

      {loading ? (
        <div className="patient-history__skeletons">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="patient-history__empty card-surface">
          <p>No records match your search.</p>
          <button className="btn btn-secondary" onClick={() => { setFilter('All'); setQuery(''); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="patient-history__timeline">
          {filtered.map((entry, index) => (
            <MedicalTimelineItem key={entry.id} entry={entry} isLast={index === filtered.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}