import { useEffect, useState } from "react";
import { decideHospitalAppointment, getHospitalAppointmentRequests } from "../services/api.js";

export default function AppointmentRequests() {
  const [requests, setRequests] = useState([]); const [error, setError] = useState("");
  const load = () => getHospitalAppointmentRequests().then(setRequests).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  async function decide(id, status) { try { await decideHospitalAppointment(id, status); load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not process appointment.'); } }
  return <section className="page" style={{ marginTop: 28 }}><div className="page-header"><p className="eyebrow">Appointments</p><h2>Appointment Requests</h2><p>Review and respond to bookings made for your hospital.</p></div>{error && <div className="alert error">{error}</div>}{requests.length === 0 ? <div className="empty-state">No appointment requests yet.</div> : <div className="patient-grid">{requests.map(request => <div className="patient-card" key={request.id}><div className="patient-card-header"><div><h3>{request.doctorName}</h3><p>{request.doctorSpecialty} · {request.date} at {request.time}</p></div><span className="tag">{request.status}</span></div><p><strong>Symptoms:</strong> {request.symptoms}</p>{request.status === 'Pending' && <div className="button-row"><button className="secondary-button" onClick={() => decide(request.id, 'Confirmed')}>Accept</button><button className="secondary-button" onClick={() => decide(request.id, 'Cancelled')}>Decline</button></div>}</div>)}</div>}</section>;
}
