import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createTransfer, getHospitals, getTransfers } from '../services/api.js';

export default function PatientTransfer() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [destination, setDestination] = useState('');
  const [facility, setFacility] = useState('ICU');
  const [message, setMessage] = useState('');

  useEffect(() => { getHospitals().then(setHospitals).catch((e) => setMessage(e.message)); }, []);
  useEffect(() => { if (user) getTransfers().then((all) => setTransfers(all.filter((t: any) => t.patient_id === user.id))).catch(() => {}); }, [user]);
  async function submit() {
    if (!user || !destination) return setMessage('Please select a destination hospital.');
    try {
      await createTransfer({ patient_id: user.id, patient_name: user.name, from_hospital: 'Unassigned', to_hospital: destination, required_facility: facility });
      setMessage('Transfer request sent. The destination hospital can now accept or decline it.');
      setTransfers(await getTransfers().then((all) => all.filter((t: any) => t.patient_id === user.id)));
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not send transfer request.'); }
  }
  return <div className="card-surface" style={{ maxWidth: 720, padding: 28 }}>
    <h2>Request a hospital transfer</h2><p className="text-secondary">Choose a hospital and required care. Your request is stored online and visible in that hospital’s operations portal.</p>
    <div className="book-field"><label className="book-field__label">Destination hospital</label><select className="book-field__select" value={destination} onChange={e => setDestination(e.target.value)}><option value="">Select a hospital</option>{hospitals.map(h => <option key={h.id} value={h.name}>{h.name} — ICU available: {h.beds?.icu?.available ?? 0}</option>)}</select></div>
    <div className="book-field"><label className="book-field__label">Required care</label><select className="book-field__select" value={facility} onChange={e => setFacility(e.target.value)}>{['ICU', 'Oxygen', 'Emergency', 'General'].map(v => <option key={v}>{v}</option>)}</select></div>
    <button className="btn btn-primary" onClick={submit}>Send transfer request</button>
    {message && <p style={{ marginTop: 16 }}>{message}</p>}
    <h3 style={{ marginTop: 28 }}>My transfer requests</h3>
    {transfers.length ? transfers.map(t => <div key={t.transfer_id} className="book-summary" style={{ marginTop: 10 }}><strong>{t.to_hospital}</strong><span>{t.required_facility} · {t.status}</span></div>) : <p className="text-secondary">No transfer requests yet.</p>}
  </div>;
}
