import { useEffect, useState } from "react";
import { decideHospitalAppointment, getHospitalAppointmentRequests } from "../services/api.js";
import AddVisitRecord from "./AddVisitRecord.jsx";

export default function AppointmentRequests() {
  const [requests, setRequests] = useState([]); const [error, setError] = useState("");
  const load = () => getHospitalAppointmentRequests().then(setRequests).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const decide = async (id, status) => { try { await decideHospitalAppointment(id, status); load(); } catch (e) { setError(e.message || "Could not process appointment."); } };
  const hospitalName = JSON.parse(localStorage.getItem("medichain_hospital") || "{}").name || "";
  return <section className="page" style={{ marginTop: 28 }}><div className="page-header"><p className="eyebrow">Appointments</p><h2>Appointment Requests</h2><p>Review, complete, and document bookings made for your hospital.</p></div>{error && <div className="alert error">{error}</div>}{requests.length === 0 ? <div className="empty-state">No appointment requests yet.</div> : <div className="patient-grid">{requests.map((request) => <div className="patient-card" key={request.id}><div className="patient-card-header"><div><h3>{request.doctorName}</h3><p>{request.doctorSpecialty} · {request.date} at {request.time}</p></div><span className="tag">{request.status}</span></div><p><strong>Symptoms:</strong> {request.symptoms}</p>{request.status === "Pending" && <div className="button-row"><button className="secondary-button" onClick={() => decide(request.id, "Confirmed")}>Accept</button><button className="secondary-button" onClick={() => decide(request.id, "Cancelled")}>Decline</button></div>}{request.status === "Confirmed" && <button className="secondary-button" onClick={() => decide(request.id, "Completed")}>Mark completed</button>}{request.status === "Completed" && <AddVisitRecord appointment={request} hospitalName={hospitalName} onSaved={load} />}</div>)}</div>}</section>;
}
