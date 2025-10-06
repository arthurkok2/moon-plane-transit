import { describe, it, expect } from 'vitest';
import { calculateSunPosition, Observer } from '../lib/astronomy';

describe('Sun Position', () => {
  const observer: Observer = { latitude: 40.0, longitude: -74.0, elevation: 10 };

  it('calculates a plausible sun position', () => {
    const pos = calculateSunPosition(observer, new Date());
    expect(typeof pos.altitude).toBe('number');
    expect(typeof pos.azimuth).toBe('number');
    // Angular diameter ~0.53 deg (allow variance 0.4 - 0.7 due to date & distance changes)
    expect(pos.angularDiameter).toBeGreaterThan(0.4);
    expect(pos.angularDiameter).toBeLessThan(0.7);
  });
});
