import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

interface NavbarProps {
  title?: string;
}

interface Notification {
  id: number;
  icon: string;
  message: string;
  time: Date;
  read: boolean;
}

export default function Navbar({ title = 'Dashboard' }: NavbarProps) {
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
    let retries = 0;
    const MAX_RETRIES = 5;

    function connect() {
      if (retries >= MAX_RETRIES) return; // stop after 5 attempts
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => { retries = 0; }; // reset on success
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.event === 'appointment_confirmed') {
              addNotification('🏥', `Appointment confirmed at ${msg.hospital_name || 'your hospital'}`);
            } else if (msg.event === 'transfer_accepted') {
              addNotification('🔁', `Transfer request accepted`);
            } else if (msg.event === 'transfer_declined') {
              addNotification('🔁', `Transfer request declined`);
            }
          } catch { /* ignore non-JSON */ }
        };
        ws.onerror = () => {};
        ws.onclose = () => {
          retries++;
          if (retries < MAX_RETRIES) {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** (retries - 1), 16000));
          }
        };
      } catch { /* WebSocket not available */ }
    }

    connect();
    return () => {
      retries = MAX_RETRIES; // prevent reconnect on unmount
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  function addNotification(icon: string, message: string) {
    setNotifications(prev => [
      { id: Date.now(), icon, message, time: new Date(), read: false },
      ...prev.slice(0, 19), // keep last 20
    ]);
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const unread = notifications.filter(n => !n.read).length;

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return (
    <header className="navbar">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="navbar__badge">{unread > 9 ? '9+' : unread}</span>
            )}
          </button>

          {bellOpen && (
            <div className="navbar__bell-dropdown fade-in-up">
              <div className="navbar__bell-header">
                <span className="navbar__bell-title">Notifications</span>
                {notifications.length > 0 && (
                  <button className="navbar__bell-clear" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="navbar__bell-empty">No notifications yet</div>
              ) : (
                <div className="navbar__bell-list">
                  {notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`navbar__bell-item${n.read ? '' : ' navbar__bell-item--unread'}`}>
                      <span className="navbar__bell-icon">{n.icon}</span>
                      <div className="navbar__bell-body">
                        <span className="navbar__bell-msg">{n.message}</span>
                        <span className="navbar__bell-time">{timeAgo(n.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="navbar__profile" ref={dropdownRef}>
          <button className="navbar__profile-btn" onClick={() => setDropdownOpen((v) => !v)}>
            <span className="navbar__avatar">{initials}</span>
            <span className="navbar__profile-info">
              <span className="navbar__profile-name">{user?.name}</span>
              <span className="navbar__profile-id mono">{user?.id}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="navbar__dropdown fade-in-up">
              <div className="navbar__dropdown-header">
                <span className="navbar__dropdown-name">{user?.name}</span>
                <span className="navbar__dropdown-email">{user?.email}</span>
              </div>
              <a href="/profile" className="navbar__dropdown-item">My Profile</a>
              <a href="/appointment-status" className="navbar__dropdown-item">My Appointments</a>
              <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={logout}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}