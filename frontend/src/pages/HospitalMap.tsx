import { useEffect, useState } from 'react';
import { getAllHospitals, type Hospital } from '../services/hospital';
import MapView from '../components/MapView';
import HospitalDetailModal from '../components/HospitalDetailModal';
import './HospitalMap.css';

export default function HospitalMap() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Hospital | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getAllHospitals()
      .then((data) => {
        setHospitals(data);
      })
      .catch(() => {
        setError('Could not load hospitals. Please check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="hospital-map-page">
      <div className="hospital-map-page__header">
        <h2>Find the Nearest Hospital</h2>
        <p className="text-secondary">Allow location access to sort hospitals by distance from you.</p>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 460, borderRadius: 'var(--radius-lg)' }} />
      ) : error ? (
        <div className="hospital-map-page__error card-surface">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={load}>Retry</button>
        </div>
      ) : (
        <MapView hospitals={hospitals} onHospitalSelect={setSelected} />
      )}

      {selected && <HospitalDetailModal hospital={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
