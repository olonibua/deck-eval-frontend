'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function usePersistentState<T>(key: string, initial: T): readonly [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // ignore unreadable storage
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore blocked storage
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
