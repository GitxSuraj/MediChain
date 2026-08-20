import { useState } from "react";
import { addVisitRecord } from "../services/api.js";

export default function AddVisitRecord({ appointment, hospitalName, onSaved }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), diagnosis: "", prescription: "", doctor_name: appointment?.doctorName || "", notes: "" });
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  if (!appointment || appointment.status !== "Completed") return null;
  const submit = async event => { event.preventDefault(); setSaving(true); setError(""); try { await addVisitRecord(appointment.patient_id, { ...form, hospital_name: hospitalName }); onSaved?.(); setForm({ ...form, diagnosis: "", prescription: "", notes: "" }); } catch (e) { setError(e.message); } finally { setSaving(false); } };
  return <form className="hospital-panel" onSubmit={submit}><h3>Add visit record</h3>{error && <div className="alert error">{error}</div>}{[["date", "Date", "date"], ["diagnosis", "Diagnosis", "text"], ["prescription", "Prescription", "text"], ["doctor_name", "Doctor Name", "text"], ["notes", "Notes", "text"]].map(([key, label, type]) => <label className="field" key={key}><span>{label}</span><input required={key === "date" || key === "diagnosis" || key === "doctor_name"} type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}<button className="secondary-button" disabled={saving}>{saving ? "Saving…" : "Save visit record"}</button></form>;
}
