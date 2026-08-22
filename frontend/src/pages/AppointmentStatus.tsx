import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAppointments,
  cancelAppointment,
  type Appointment,
  type AppointmentStatus as StatusType,
} from '../services/appointment';
import TimelineItem from '../components/TimelineItem';
import Toast from '../components/Toast';
import './AppointmentStatus.css';

type FilterValue = 'All' | StatusType;

const TAB_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: 'All',       value: 'All'       },
  { label: 'Pending',   value: 'Pending'   },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export default function AppointmentStatus() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getAppointments(user.id)
      .then((data) => {
        setAppointments(data || []);
      })
      .catch((err) => {
        setToast({ message: err instanceof Error ? err.message : 'Could not load appointments.', type: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = { All: appointments.length, Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    appointments.forEach((a) => {
      if (base[a.status] !== undefined) {
        base[a.status] += 1;
      }
    });
    return base;
  }, [appointments]);

  const filtered = useMemo(
    () => (filter === 'All' ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter]
  );

  async function handleCancel(id: string) {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      const updated = await cancelAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setToast({ message: 'Appointment cancelled.', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Could not cancel appointment.', type: 'error' });
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="appt-status">
      {/* Filter tabs — bottom-border indicator style */}
      <div className="appt-status__tabs">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            className={`appt-status__tab${filter === tab.value ? ' appt-status__tab--active' : ''}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            <span className="appt-status__tab-count">{counts[tab.value]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="appt-status__skeletons">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="appt-status__empty card-surface">
          <p>No {filter !== 'All' ? filter.toLowerCase() : ''} appointments to show.</p>
          <Link to="/book-appointment" className="btn btn-primary">Book an Appointment</Link>
        </div>
      ) : (
        <div className="appt-status__list">
          {filtered.map((appt, index) => (
            <TimelineItem
              key={appt.id}
              appointment={appt}
              isLast={index === filtered.length - 1}
              onCancel={handleCancel}
              cancelling={cancellingId === appt.id}
            />
          ))}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}