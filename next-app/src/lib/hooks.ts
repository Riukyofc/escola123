'use client';

import { useState, useEffect, useCallback } from 'react';
import { onCacheChange } from './data';

/**
 * Hook that forces a re-render whenever the data cache changes.
 * Use this in any component that displays data from dbGetAll/dbFind/etc.
 */
export function useDataRefresh() {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const unsub = onCacheChange(() => {
      setTick(t => t + 1);
    });
    return unsub;
  }, []);
}

/**
 * Hook that returns a refresh function to manually trigger re-render.
 */
export function useRefreshKey() {
  const [key, setKey] = useState(0);
  const refresh = useCallback(() => setKey(k => k + 1), []);
  
  useEffect(() => {
    const unsub = onCacheChange(() => setKey(k => k + 1));
    return unsub;
  }, []);

  return { key, refresh };
}
