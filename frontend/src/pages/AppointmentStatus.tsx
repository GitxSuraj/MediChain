import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAppointments,
  cancelAppointment,
  type Appointment,
  type AppointmentStatus as StatusType,
} from '../services/appointment';
import TimelineItem from '../components/TimelineItem';
import FilterTabs from '../components/FilterTabs';
import Toast from '../components/Toast';
import './AppointmentStatus.css';

type FilterValue = 'All' | StatusType;

export default function AppointmentStatus() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) return;
    getAppointments(user.id).then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, [user]);

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = { All: appointments.length, Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    appointments.forEach((a) => { base[a.status] += 1; });
    return base;
  }, [appointments]);

  const filtered = useMemo(
    () => (filter === 'All' ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter]
  );

  async function handleCancel(id: string) {
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
    <div className="appointment-status">
      <div className="appointment-status__header">
        <FilterTabs
          options={[
            { label: 'All', value: 'All', count: counts.All },
            { label: 'Pending', value: 'Pending', count: counts.Pending },
            { label: 'Confirmed', value: 'Confirmed', count: counts.Confirmed },
            { label: 'Completed', value: 'Completed', count: counts.Completed },
            { label: 'Cancelled', value: 'Cancelled', count: counts.Cancelled },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {loading ? (
        <div className="appointment-status__skeletons">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="appointment-status__empty card-surface">
          <p>No {filter !== 'All' ? filter.toLowerCase() : ''} appointments to show.</p>
          <a href="/book-appointment" className="btn btn-primary">Book an Appointment</a>
        </div>
      ) : (
        <div className="appointment-status__timeline">
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