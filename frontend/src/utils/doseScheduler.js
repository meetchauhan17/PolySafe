import { notify } from './toast';

/**
 * Checks if browser Notifications are supported.
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission status.
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Requests browser notification permission politely.
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      notify.success('Reminders Enabled', 'You will receive dose notifications at scheduled times.');
    }
    return res;
  } catch (err) {
    console.warn('[DoseScheduler] Notification permission error:', err);
    return 'denied';
  }
}

/**
 * Dispatches a dose reminder via Web Notification API if granted,
 * and always falls back to an in-app toast banner.
 */
export function sendDoseReminder({ title, body, doseName, doseTime, foodInstruction }) {
  const reminderTitle = title || `PolySafe Dose Reminder: ${doseName || 'Medication'}`;
  const reminderBody = body || `${doseName || 'Prescription'} is due at ${doseTime || 'now'}. ${foodInstruction ? `(${foodInstruction})` : 'Take with water.'}`;

  let notifiedInBrowser = false;

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const notif = new Notification(reminderTitle, {
        body: reminderBody,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: `dose-reminder-${doseName}-${Date.now()}`,
        renotify: true,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      notifiedInBrowser = true;
    } catch (e) {
      console.warn('[DoseScheduler] Could not instantiate Notification:', e);
    }
  }

  // Fallback in-app toast (or companion toast)
  notify.info(
    reminderTitle,
    reminderBody
  );

  return notifiedInBrowser;
}
