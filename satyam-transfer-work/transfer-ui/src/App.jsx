import { useState, useEffect } from "react";

// Hardcoded list for now — matches what you added to MongoDB
const PATIENTS = [
  { id: "6a56948afb8f76cc3047d217", name: "Dinshaw Wacha" },
  { id: "6a569493fb8f76cc3047d219", name: "Mayank Kumar" },
  { id: "6a5694a1fb8f76cc3047d21b", name: "Raju Tiwari" },
  { id: "6a5694abfb8f76cc3047d21d", name: "Priya Sharma" },
];

function App() {
  const [patientId, setPatientId] = useState(PATIENTS[0].id);
  const [fromHospital, setFromHospital] = useState("");
  const [toHospital, setToHospital] = useState("");
  const [requiredFacility, setRequiredFacility] = useState("");
  const [transfers, setTransfers] = useState([]);
  const [patientRecords, setPatientRecords] = useState({});

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socket.onopen = () => {
      console.log("Connected to server!");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received:", message);

      if (message.event === "transfer_request") {
        setTransfers((prev) => [...prev, message.data]);
      }

      if (message.event === "transfer_response") {
        setTransfers((prev) =>
          prev.map((t) =>
            t._id === message.data.transfer_id
              ? { ...t, status: message.data.status }
              : t
          )
        );
      }
    };

    return () => socket.close();
  }, []);

  const handleSubmit = async () => {
    const selectedPatient = PATIENTS.find((p) => p.id === patientId);

    const response = await fetch("http://127.0.0.1:8000/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_name: selectedPatient.name,
        patient_id: patientId,
        from_hospital: fromHospital,
        to_hospital: toHospital,
        required_facility: requiredFacility,
      }),
    });
    const data = await response.json();
    console.log("Transfer created:", data);

    setFromHospital("");
    setToHospital("");
    setRequiredFacility("");
  };

  const respondToTransfer = async (transferId, status, patientId) => {
    await fetch(`http://127.0.0.1:8000/transfers/${transferId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    // if accepted, fetch the patient's record
    if (status === "accepted" && patientId) {
      const res = await fetch(`http://127.0.0.1:8000/patients/${patientId}`);
      const patientData = await res.json();
      setPatientRecords((prev) => ({ ...prev, [transferId]: patientData }));
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Create Transfer Request</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>Patient: </label>
        <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          {PATIENTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>From Hospital: </label>
        <input value={fromHospital} onChange={(e) => setFromHospital(e.target.value)} />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>To Hospital: </label>
        <input value={toHospital} onChange={(e) => setToHospital(e.target.value)} />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Required Facility: </label>
        <input value={requiredFacility} onChange={(e) => setRequiredFacility(e.target.value)} />
      </div>

      <button onClick={handleSubmit}>Send Transfer Request</button>

      <hr style={{ margin: "30px 0" }} />

      <h1>Incoming Transfers</h1>
      {transfers.length === 0 && <p>No transfers yet.</p>}

      {transfers.map((t) => (
        <div key={t._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
          <p><strong>Patient:</strong> {t.patient_name}</p>
          <p><strong>From:</strong> {t.from_hospital} → <strong>To:</strong> {t.to_hospital}</p>
          <p><strong>Required Facility:</strong> {t.required_facility}</p>
          <p><strong>Status:</strong> {t.status || "pending"}</p>

          {!t.status && (
            <>
              <button onClick={() => respondToTransfer(t._id, "accepted", t.patient_id)}>Accept</button>{" "}
              <button onClick={() => respondToTransfer(t._id, "declined", t.patient_id)}>Decline</button>
            </>
          )}

          {patientRecords[t._id] && (
            <div style={{ marginTop: "10px", padding: "10px", background: "#f0f0f0", color: "#000" }}>
              <h3>Patient Record</h3>
              <p><strong>Blood Type:</strong> {patientRecords[t._id].blood_type}</p>
              <p><strong>Allergies:</strong> {patientRecords[t._id].allergies.join(", ")}</p>
              <p><strong>History:</strong> {patientRecords[t._id].history.join(", ")}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;