'use client';

import { useEffect, useRef, useState } from 'react';

const SYNC_EVERY_SECONDS = 30;

export function useActiveTimer(submissionId: string | null, enabled: boolean, initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const unsynced = useRef(0);

  useEffect(() => {
    if (!submissionId || !enabled) return;

    const sync = (keepalive = false) => {
      const delta = unsynced.current;
      if (delta <= 0) return;
      unsynced.current = 0;
      void fetch(`/api/submissions/${submissionId}/time`, {
        method: 'POST',
        credentials: 'include',
        keepalive,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ seconds: delta }),
      }).catch(() => {
        unsynced.current += delta;
      });
    };

    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setSeconds((s) => s + 1);
      unsynced.current += 1;
      if (unsynced.current >= SYNC_EVERY_SECONDS) sync();
    }, 1000);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') sync(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisibility);
      sync(true);
    };
  }, [submissionId, enabled]);

  return seconds;
}
