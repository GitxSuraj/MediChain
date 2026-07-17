import { useEffect, useMemo, useState } from "react";

import "../styles.css";
import BedCategorySummary from "../components/BedCategorySummary.jsx";
import BedController from "../components/BedController.jsx";
import TransferPanel from "../components/TransferPanel.jsx";
import { getHospitals, updateBedAvailability } from "../services/api.js";
import { createRealtimeSocket } from "../websocket/socket.js";

const defaultCategory = "icu";

// Doctor directory — keyed by the real hospital names seeded in MongoDB
// (backend/scripts/seed_hospitals.py). Purely for admin display, no backend
// changes needed. Edit/add names here freely.
const DOCTORS_BY_HOSPITAL = {
  "CityCare General Hospital": [
    { name: "Dr. Ramesh Iyer", specialty: "Emergency Medicine" },
    { name: "Dr. Sunita Rao", specialty: "ICU Intensivist" },
    { name: "Dr. Anil Bose", specialty: "General Physician" },
  ],
  "Lotus Multispeciality Center": [
    { name: "Dr. Farah Sheikh", specialty: "Cardiologist" },
    { name: "Dr. Vivek Nanda", specialty: "ICU Intensivist" },
    { name: "Dr. Kriti Sharma", specialty: "Diagnostics" },
  ],
  "Sunrise Trauma Institute": [
    { name: "Dr. Rohan Bakshi", specialty: "Trauma Surgeon" },
    { name: "Dr. Meenal Joshi", specialty: "Emergency Medicine" },
    { name: "Dr. Salim Khan", specialty: "Blood Bank Specialist" },
  ],
  "Green Valley Women's Hospital": [
    { name: "Dr. Ayesha Kapoor", specialty: "Obstetrician" },
    { name: "Dr. Neel Verma", specialty: "Neonatal ICU" },
    { name: "Dr. Priyanka Das", specialty: "Gynecologist" },
  ],
  "NorthStar Children's Medical": [
    { name: "Dr. Karan Mehta", specialty: "Pediatrician" },
    { name: "Dr. Ila Chandran", specialty: "Pediatric ICU" },
    { name: "Dr. Yusuf Ansari", specialty: "Emergency Medicine" },
  ],
};

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

  const selectedHospitalDoctors = selectedHospital
    ? DOCTORS_BY_HOSPITAL[selectedHospital.name] || []
    : [];

  const networkStats = useMemo(() => {
    return hospitals.reduce(
      (acc, h) => {
        acc.totalGeneral += h.beds?.general?.available ?? 0;
        acc.totalIcu += h.beds?.icu?.available ?? 0;
        acc.totalOxygen += h.beds?.oxygen?.available ?? 0;
        acc.totalEmergency += h.beds?.emergency?.available ?? 0;
        return acc;
      },
      { totalGeneral: 0, totalIcu: 0, totalOxygen: 0, totalEmergency: 0 },
    );
  }, [hospitals]);

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

      {!loading && hospitals.length > 0 ? (
        <div className="stat-row">
          <div className="stat-card">
            <p className="stat-label">Hospitals in Network</p>
            <p className="stat-value">{hospitals.length}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">ICU Beds Available</p>
            <p className="stat-value">{networkStats.totalIcu}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">General Beds Available</p>
            <p className="stat-value">{networkStats.totalGeneral}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Oxygen Beds Available</p>
            <p className="stat-value">{networkStats.totalOxygen}</p>
          </div>
        </div>
      ) : null}

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

            <div>
              <p className="eyebrow" style={{ marginTop: "4px" }}>On-Duty Doctors</p>
              {selectedHospitalDoctors.length === 0 ? (
                <p style={{ color: "#5b6575" }}>No doctor roster added for this hospital yet.</p>
              ) : (
                <div className="tag-row">
                  {selectedHospitalDoctors.map((doc) => (
                    <span className="tag" key={doc.name}>
                      {doc.name} · {doc.specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
