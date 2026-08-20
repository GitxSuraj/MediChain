import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ALL_DAYS,
  createReminder,
  deleteReminder,
  getReminders,
  updateReminder,
  type Reminder,
  type ReminderDay,
  type ReminderInput,
} from '../services/reminders';
import { fireAlert } from '../hooks/useNotifications';
import Toast from '../components/Toast';
import './MedicineReminders.css';

const CHECK_INTERVAL_MS = 30_000;

const EMPTY_FORM: ReminderInput = {
  medicine_name: '',
  dosage: '',
  times: ['08:00'],
  days: [...ALL_DAYS],
  is_active: true,
};

function currentDayLabel(): ReminderDay {
  return ALL_DAYS[(new Date().getDay() + 6) % 7]; // JS: Sun=0 -> map to Mon-first ALL_DAYS
}

function currentTimeLabel(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function MedicineReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const firedThisMinuteRef = useRef<Set<string>>(new Set());

  function load() {
    if (!user) return;
    setLoading(true);
    getReminders(user.id)
      .then(setReminders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load reminders.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [user]);

  // Reminder checker — runs ~every 30s while the page is open.
  useEffect(() => {
    const interval = setInterval(() => {
      const day = currentDayLabel();
      const time = currentTimeLabel();
      const key = `${day}-${time}`;

      reminders.forEach((r) => {
        if (!r.is_active) return;
        if (!r.days.includes(day)) return;
        if (!r.times.includes(time)) return;

        const fireKey = `${r.id}-${key}`;
        if (firedThisMinuteRef.current.has(fireKey)) return;
        firedThisMinuteRef.current.add(fireKey);

        fireAlert('reminder', `Time to take: ${r.medicine_name} ${r.dosage}`);
      });
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [reminders]);

  const sorted = useMemo(
    () => [...reminders].sort((a, b) => a.medicine_name.localeCompare(b.medicine_name)),
    [reminders]
  );

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(r: Reminder) {
    setEditingId(r.id);
    setForm({ medicine_name: r.medicine_name, dosage: r.dosage, times: r.times, days: r.days, is_active: r.is_active });
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    try {
      await deleteReminder(user.id, id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      setToast({ message: 'Reminder deleted.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not delete reminder.', type: 'error' });
    }
  }

  async function handleToggleActive(r: Reminder) {
    if (!user) return;
    try {
      const updated = await updateReminder(user.id, r.id, { is_active: !r.is_active });
      setReminders((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not update reminder.', type: 'error' });
    }
  }

  function toggleDay(day: ReminderDay) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  }

  function updateTime(index: number, value: string) {
    setForm((prev) => ({ ...prev, times: prev.times.map((t, i) => (i === index ? value : t)) }));
  }

  function addTimeSlot() {
    setForm((prev) => ({ ...prev, times: [...prev.times, '08:00'] }));
  }

  function removeTimeSlot(index: number) {
    setForm((prev) => ({ ...prev, times: prev.times.filter((_, i) => i !== index) }));
  }

  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

  async function handleSave() {
    if (!user) return;
    if (!form.medicine_name.trim()) {
      setToast({ message: 'Medicine name is required.', type: 'error' });
      return;
    }
    if (!form.dosage.trim()) {
      setToast({ message: 'Dosage is required.', type: 'error' });
      return;
    }
    if (form.times.length === 0) {
      setToast({ message: 'At least one time is required.', type: 'error' });
      return;
    }
    const invalidTime = form.times.find((t) => !TIME_RE.test(t));
    if (invalidTime !== undefined) {
      setToast({ message: `"${invalidTime || '(blank)'}" is not a valid time. Use HH:MM format.`, type: 'error' });
      return;
    }
    if (form.days.length === 0) {
      setToast({ message: 'Select at least one day.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateReminder(user.id, editingId, form);
        setReminders((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        setToast({ message: 'Reminder updated.', type: 'success' });
      } else {
        const created = await createReminder(user.id, form);
        setReminders((prev) => [created, ...prev]);
        setToast({ message: 'Reminder created.', type: 'success' });
      }
      setFormOpen(false);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not save reminder.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="medicine-reminders">
      <div className="medicine-reminders__header">
        <div>
          <h2>Medicine Reminders</h2>
          <p className="text-secondary">Set reminders and we'll alert you while MediChain is open.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Reminder</button>
      </div>

      {loading && (
        <div className="medicine-reminders__skeletons">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="medicine-reminders__empty card-surface">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="medicine-reminders__empty card-surface">
          <p>No reminders yet. Add one to get started.</p>
        </div>
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="medicine-reminders__list">
          {sorted.map((r) => (
            <div key={r.id} className={`reminder-card card-surface ${r.is_active ? '' : 'reminder-card--inactive'}`}>
              <div className="reminder-card__main">
                <h4>{r.medicine_name}</h4>
                <p className="text-secondary">{r.dosage}</p>
                <div className="reminder-card__meta">
                  <span className="mono">{r.times.join(', ')}</span>
                  <span className="reminder-card__dot" />
                  <span>{r.days.length === 7 ? 'Every day' : r.days.join(', ')}</span>
                </div>
              </div>
              <div className="reminder-card__actions">
                <button className="reminder-card__toggle" onClick={() => handleToggleActive(r)}>
                  {r.is_active ? 'Active' : 'Paused'}
                </button>
                <button className="reminder-card__icon-btn" onClick={() => openEdit(r)} aria-label="Edit">✎</button>
                <button className="reminder-card__icon-btn reminder-card__icon-btn--danger" onClick={() => handleDelete(r.id)} aria-label="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="reminder-modal-scrim"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-modal-title"
          onClick={() => setFormOpen(false)}
        >
          <div className="reminder-modal card-surface fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 id="reminder-modal-title">{editingId ? 'Edit Reminder' : 'New Reminder'}</h3>

            <label className="reminder-field">
              <span>Medicine Name</span>
              <input
                value={form.medicine_name}
                onChange={(e) => setForm((p) => ({ ...p, medicine_name: e.target.value }))}
                placeholder="e.g. Paracetamol"
              />
            </label>

            <label className="reminder-field">
              <span>Dosage</span>
              <input
                value={form.dosage}
                onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                placeholder="e.g. 500mg"
              />
            </label>

            <div className="reminder-field">
              <span>Times</span>
              {form.times.map((t, i) => (
                <div key={i} className="reminder-time-row">
                  <input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} className="mono" />
                  {form.times.length > 1 && (
                    <button type="button" className="reminder-card__icon-btn" onClick={() => removeTimeSlot(i)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="reminder-add-time" onClick={addTimeSlot}>+ Add another time</button>
            </div>

            <div className="reminder-field">
              <span>Days</span>
              <div className="reminder-day-grid">
                {ALL_DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`reminder-day ${form.days.includes(d) ? 'reminder-day--selected' : ''}`}
                    onClick={() => toggleDay(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <label className="reminder-field reminder-field--row">
              <span>Active</span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
            </label>

            <div className="reminder-modal__actions">
              <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Save Reminder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
