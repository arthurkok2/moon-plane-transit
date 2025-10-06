import { useState, useEffect } from 'react';
import { Observer, SunPosition, calculateSunPosition } from '../lib/astronomy';

const UPDATE_INTERVAL = 5000; // same cadence as moon

export function useSunTracking(observer: Observer | null) {
  const [sunPosition, setSunPosition] = useState<SunPosition | null>(null);

  useEffect(() => {
    if (!observer) return;

    const update = () => {
      const pos = calculateSunPosition(observer);
      setSunPosition(pos);
    };

    update();
    const id = setInterval(update, UPDATE_INTERVAL);
    return () => clearInterval(id);
  }, [observer]);

  return sunPosition;
}
