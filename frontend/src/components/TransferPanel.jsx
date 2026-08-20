import { useEffect, useState } from "react";
import { createTransfer, respondToTransfer, getPatient } from "../services/api.js";
import { createRealtimeSocket } from "../websocket/socket.js";

// Seeded demo patients — replace ids with your real MongoDB _id values
const PATIENTS = [
  { id: "6a56948afb8f76cc3047d217", name: "Dinshaw Wacha" },
  { id: "6a569493fb8f76cc3047d219", name: "Mayank Kumar" },
  { id: "6a5694a1fb8f76cc3047d21b", name: "Raju Tiwari" },
  { id: "6a5694abfb8f76cc3047d21d", name: "Priya Sharma" },
];

export default function TransferPanel() {
  const [patientId, setPatientId] = useState(PATIENTS[0].id);
  const [fromHospital, setFromHospital] = useState("");
  const [toHospital, setToHospital] = useState("");
  const [requiredFacility, setRequiredFacility] = useState("");
  const [transfers, setTransfers] = useState([]);
  const [patientRecords, setPatientRecords] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = createRealtimeSocket({
      onMessage: (message) => {
        if (message.event === "transfer_request") {
          setTransfers((prev) => [...prev, message]);
        }
        if (message.event === "transfer_response") {
          setTransfers((prev) =>
            prev.map((t) =>
              t.transfer_id === message.transfer_id ? { ...t, status: message.status } : t
            )
          );
        }
      },
    });
    return () => socket.close();
  }, []);

  async function handleSubmit() {
    setError("");
    const selectedPatient = PATIENTS.find((p) => p.id === patientId);
    try {
      await createTransfer({
        patient_id: patientId,
        patient_name: selectedPatient.name,
        from_hospital: fromHospital,
        to_hospital: toHospital,
        required_facility: requiredFacility,
      });
      setFromHospital("");
      setToHospital("");
      setRequiredFacility("");
    } catch (err) {
      setError(err.message || "Unable to create transfer.");
    }
  }

  async function handleRespond(transferId, status, pId) {
    setError("");
    try {
      await respondToTransfer(transferId, status);
      if (status === "accepted" && pId) {
        const patient = await getPatient(pId);
        setPatientRecords((prev) => ({ ...prev, [transferId]: patient }));
      }
    } catch (err) {
      setError(err.message || "Unable to update transfer.");
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Admin</p>
        <h2>Emergency Transfers</h2>
        <p>Request a patient transfer to another hospital, or respond to incoming requests.</p>
      </div>

      <div className="toolbar">
        <label className="field">
          <span>Patient</span>
          <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From Hospital</span>
          <input value={fromHospital} onChange={(e) => setFromHospital(e.target.value)} />
        </label>
        <label className="field">
          <span>To Hospital</span>
          <input value={toHospital} onChange={(e) => setToHospital(e.target.value)} />
        </label>
        <label className="field">
          <span>Required Facility</span>
          <input value={requiredFacility} onChange={(e) => setRequiredFacility(e.target.value)} />
        </label>
        <button className="secondary-button" type="button" onClick={handleSubmit}>
          Send Transfer Request
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      {transfers.length === 0 ? (
        <div className="empty-state">No transfers yet.</div>
      ) : (
        transfers.map((t) => (
          <div className="hospital-panel" key={t.transfer_id} style={{ marginTop: "12px" }}>
            <p><strong>Patient:</strong> {t.patient_name}</p>
            <p><strong>From:</strong> {t.from_hospital} → <strong>To:</strong> {t.to_hospital}</p>
            <p><strong>Required Facility:</strong> {t.required_facility}</p>
            <p><strong>Status:</strong> {t.status || "pending"}</p>

            {!t.status && (
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
              <div className="tag-row" style={{ marginTop: "8px" }}>
                <span className="tag">Blood: {patientRecords[t.transfer_id].blood_type}</span>
                <span className="tag">Allergies: {patientRecords[t.transfer_id].allergies?.join(", ")}</span>
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
}
