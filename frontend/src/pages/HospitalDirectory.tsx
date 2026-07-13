import { useEffect, useMemo, useState } from 'react';
import { getAllHospitals, ALL_SPECIALTIES, type Hospital } from '../services/hospital';
import HospitalCard from '../components/HospitalCard';
import HospitalDetailModal from '../components/HospitalDetailModal';
import SearchBar from '../components/SearchBar';
import FilterTabs from '../components/FilterTabs';
import './HospitalDirectory.css';

type SortOption = 'distance' | 'rating';

export default function HospitalDirectory() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      getAllHospitals({
        query,
        specialty: specialty === 'All' ? undefined : specialty,
        emergencyOnly,
        sortBy,
      }).then((data) => {
        setHospitals(data);
        setLoading(false);
      });
    }, 250); // light debounce for search typing

    return () => clearTimeout(timer);
  }, [query, specialty, emergencyOnly, sortBy]);

  const specialtyOptions = useMemo(
    () => ['All', ...ALL_SPECIALTIES],
    []
  );

  return (
    <div className="hospital-directory">
      <div className="hospital-directory__controls card-surface">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by hospital name or area..." />

        <div className="hospital-directory__filter-row">
          <FilterTabs
            options={specialtyOptions.map((s) => ({ label: s, value: s }))}
            active={specialty}
            onChange={setSpecialty}
          />

          <div className="hospital-directory__toggles">
            <label className="hospital-directory__emergency-toggle">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.checked)}
              />
              <span>Emergency only</span>
            </label>

            <select
              className="hospital-directory__sort-select mono"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="distance">Sort: Nearest</option>
              <option value="rating">Sort: Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="hospital-directory__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="hospital-directory__empty card-surface">
          <p>No hospitals match your filters.</p>
          <button
            className="btn btn-secondary"
            onClick={() => { setQuery(''); setSpecialty('All'); setEmergencyOnly(false); }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="hospital-directory__grid">
          {hospitals.map((h) => (
            <HospitalCard key={h.id} hospital={h} onViewDetails={setSelectedHospital} />
          ))}
        </div>
      )}

      {selectedHospital && (
        <HospitalDetailModal hospital={selectedHospital} onClose={() => setSelectedHospital(null)} />
      )}
    </div>
  );
}