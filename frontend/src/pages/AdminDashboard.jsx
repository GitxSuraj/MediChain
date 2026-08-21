import { useEffect, useMemo, useState } from "react";

import "../styles.css";
import BedCategorySummary from "../components/BedCategorySummary.jsx";
import BedController from "../components/BedController.jsx";
import TransferPanel from "../components/TransferPanel.jsx";
import AppointmentRequests from "../components/AppointmentRequests.jsx";
import InventoryManagement from "./InventoryManagement.jsx";
import Billing from "./Billing.jsx";
import PermissionGate from "../components/PermissionGate.jsx";
import { getHospitals, getPatients, updateBedAvailability } from "../services/api.js";
import { createRealtimeSocket } from "../websocket/socket.js";

const defaultCategory = "icu";

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

export default function AdminDashboard({ hospitalId }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [activeTab, setActiveTab] = useState("beds");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [patientCount, setPatientCount] = useState(0);

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === selectedHospitalId),
    [hospitals, selectedHospitalId],
  );

  const selectedHospitalDoctors = selectedHospital
    ? DOCTORS_BY_HOSPITAL[selectedHospital.name] || []
    : [];
  const isClinic = selectedHospital?.type === "clinic";

  // If clinic is selected and activeTab was beds, switch to appointments
  useEffect(() => {
    if (isClinic && activeTab === "beds") {
      setActiveTab("appointments");
    }
  }, [isClinic, activeTab]);

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
      const scopedHospitals = hospitalId ? hospitalList.filter((hospital) => hospital.id === hospitalId) : hospitalList;
      setHospitals(scopedHospitals);
      setSelectedHospitalId(hospitalId || scopedHospitals[0]?.id || "");
      const patients = await getPatients();
      const selected = scopedHospitals[0];
      setPatientCount(selected ? patients.filter((patient) => patient.current_hospital === selected.name).length : 0);
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

  function logoutHospital() {
    localStorage.removeItem("medichain_hospital_token");
    localStorage.removeItem("medichain_hospital");
    localStorage.removeItem("medichain_staff");
    window.location.assign("/hospital-login");
  }

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <section className="page" style={{ margin: "0 auto", maxWidth: "1150px", width: "100%" }}>
        {/* Hospital Hero Banner */}
        <div className="hospital-hero">
          <div>
            <p className="eyebrow">MediChain · Facility Operations Portal</p>
            <h2>{selectedHospital?.name || "Hospital Operations Workspace"}</h2>
            <p>{selectedHospital?.city ? `${selectedHospital.city} · ` : ""}Live beds, patient appointments, pharmacy stock, and billing.</p>
          </div>
          <div className="hospital-hero__actions">
            {(() => {
              const stored = localStorage.getItem('medichain_staff');
              if (stored) {
                const staff = JSON.parse(stored);
                if (staff.role === 'super_admin') {
                  return <a href="/super-admin" className="secondary-button" style={{ marginRight: '0.75rem', textDecoration: 'none' }}>Super Admin Settings</a>;
                }
              }
              return null;
            })()}
            <span className="live-indicator"><i /> Live connected</span>
            <button className="logout-button" type="button" onClick={logoutHospital}>Log out</button>
          </div>
        </div>

        {/* Top Quick Stats for Hospitals */}
        {!loading && hospitals.length > 0 && !isClinic ? (
          <div className="stat-row" style={{ marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <p className="stat-label">Patients Admitted</p>
              <p className="stat-value">{patientCount}</p>
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

        {/* Facility Selector Toolbar */}
        <div className="toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          {!hospitalId && (
            <label className="field hospital-selector" style={{ minWidth: "300px" }}>
              <span style={{ fontWeight: 700, color: "#374151" }}>Operating Facility:</span>
              <select
                value={selectedHospitalId}
                disabled={loading || hospitals.length === 0}
                onChange={(event) => {
                  setSelectedHospitalId(event.target.value);
                  setSuccessMessage("");
                  setError("");
                }}
                style={{ padding: "0.65rem", borderRadius: "8px" }}
              >
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name} ({hospital.city}) {hospital.type === "clinic" ? "• Clinic" : "• Hospital"}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button className="secondary-button" type="button" disabled={loading} onClick={loadHospitals}>
            {loading ? "Loading..." : "🔄 Refresh Workspace"}
          </button>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {successMessage ? <div className="alert success">{successMessage}</div> : null}
        {loading ? <div className="empty-state">Loading facilities...</div> : null}

        {/* Clean Admin Navigation Tabs */}
        {selectedHospital && (
          <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {!isClinic && (
              <button
                type="button"
                onClick={() => setActiveTab("beds")}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px 8px 0 0",
                  border: "none",
                  background: activeTab === "beds" ? "#0f766e" : "transparent",
                  color: activeTab === "beds" ? "#ffffff" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                🛏️ Beds & Transfers
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("appointments")}
              style={{
                padding: "10px 18px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                background: activeTab === "appointments" ? "#0f766e" : "transparent",
                color: activeTab === "appointments" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              📅 Appointments & Visits
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pharmacy")}
              style={{
                padding: "10px 18px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                background: activeTab === "pharmacy" ? "#0f766e" : "transparent",
                color: activeTab === "pharmacy" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              💊 Pharmacy Inventory
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              style={{
                padding: "10px 18px",
                borderRadius: "8px 8px 0 0",
                border: "none",
                background: activeTab === "billing" ? "#0f766e" : "transparent",
                color: activeTab === "billing" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              🧾 Billing & Invoices
            </button>
          </div>
        )}

        {/* Tab 1: Beds & Transfers (Hospitals only) */}
        {selectedHospital && activeTab === "beds" && !isClinic && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="admin-grid">
              <section className="hospital-panel" aria-labelledby="selected-hospital-heading">
                <div>
                  <p className="eyebrow">Facility Info</p>
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

                <BedCategorySummary beds={selectedHospital.beds} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

                <div>
                  <p className="eyebrow" style={{ marginTop: "10px" }}>On-Duty Medical Roster</p>
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

              <PermissionGate requires="manage_beds">
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
              </PermissionGate>
            </div>

            <PermissionGate requires="manage_transfers">
              <TransferPanel hospitalName={selectedHospital?.name} />
            </PermissionGate>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {selectedHospital && activeTab === "appointments" && (
          <PermissionGate requires="view_patients">
            <AppointmentRequests />
          </PermissionGate>
        )}

        {/* Tab 3: Pharmacy */}
        {selectedHospital && activeTab === "pharmacy" && (
          <PermissionGate requires="manage_inventory">
            <InventoryManagement hospitalId={selectedHospital.id} />
          </PermissionGate>
        )}

        {/* Tab 4: Billing */}
        {selectedHospital && activeTab === "billing" && (
          <PermissionGate requires="manage_billing">
            <Billing />
          </PermissionGate>
        )}
      </section>
    </div>
  );
}
