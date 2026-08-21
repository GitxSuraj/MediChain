import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

interface NavbarProps {
  title?: string;
  sidebarCollapsed?: boolean;
  onMobileMenuClick?: () => void;
}

interface Notification {
  id: number;
  icon: string;
  message: string;
  time: Date;
  read: boolean;
}

export default function Navbar({ title = 'Dashboard', sidebarCollapsed = false, onMobileMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef     = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current     && !bellRef.current.contains(e.target as Node))     setBellOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subscribe to WebSocket appointment events for live notifications
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsUrl = API_BASE.replace(/^http/, 'ws') + '/realtime/ws';
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === 'appointment_update' || data.type === 'notification') {
              const msg =
                data.type === 'appointment_update'
                  ? `Appointment ${data.status ?? 'updated'} — ${data.message ?? ''}`
                  : data.message ?? 'New notification';
              setNotifications((prev) => [
                { id: Date.now(), icon: '📅', message: msg, time: new Date(), read: false },
                ...prev.slice(0, 19),
              ]);
            }
          } catch { /* ignore parse errors */ }
        };
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch { /* WS not available */ }
    }
    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  const initials = (user?.name ?? 'P')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className={`navbar ${sidebarCollapsed ? 'navbar--collapsed' : ''}`}>
      <div className="navbar__left">
        <h1 className="navbar__title">{title}</h1>
      </div>

      <div className="navbar__right">
        {/* Notification Bell */}
        <div className="navbar__bell-wrap" ref={bellRef}>
          <button
            className="navbar__icon-btn"
            aria-label="Notifications"
            onClick={() => { setBellOpen(v => !v); if (!bellOpen) markAllRead(); }}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="navbar__badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {bellOpen && (
            <div className="navbar__bell-dropdown">
              <div className="navbar__bell-header">
                <span className="navbar__bell-title">Notifications</span>
                {notifications.length > 0 && (
                  <button className="navbar__bell-mark" onClick={markAllRead}>Mark all read</button>
                )}
              </div>
              <div className="navbar__notif-list">
                {notifications.length === 0 ? (
                  <div className="navbar__notif-empty">No notifications yet</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`navbar__notif-item${!n.read ? ' navbar__notif-item--unread' : ''}`}>
                      <div className="navbar__notif-icon">{n.icon}</div>
                      <div className="navbar__notif-content">
                        <div className="navbar__notif-msg">{n.message}</div>
                        <div className="navbar__notif-time">{timeAgo(n.time)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="navbar__user-wrap" ref={dropdownRef}>
          <button
            className="navbar__user-btn"
            onClick={() => setDropdownOpen(v => !v)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <div className="navbar__avatar">{initials}</div>
            <span className="navbar__user-name">{user?.name ?? 'Patient'}</span>
            <ChevronDown size={14} className={`navbar__chevron${dropdownOpen ? ' navbar__chevron--open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="navbar__user-dropdown">
              <Link to="/profile" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                <User size={15} /> My Profile
              </Link>
              <div className="navbar__dropdown-divider" />
              <button
                className="navbar__dropdown-item navbar__dropdown-item--danger"
                onClick={() => { setDropdownOpen(false); logout(); }}
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}