import { useEffect, useMemo, useState } from "react";
import {
  getHospitals,
  getPatients,
  createTransfer,
  respondToTransfer,
  getPatient,
  getTransfers,
} from "../services/api.js";
import { createRealtimeSocket } from "../websocket/socket.js";

const FACILITY_OPTIONS = [
  "ICU",
  "Oxygen",
  "Emergency",
  "General",
  "Blood Bank",
  "Maternity",
  "Burn Unit",
  "MRI",
];

export default function TransferPanel({ hospitalName = "" }) {
  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [toHospital, setToHospital] = useState("");
  const [requiredFacility, setRequiredFacility] = useState(FACILITY_OPTIONS[0]);
  const [transfers, setTransfers] = useState([]);
  const [patientRecords, setPatientRecords] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedPatient = useMemo(
    () => patients.find((p) => p._id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  async function refreshPatients() {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      setError(err.message || "Unable to load patients.");
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [hospitalData, patientData, transferData] = await Promise.all([
          getHospitals(),
          getPatients(),
          getTransfers(hospitalName),
        ]);
        setHospitals(hospitalData);
        setPatients(patientData);
        setTransfers(transferData);
        const records = await Promise.all(transferData.map(async (transfer) => {
          try { return [transfer.transfer_id, await getPatient(transfer.patient_id)]; } catch { return null; }
        }));
        setPatientRecords(Object.fromEntries(records.filter(Boolean)));
        if (patientData[0]) setSelectedPatientId(patientData[0]._id);
      } catch (err) {
        setError(err.message || "Unable to load hospitals or patients.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hospitalName]);

  useEffect(() => {
    const socket = createRealtimeSocket({
      onMessage: (message) => {
        if (message.event === "transfer_request") {
          setTransfers((prev) => [message, ...prev]);
        }
        if (message.event === "transfer_response") {
          setTransfers((prev) =>
            prev.map((t) =>
              t.transfer_id === message.transfer_id ? { ...t, status: message.status } : t
            )
          );
          if (message.status === "accepted") {
            refreshPatients();
          }
        }
      },
    });
    return () => socket.close();
  }, []);

  const availableToHospitals = hospitals.filter(
    (h) => h.name !== selectedPatient?.current_hospital
  );

  async function handleSubmit() {
    setError("");
    if (!selectedPatient) {
      setError("Select a patient first.");
      return;
    }
    if (!toHospital) {
      setError("Choose a destination hospital.");
      return;
    }
    try {
      await createTransfer({
        patient_id: selectedPatient._id,
        patient_name: selectedPatient.name,
        from_hospital: selectedPatient.current_hospital || "Unassigned",
        to_hospital: toHospital,
        required_facility: requiredFacility,
      });
      setToHospital("");
    } catch (err) {
      setError(err.message || "Unable to create transfer.");
    }
  }

  async function handleRespond(transferId, status, patientId) {
    setError("");
    try {
      await respondToTransfer(transferId, status);
      setTransfers((current) => current.map((transfer) => transfer.transfer_id === transferId ? { ...transfer, status } : transfer));
      if (status === "accepted" && patientId) {
        const patient = await getPatient(patientId);
        setPatientRecords((prev) => ({ ...prev, [transferId]: patient }));
      }
    } catch (err) {
      setError(err.message || "Unable to update transfer.");
    }
  }

  return (
    <section className="page" style={{ marginTop: "28px" }}>
      <div className="page-header">
        <p className="eyebrow">Transfer desk</p>
        <h2>Incoming Transfer Requests</h2>
        <p>{hospitalName ? `Review and respond to requests sent to ${hospitalName}.` : 'Pick a patient, choose a destination hospital, and send a live transfer request.'}</p>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {loading ? (
        <div className="empty-state">Loading patients and hospitals…</div>
      ) : (
        <div className="admin-grid">
          {!hospitalName && <>{/* Patient selection */}
          <div className="hospital-panel">
            <h3>Select Patient</h3>
            <div className="patient-grid">
              {patients.map((p) => {
                const isSelected = p._id === selectedPatientId;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => setSelectedPatientId(p._id)}
                    className="patient-card"
                    style={{
                      textAlign: "left",
                      cursor: "pointer",
                      borderColor: isSelected ? "#16736c" : undefined,
                      boxShadow: isSelected ? "0 0 0 2px #16736c inset" : undefined,
                    }}
                  >
                    <div className="patient-card-header">
                      <div>
                        <h3>{p.name}</h3>
                        <p>Blood type: {p.blood_type || "—"}</p>
                      </div>
                    </div>
                    <div className="tag-row">
                      <span className="tag">📍 {p.current_hospital || "Unassigned"}</span>
                    </div>
                    {p.allergies?.length ? (
                      <div className="tag-row">
                        {p.allergies.map((a) => (
                          <span className="tag" key={a} style={{ background: "#fdeeee", color: "#9f1f1f" }}>
                            ⚠ {a}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transfer request form */}
          <div className="controller-panel">
            <h3>New Transfer Request</h3>

            {selectedPatient ? (
              <>
                <div className="field">
                  <span>Currently Admitted At</span>
                  <div className="tag" style={{ width: "fit-content" }}>
                    {selectedPatient.current_hospital || "Unassigned"}
                  </div>
                </div>

                <label className="field">
                  <span>Transfer To</span>
                  <select value={toHospital} onChange={(e) => setToHospital(e.target.value)}>
                    <option value="">Select destination hospital…</option>
                    {availableToHospitals.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name} — {h.city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Required Facility</span>
                  <select value={requiredFacility} onChange={(e) => setRequiredFacility(e.target.value)}>
                    {FACILITY_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </label>

                <button className="secondary-button" type="button" onClick={handleSubmit}>
                  Send Transfer Request
                </button>
              </>
            ) : (
              <p>Select a patient to begin.</p>
            )}
          </div>
          </>}
        </div>
      )}

      <h3 style={{ marginTop: "28px" }}>Live Transfer Activity</h3>
      {transfers.length === 0 ? (
        <div className="empty-state">No transfers yet — create one above.</div>
      ) : (
        <div className="patient-grid">
          {transfers.map((t) => (
            <div className="patient-card" key={t.transfer_id}>
              <div className="patient-card-header">
                <div>
                  <h3>{t.patient_name}</h3>
                  <p>{t.from_hospital} → {t.to_hospital}</p>
                </div>
                <span
                  className="tag"
                  style={{
                    background:
                      t.status === "accepted" ? "#edf9f1" : t.status === "declined" ? "#fff1f1" : "#e8f7f5",
                    color:
                      t.status === "accepted" ? "#166534" : t.status === "declined" ? "#9f1f1f" : "#16736c",
                  }}
                >
                  {t.status || "pending"}
                </span>
              </div>

              <div className="tag-row">
                <span className="tag">Needs: {t.required_facility}</span>
              </div>

              {(t.status === "pending" || !t.status) && (
                <div className="button-row">
                  <button className="secondary-button" onClick={() => handleRespond(t.transfer_id, "accepted", t.patient_id)}>
                    Accept
                  </button>
                  <button className="secondary-button" onClick={() => handleRespond(t.transfer_id, "declined", t.patient_id)}>
                    Decline
                  </button>
                </div>
              )}

              {patientRecords[t.transfer_id] && (
                <div className="patient-bed-grid">
                  <div className="patient-bed-row">
                    <span>Blood Type</span>
                    <strong>{patientRecords[t.transfer_id].bloodGroup || patientRecords[t.transfer_id].blood_type || "Not recorded"}</strong>
                  </div>
                  <div className="patient-bed-row">
                    <span>Allergies</span>
                    <strong>{patientRecords[t.transfer_id].allergies?.join(", ") || "None"}</strong>
                  </div>
                  <div className="patient-bed-row">
                    <span>History</span>
                    <strong>{patientRecords[t.transfer_id].medicalConditions?.join(", ") || patientRecords[t.transfer_id].history?.join(", ") || "None"}</strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
