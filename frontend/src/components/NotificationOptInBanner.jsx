import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, CheckCircle2 } from 'lucide-react';
import { isNotificationSupported, getNotificationPermission, requestNotificationPermission } from '../utils/doseScheduler';

export default function NotificationOptInBanner({ onPermissionChanged }) {
  const [permission, setPermission] = useState('granted');
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionDismissed = sessionStorage.getItem('polysafe_notif_banner_dismissed');
    if (sessionDismissed === 'true') {
      setDismissed(true);
    }
    setPermission(getNotificationPermission());
  }, []);

  if (!isNotificationSupported() || permission === 'granted' || permission === 'denied' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    setRequesting(true);
    const newPerm = await requestNotificationPermission();
    setPermission(newPerm);
    setRequesting(false);
    if (onPermissionChanged) onPermissionChanged(newPerm);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('polysafe_notif_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-emerald-500/10 border border-blue-500/25 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white flex-shrink-0 shadow-xs">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[var(--ink)] font-[var(--font-heading)]">
                Enable Browser Dose Reminders
              </h2>
              <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                OPT-IN
              </span>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-0.5 max-w-xl">
              Get notified at your scheduled medicine times while PolySafe is open. Includes an automatic in-app toast fallback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={handleDismiss}
            className="text-xs font-mono font-semibold text-[var(--ink-3)] hover:text-[var(--ink)] px-3 py-1.5 rounded-xl border border-transparent hover:border-[var(--border)] transition-all cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="text-xs font-mono font-bold bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{requesting ? 'Enabling...' : 'Enable Reminders'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
