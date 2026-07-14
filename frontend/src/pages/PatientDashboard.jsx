import { useEffect, useMemo, useState } from "react";

import HospitalCard from "../components/HospitalCard.jsx";
import { getHospitals } from "../services/api.js";
import { createRealtimeSocket } from "../websocket/socket.js";

export default function PatientDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [cityFilter, setCityFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cities = useMemo(
    () => [...new Set(hospitals.map((hospital) => hospital.city))].sort(),
    [hospitals],
  );

  const facilities = useMemo(
    () => [...new Set(hospitals.flatMap((hospital) => hospital.facilities))].sort(),
    [hospitals],
  );

  const filteredHospitals = useMemo(
    () =>
      hospitals.filter((hospital) => {
        const cityMatches = !cityFilter || hospital.city === cityFilter;
        const facilityMatches = !facilityFilter || hospital.facilities.includes(facilityFilter);
        return cityMatches && facilityMatches;
      }),
    [cityFilter, facilityFilter, hospitals],
  );

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    const socket = createRealtimeSocket({
      onMessage: (message) => {
        if (message.event !== "bed_update") {
          return;
        }

        setHospitals((currentHospitals) =>
          currentHospitals.map((hospital) => {
            if (hospital.id !== message.hospital_id) {
              return hospital;
            }

            return {
              ...hospital,
              beds: {
                ...hospital.beds,
                [message.category]: {
                  ...hospital.beds[message.category],
                  available: message.new_available_count,
                },
              },
            };
          }),
        );
      },
    });

    return () => socket.close();
  }, []);

  async function loadHospitals() {
    setLoading(true);
    setError("");

    try {
      const hospitalList = await getHospitals();
      setHospitals(hospitalList);
    } catch (err) {
      setError(err.message || "Unable to load hospitals.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Patient</p>
        <h2>Patient Dashboard</h2>
        <p>Find hospitals by city or facility and watch bed availability update in real time.</p>
      </div>

      <div className="toolbar">
        <label className="field">
          <span>City</span>
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Facility</span>
          <select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value)}>
            <option value="">All facilities</option>
            {facilities.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
          </select>
        </label>

        <button className="secondary-button" type="button" disabled={loading} onClick={loadHospitals}>
          {loading ? "Loading..." : "Reload"}
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="empty-state">Loading hospitals...</div> : null}

      {!loading && !error && hospitals.length === 0 ? (
        <div className="empty-state">No hospitals found. Run the backend seed script first.</div>
      ) : null}

      {!loading && !error && hospitals.length > 0 && filteredHospitals.length === 0 ? (
        <div className="empty-state">No hospitals match the selected filters.</div>
      ) : null}

      <div className="patient-grid">
        {filteredHospitals.map((hospital) => (
          <HospitalCard hospital={hospital} key={hospital.id} />
        ))}
      </div>
    </section>
  );
}
