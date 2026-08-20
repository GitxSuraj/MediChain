import { useSyncExternalStore } from 'react';

export type NotificationType = 'appointment' | 'transfer' | 'reminder';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  read: boolean;
}

const MAX_STORED = 50;
const MAX_SHOWN = 10;

let notifications: NotificationItem[] = [];
const listeners = new Set<() => void>();

let toasts: NotificationItem[] = [];
const toastListeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function emitToasts() {
  toastListeners.forEach((l) => l());
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const TYPE_LABEL: Record<NotificationType, string> = {
  appointment: 'Appointment update',
  transfer: 'Transfer update',
  reminder: 'Medicine reminder',
};

/**
 * Browser Notification permission is intentionally never requested on page
 * load. `requestBrowserNotificationPermission` is only called from a real
 * user interaction (e.g. a button in the NotificationBell or the "Add
 * Reminder" flow). If permission was never asked or is denied, the app
 * keeps working exactly as before through in-app toasts/notifications only.
 */
export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function maybeShowBrowserNotification(type: NotificationType, message: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(TYPE_LABEL[type], { body: message, tag: type });
  } catch {
    // Some browsers (e.g. mobile Safari) can throw here even when permission
    // is granted — the in-app toast/notification already covers the alert,
    // so this is safe to swallow rather than breaking the reminder flow.
  }
}

/**
 * fireAlert(type, message)
 * Adds a notification (tracked as unread, shown in the NotificationBell)
 * and triggers a transient toast. Reusable from anywhere in the app —
 * reminders, websocket events, etc. all funnel through here so there is
 * exactly one notification mechanism, per the roadmap. If the user has
 * granted browser notification permission, also fires a native browser
 * notification so reminders still surface when the tab isn't focused.
 */
export function fireAlert(type: NotificationType, message: string) {
  const item: NotificationItem = { id: makeId(), type, message, timestamp: Date.now(), read: false };

  notifications = [item, ...notifications].slice(0, MAX_STORED);
  emit();

  toasts = [...toasts, item];
  emitToasts();

  maybeShowBrowserNotification(type, message);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitToasts();
}

export function markAllAsRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  emit();
}

export function markAsRead(id: string) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function subscribeToasts(listener: () => void) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function getSnapshot() {
  return notifications;
}

function getToastSnapshot() {
  return toasts;
}

export function useNotifications() {
  const all = useSyncExternalStore(subscribe, getSnapshot);
  const shown = all.slice(0, MAX_SHOWN);
  const unreadCount = all.filter((n) => !n.read).length;

  return { notifications: shown, unreadCount, fireAlert, markAllAsRead, markAsRead };
}

export function useNotificationToasts() {
  const current = useSyncExternalStore(subscribeToasts, getToastSnapshot);
  return { toasts: current, dismissToast };
}

export function timeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}
