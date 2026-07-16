import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title = 'Dashboard' }: NavbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar__left">
        <h1 className="navbar__title">{title}</h1>
      </div>

      <div className="navbar__right">
        <button className="navbar__icon-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="navbar__badge">3</span>
        </button>

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