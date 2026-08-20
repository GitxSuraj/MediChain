import './StatusBadge.css';

type Status = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{status}</span>;
}