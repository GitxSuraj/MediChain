/**
 * MedicationReminders — Dashboard widget that shows today's reminders from the backend.
 * Fetches the same data as the MedicineReminders page so both are in sync.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getReminders, type Reminder } from '../services/reminders';
import { useAuth } from '../context/AuthContext';
import './MedicationReminders.css';

function todayLabel(): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
}

function currentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function MedicationReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getReminders(user.id)
      .then((data) => {
        // Only show active reminders scheduled for today
        const today = todayLabel();
        const todayReminders = data.filter(
          (r) => r.is_active && (r.days.includes(today as any) || r.days.includes('daily' as any))
        );
        setReminders(todayReminders);
      })
      .catch(() => setReminders([]))
      .finally(() => setLoading(false));
  }, [user]);

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const now = currentHHMM();
  const remaining = reminders.filter((r) => !done.has(r.id)).length;

  if (loading) {
    return (
      <div className="med-reminders card-surface">
        <div className="med-reminders__header">
          <h4>Today's Medication</h4>
        </div>
        <div style={{ padding: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="med-reminders card-surface">
      <div className="med-reminders__header">
        <h4>Today's Medication</h4>
        <span className="med-reminders__count mono">{remaining} left</span>
      </div>

      {reminders.length === 0 ? (
        <div style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          No reminders for today.{' '}
          <Link to="/medicine-reminders" style={{ color: 'var(--color-teal-600)' }}>
            Add one →
          </Link>
        </div>
      ) : (
        <div className="med-reminders__list">
          {reminders
            .flatMap((r) =>
              r.times.map((t) => ({ ...r, _key: `${r.id}-${t}`, time: t }))
            )
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((item) => {
              const isDone = done.has(item.id);
              const isPast = item.time <= now;
              return (
                <button
                  key={item._key}
                  className={`med-reminders__item ${isDone ? 'med-reminders__item--done' : ''}`}
                  onClick={() => toggle(item.id)}
                >
                  <span className="med-reminders__checkbox">
                    {isDone && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="med-reminders__text">
                    <span className="med-reminders__name">
                      {item.medicine_name}
                      {item.dosage ? ` · ${item.dosage}` : ''}
                    </span>
                    <span className="med-reminders__time mono" style={{ color: isPast && !isDone ? 'var(--color-coral-600)' : undefined }}>
                      {item.time}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>
      )}

      <Link
        to="/medicine-reminders"
        style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--color-teal-600)', textDecoration: 'none' }}
      >
        Manage all reminders →
      </Link>
    </div>
  );
}