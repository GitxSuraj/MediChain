import { useEffect, useMemo, useState } from "react";

import "../styles.css";
import BedCategorySummary from "../components/BedCategorySummary.jsx";
import BedController from "../components/BedController.jsx";
import TransferPanel from "../components/TransferPanel.jsx";
import { getHospitals, updateBedAvailability } from "../services/api.js";
import { createRealtimeSocket } from "../websocket/socket.js";

const defaultCategory = "icu";

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === selectedHospitalId),
    [hospitals, selectedHospitalId],
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
    setSuccessMessage("");

    try {
      const hospitalList = await getHospitals();
      setHospitals(hospitalList);
      setSelectedHospitalId((currentId) => currentId || hospitalList[0]?.id || "");
    } catch (err) {
      setError(err.message || "Unable to load hospitals.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateBeds(delta) {
    if (!selectedHospital) {
      return;
    }

    setUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await updateBedAvailability(selectedHospital.id, selectedCategory, delta);
      const updatedHospital = response.hospital;

      setHospitals((currentHospitals) =>
        currentHospitals.map((hospital) =>
          hospital.id === updatedHospital.id ? updatedHospital : hospital,
        ),
      );

      const available = updatedHospital.beds[selectedCategory].available;
      setSuccessMessage(`${selectedCategory.toUpperCase()} beds updated to ${available} available.`);
    } catch (err) {
      setError(err.message || "Unable to update bed availability.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Admin</p>
        <h2>Admin Dashboard</h2>
        <p>Select a hospital, review live availability, and adjust bed counts for the demo flow.</p>
      </div>

      <div className="toolbar">
        <label className="field hospital-selector">
          <span>Hospital</span>
          <select
            value={selectedHospitalId}
            disabled={loading || hospitals.length === 0}
            onChange={(event) => {
              setSelectedHospitalId(event.target.value);
              setSuccessMessage("");
              setError("");
            }}
          >
            {hospitals.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.name} - {hospital.city}
              </option>
            ))}
          </select>
        </label>

        <button className="secondary-button" type="button" disabled={loading} onClick={loadHospitals}>
          {loading ? "Loading..." : "Reload"}
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {successMessage ? <div className="alert success">{successMessage}</div> : null}

      {loading ? <div className="empty-state">Loading hospitals...</div> : null}

      {!loading && !selectedHospital && !error ? (
        <div className="empty-state">No hospitals found. Run the backend seed script first.</div>
      ) : null}

      {selectedHospital ? (
        <div className="admin-grid">
          <section className="hospital-panel" aria-labelledby="selected-hospital-heading">
            <div>
              <p className="eyebrow">Selected Hospital</p>
              <h3 id="selected-hospital-heading">{selectedHospital.name}</h3>
              <p>{selectedHospital.city}</p>
            </div>

            <div className="tag-row">
              {selectedHospital.facilities.map((facility) => (
                <span className="tag" key={facility}>
                  {facility}
                </span>
              ))}
            </div>

            <BedCategorySummary
              beds={selectedHospital.beds}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </section>

          <BedController
            category={selectedCategory}
            beds={selectedHospital.beds}
            disabled={!selectedHospital}
            updating={updating}
            onChangeCategory={(category) => {
              setSelectedCategory(category);
              setSuccessMessage("");
              setError("");
            }}
            onUpdateBeds={handleUpdateBeds}
          />
        </div>
      ) : null}

      <TransferPanel />
    </section>
  );
}
