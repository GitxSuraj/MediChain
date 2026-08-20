import { useRealtimeStatus } from "../hooks/useRealtimeStatus.js";

export default function RealtimeStatus() {
  const status = useRealtimeStatus();

  return (
    <div className={`status-line ${status}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>Realtime {status}</span>
    </div>
  );
}
