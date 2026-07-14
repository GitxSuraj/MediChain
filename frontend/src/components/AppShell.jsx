import BackendStatus from "./BackendStatus.jsx";
import RealtimeStatus from "./RealtimeStatus.jsx";

const navItems = [
  { path: "/admin", label: "Admin Dashboard" },
  { path: "/patient", label: "Patient Dashboard" },
];

export default function AppShell({ children, currentPath, onNavigate }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">MediChain</p>
          <h1>Hospital Network</h1>
        </div>

        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={currentPath === item.path ? "nav-item active" : "nav-item"}
              type="button"
              onClick={() => onNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="status-stack">
          <BackendStatus />
          <RealtimeStatus />
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
