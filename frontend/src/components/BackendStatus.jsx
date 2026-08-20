import { useBackendHealth } from "../hooks/useBackendHealth.js";

export default function BackendStatus() {
  const { status, message } = useBackendHealth();

  return (
    <div className={`status-line ${status}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
