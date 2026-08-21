import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CalendarPlus,
  CalendarCheck,
  FileText,
  Building2,
  MapPin,
  Bell,
  ShoppingBag,
  ShoppingCart,
  ArrowLeftRight,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpg';
import './Sidebar.css';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',          icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/profile',            icon: <User size={18} />,            label: 'My Profile' },
  { to: '/book-appointment',   icon: <CalendarPlus size={18} />,    label: 'Book Appointment' },
  { to: '/appointment-status', icon: <CalendarCheck size={18} />,   label: 'Appointment Status' },
  { to: '/medical-history',    icon: <FileText size={18} />,        label: 'Medical History' },
  { to: '/hospitals',          icon: <Building2 size={18} />,       label: 'Hospital Directory' },
  { to: '/hospital-map',       icon: <MapPin size={18} />,          label: 'Find on Map' },
  { to: '/medicine-reminders', icon: <Bell size={18} />,            label: 'Medicine Reminders' },
  { to: '/medicine-store',     icon: <ShoppingBag size={18} />,     label: 'Medicine Store' },
  { to: '/my-orders',          icon: <ShoppingCart size={18} />,    label: 'My Orders' },
  { to: '/transfer',           icon: <ArrowLeftRight size={18} />,  label: 'Request Transfer' },
];

interface SidebarProps {
  /** Controlled open state for mobile — passed from layout */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Collapse automatically on smaller desktops
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setCollapsed(true);
    };
    if (mq.matches) setCollapsed(true);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.name ?? 'P')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
             role="navigation" aria-label="Patient navigation">

        {/* Brand */}
        <div className="sidebar__brand">
          <img src={logoImg} alt="MediChain" className="sidebar__logo" />
          <div className="sidebar__brand-text">
            <div className="sidebar__brand-name">MediChain</div>
            <div className="sidebar__brand-sub">Patient Portal</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar__item${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={onMobileClose}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="sidebar__divider" />

        {/* Footer */}
        <div className="sidebar__footer">
          {user && (
            <div className="sidebar__user" title={collapsed ? user.name : undefined}>
              <div className="sidebar__avatar">{initials}</div>
              <div className="sidebar__user-info">
                <div className="sidebar__user-name">{user.name}</div>
                <div className="sidebar__user-role">Patient</div>
              </div>
            </div>
          )}

          <button className="sidebar__logout" onClick={handleLogout}
                  title={collapsed ? 'Log Out' : undefined}>
            <span className="sidebar__icon"><LogOut size={18} /></span>
            <span className="sidebar__label">Log Out</span>
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>
    </>
  );
}

/** Mobile menu button — used in the header */
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="btn btn-ghost"
      onClick={onClick}
      aria-label="Open menu"
      style={{ padding: '8px', borderRadius: '8px' }}
    >
      <Menu size={20} />
    </button>
  );
}
