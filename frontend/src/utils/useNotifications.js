import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const NOTIFY_BEFORE_MINS = 10;

/**
 * useNotifications
 *
 * Polls every 30 seconds. For each of the teacher's today-slots,
 * fires a notification exactly when diffMins is between 9–11
 * (a 3-minute window so we never miss a tick).
 * Each slot is only notified once per session (tracked in firedRef).
 *
 * Returns:
 *   - notifications: [{ id, title, body, time, read }]
 *   - unread: number
 *   - markAllRead: fn
 *   - toasts: [{ id, body }]   — pop-up toasts (auto-dismiss)
 *   - dismissToast: fn(id)
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts]               = useState([]);
  const firedRef                          = useRef(new Set()); // slotIds fired this session
  const slotsRef                          = useRef([]);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  // ── Request browser permission once ──────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Fetch teacher's own slots ─────────────────────────────────────────────
  const fetchSlots = useCallback(async () => {
    if (!userInfo.token || userInfo.role !== 'teacher') return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const clsRes = await axios.get(`${API_BASE_URL}/api/classes`, config);
      let all = [];
      for (const cls of clsRes.data) {
        const { data } = await axios.get(`${API_BASE_URL}/api/timetable/class/${cls._id}`, config);
        all = [...all, ...data];
      }
      slotsRef.current = all.filter(s => s.teacher && s.teacher._id === userInfo._id);
    } catch (e) {
      console.error('useNotifications: error fetching slots', e);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // ── Core polling interval ─────────────────────────────────────────────────
  const addNotification = (title, body, slotId) => {
    const entry = { id: slotId, title, body, time: new Date(), read: false };

    // In-app notification history
    setNotifications(prev => [entry, ...prev]);

    // Stacked toast (auto-dismiss after 15 s)
    const toastId = `toast-${slotId}-${Date.now()}`;
    setToasts(prev => [...prev, { id: toastId, title, body }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 15000);

    // Browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/vite.svg', badge: '/vite.svg' });
    }
  };

  useEffect(() => {
    const tick = () => {
      const now        = new Date();
      const todayName  = DAYS[now.getDay()];
      const slots      = slotsRef.current;

      slots.forEach(slot => {
        if (slot.dayOfWeek !== todayName) return;

        const [h, m]    = slot.startTime.split(':').map(Number);
        const lectureMs = new Date(now);
        lectureMs.setHours(h, m, 0, 0);

        const diffMins = Math.floor((lectureMs - now) / 60000);

        // Fire in the window 9–11 minutes before (catches any 30-s poll tick)
        if (diffMins >= 9 && diffMins <= 11) {
          if (!firedRef.current.has(slot._id)) {
            firedRef.current.add(slot._id);
            addNotification(
              '🔔 Upcoming Lecture Reminder',
              `${slot.subject?.name} for ${slot.class?.name} starts in ${diffMins} min${slot.room ? ' • Room ' + slot.room : ''}.`,
              slot._id
            );
          }
        }
      });
    };

    tick(); // Run immediately on mount
    const interval = setInterval(tick, 30000); // Poll every 30 s
    return () => clearInterval(interval);
  }, []); // No dep array — uses slotsRef (mutable ref, no re-render needed)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const unread = notifications.filter(n => !n.read).length;

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const dismissToast = (id) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  return { notifications, unread, markAllRead, toasts, dismissToast };
};
