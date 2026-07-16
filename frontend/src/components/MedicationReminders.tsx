import { useState } from 'react';
import './MedicationReminders.css';

interface Reminder {
  id: string;
  medicine: string;
  time: string;
  done: boolean;
}

const INITIAL_REMINDERS: Reminder[] = [
  { id: 'r1', medicine: 'Cetirizine 10mg', time: '9:00 PM', done: false },
  { id: 'r2', medicine: 'Multivitamin', time: '8:00 AM', done: true },
  { id: 'r3', medicine: 'Fluticasone Nasal Spray', time: '9:30 PM', done: false },
];

export default function MedicationReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);

  function toggle(id: string) {
    setReminders((prev) =>
      [...prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))].sort(
        (a, b) => Number(a.done) - Number(b.done)
      )
    );
  }

  const remaining = reminders.filter((r) => !r.done).length;

  return (
    <div className="med-reminders card-surface">
      <div className="med-reminders__header">
        <h4>Today's Medication</h4>
        <span className="med-reminders__count mono">{remaining} left</span>
      </div>

      <div className="med-reminders__list">
        {reminders.map((r) => (
          <button
            key={r.id}
            className={`med-reminders__item ${r.done ? 'med-reminders__item--done' : ''}`}
            onClick={() => toggle(r.id)}
          >
            <span className="med-reminders__checkbox">
              {r.done && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            <span className="med-reminders__text">
              <span className="med-reminders__name">{r.medicine}</span>
              <span className="med-reminders__time mono">{r.time}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}