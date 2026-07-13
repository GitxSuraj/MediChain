import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import './Sidebar.css';

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  book: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  status: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12a8 8 0 1 0 3-6.3" /><path d="M4 4v5h5" /><path d="M12 8v4l3 2" />
    </svg>
  ),
  hospital: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /><path d="M12 8v4M10 10h4" />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: ICONS.dashboard },
  { label: 'My Profile', path: '/profile', icon: ICONS.profile },
  { label: 'Book Appointment', path: '/book-appointment', icon: ICONS.book },
  { label: 'Appointment Status', path: '/appointment-status', icon: ICONS.status },
  { label: 'Medical History', path: '/medical-history', icon: ICONS.history },
  { label: 'Hospital Directory', path: '/hospitals', icon: ICONS.hospital },
];

interface SidebarProps {
  onLogout: () => void;
}

export default function Sidebar({ onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">M</div>
          {!collapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">MediChain</span>
              <span className="sidebar__brand-tag mono">PATIENT PORTAL</span>
            </div>
          )}
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
              <span className="sidebar__link-indicator" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link sidebar__logout" onClick={onLogout} title={collapsed ? 'Log Out' : undefined}>
            <span className="sidebar__link-icon">{ICONS.logout}</span>
            {!collapsed && <span className="sidebar__link-label">Log Out</span>}
          </button>
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Collapse sidebar"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-base)' }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}