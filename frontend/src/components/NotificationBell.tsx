import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  useNotifications,
  useNotificationToasts,
  timeAgo,
  type NotificationType,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from '../hooks/useNotifications';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import Toast from './Toast';
import './NotificationBell.css';

const TYPE_ICON: Record<NotificationType, string> = {
  appointment: '📅',
  transfer: '🔁',
  reminder: '💊',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const { toasts, dismissToast } = useNotificationToasts();
  const [open, setOpen] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(getBrowserNotificationPermission());
  const ref = useRef<HTMLDivElement>(null);

  useNotificationSocket(user?.id);

  async function handleEnableBrowserAlerts() {
    const result = await requestBrowserNotificationPermission();
    setBrowserPermission(result);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="notification-bell" ref={ref}>
        <button
          className="navbar__icon-btn"
          aria-label="Notifications"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="navbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {open && (
          <div className="notification-bell__dropdown navbar__dropdown fade-in-up">
            <div className="notification-bell__header">
              <span className="navbar__dropdown-name">Notifications</span>
              {notifications.length > 0 && (
                <button className="notification-bell__mark-all" onClick={markAllAsRead}>
                  Mark all as read
                </button>
              )}
            </div>

            {browserPermission === 'default' && (
              <button className="notification-bell__enable-browser" onClick={handleEnableBrowserAlerts}>
                Enable browser alerts for reminders &amp; updates
              </button>
            )}
            {browserPermission === 'denied' && (
              <div className="notification-bell__browser-note">
                Browser alerts are blocked — you'll still see in-app notifications here.
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="notification-bell__empty">You're all caught up.</div>
            ) : (
              <div className="notification-bell__list">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`notification-bell__item ${n.read ? '' : 'notification-bell__item--unread'}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <span className="notification-bell__item-icon">{TYPE_ICON[n.type]}</span>
                    <span className="notification-bell__item-body">
                      <span className="notification-bell__item-message">{n.message}</span>
                      <span className="notification-bell__item-time mono">{timeAgo(n.timestamp)}</span>
                    </span>
                    {!n.read && <span className="notification-bell__item-dot" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toasts.length > 0 && (
        <Toast
          key={toasts[toasts.length - 1].id}
          message={toasts[toasts.length - 1].message}
          type="success"
          onClose={() => dismissToast(toasts[toasts.length - 1].id)}
        />
      )}
    </>
  );
}
