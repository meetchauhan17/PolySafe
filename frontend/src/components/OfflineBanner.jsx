import React, { useState, useEffect } from 'react';
import { WifiOff, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-amber-500/10 border-b border-amber-500/25 text-amber-900 text-xs py-2 px-4 sticky top-0 z-50 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
              </span>
              <WifiOff className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <span className="font-bold">Offline: showing saved data</span>
              <span className="hidden sm:inline text-amber-700 opacity-90">
                — PolySafe offline cache & clinical decision support rules are active.
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-800 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/20">
              <Database className="w-3 h-3 text-amber-700" />
              <span>Offline Cache Active</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
