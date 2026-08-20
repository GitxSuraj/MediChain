import { useEffect, useRef } from 'react';
import { createRealtimeSocket } from '../websocket/socket.js';
import { fireAlert } from './useNotifications';

const EVENT_TYPES: Record<string, 'appointment' | 'transfer'> = {
  appointment_confirmed: 'appointment',
  transfer_accepted: 'transfer',
  transfer_declined: 'transfer',
};

const EVENT_MESSAGES: Record<string, (data: Record<string, unknown>) => string> = {
  appointment_confirmed: (d) =>
    `Your appointment${d.hospital_name ? ` at ${d.hospital_name}` : ''} has been confirmed.`,
  transfer_accepted: (d) =>
    `Transfer request${d.patient_name ? ` for ${d.patient_name}` : ''} was accepted.`,
  transfer_declined: (d) =>
    `Transfer request${d.patient_name ? ` for ${d.patient_name}` : ''} was declined.`,
};

const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

/**
 * Opens a targeted (`?identity=`) WebSocket connection for the current
 * patient and turns the events named in the roadmap (appointment_confirmed,
 * transfer_accepted, transfer_declined) into notifications via fireAlert.
 *
 * Reconnects automatically with exponential backoff (1 s → 30 s) if the
 * connection drops. Cleans up on unmount.
 */
export function useNotificationSocket(identity: string | undefined) {
  const retryMs = useRef(BASE_RETRY_MS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    if (!identity) return;
    unmountedRef.current = false;

    let socket: ReturnType<typeof createRealtimeSocket> | null = null;

    function connect() {
      if (unmountedRef.current) return;

      socket = createRealtimeSocket({
        identity,
        onMessage: (message: { event?: string } & Record<string, unknown>) => {
          const build = message.event ? EVENT_MESSAGES[message.event] : undefined;
          const type = message.event ? EVENT_TYPES[message.event] : undefined;
          if (build && type) {
            fireAlert(type, build(message));
          }
          // Successful message receipt → reset backoff
          retryMs.current = BASE_RETRY_MS;
        },
        onClose: () => {
          if (unmountedRef.current) return;
          // Schedule reconnect with exponential backoff
          timeoutRef.current = setTimeout(() => {
            retryMs.current = Math.min(retryMs.current * 2, MAX_RETRY_MS);
            connect();
          }, retryMs.current);
        },
      });
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      socket?.close();
    };
  }, [identity]);
}
