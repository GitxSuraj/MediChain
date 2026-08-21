import { useEffect, useState } from 'react';
import { ArrowLeftRight, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createTransfer, getHospitals, getTransfers } from '../services/api.js';

export default function PatientTransfer() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [destination, setDestination] = useState('');
  const [facility, setFacility] = useState('ICU');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHospitals()
      .then(setHospitals)
      .catch((e) => setMessage({ text: e.message, type: 'error' }));
  }, []);

  useEffect(() => {
    if (user) {
      getTransfers()
        .then((all) => setTransfers(all.filter((t: any) => t.patient_id === user.id)))
        .catch(() => {});
    }
  }, [user]);

  async function submit() {
    if (!user || !destination) {
      return setMessage({ text: 'Please select a destination hospital.', type: 'error' });
    }
    setSubmitting(true);
    try {
      await createTransfer({
        patient_id: user.id,
        patient_name: user.name,
        from_hospital: 'Unassigned',
        to_hospital: destination,
        required_facility: facility,
      });
      setMessage({
        text: 'Transfer request sent successfully. The destination hospital will review it.',
        type: 'success',
      });
      const all = await getTransfers();
      setTransfers(all.filter((t: any) => t.patient_id === user.id));
      setDestination('');
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : 'Could not send transfer request.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return 'badge-success';
      case 'declined':
      case 'rejected':
        return 'badge-danger';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Form card */}
      <div className="card" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Request a Hospital Transfer</h2>
            <p className="text-secondary" style={{ fontSize: '0.875rem', margin: '2px 0 0' }}>
              Choose a hospital and required care level. The receiving hospital will review your request.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={message.type === 'success' ? 'badge-success' : 'badge-danger'}
            style={{
              padding: '12px 16px', borderRadius: 8, marginTop: 16, marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', width: '100%'
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <div className="form-group">
            <label className="form-label">Destination Hospital *</label>
            <select
              className="input-text input-select"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Select a destination hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name} — ICU Available: {h.beds?.icu?.available ?? 0}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Required Care Level *</label>
            <select
              className="input-text input-select"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
            >
              {['ICU', 'Oxygen', 'Emergency', 'General'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 8 }}>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={submitting || !destination}
            >
              {submitting ? <span className="spinner" /> : 'Send Transfer Request'}
            </button>
          </div>
        </div>
      </div>

      {/* History card */}
      <div className="card" style={{ padding: '24px 32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px' }}>My Transfer Requests</h3>

        {transfers.length === 0 ? (
          <p className="text-secondary" style={{ fontSize: '0.875rem', margin: 0 }}>
            No transfer requests submitted yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transfers.map((t) => (
              <div
                key={t.transfer_id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building2 size={18} style={{ color: 'var(--color-text-muted)' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{t.to_hospital}</strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      Required care: {t.required_facility}
                    </div>
                  </div>
                </div>
                <span className={`badge ${getStatusBadge(t.status)}`} style={{ textTransform: 'capitalize' }}>
                  {t.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
