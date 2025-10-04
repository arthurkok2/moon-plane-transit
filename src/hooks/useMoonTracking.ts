import { useState, useEffect } from 'react';
import { Observer, MoonPosition, calculateMoonPosition } from '../lib/astronomy';

const UPDATE_INTERVAL = 5000;

export function useMoonTracking(observer: Observer | null) {
  const [moonPosition, setMoonPosition] = useState<MoonPosition | null>(null);

  useEffect(() => {
    if (!observer) return;

    const updateMoonPosition = () => {
      const position = calculateMoonPosition(observer);
      setMoonPosition(position);
    };

    updateMoonPosition();
    const interval = setInterval(updateMoonPosition, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [observer]);

  return moonPosition;
}
