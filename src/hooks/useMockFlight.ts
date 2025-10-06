import { useMemo } from 'react';
import { Observer, MoonPosition, SunPosition } from '../lib/astronomy';
import { calculateFlightPosition, FlightData, FlightPosition } from '../lib/flights';

export interface MockFlightResult {
  data: FlightData[];
  positions: FlightPosition[];
}

/**
 * Generates a small mock flight intended to cross the given celestial body
 * as seen by the provided observer. The hook is pure and memoized.
 */
export function useMockFlight(
  observer: Observer | null,
  bodyMode: 'moon' | 'sun',
  moonPosition: MoonPosition | null,
  sunPosition: SunPosition | null,
  enabled: boolean = false
): MockFlightResult {
  return useMemo(() => {
    if (!enabled) return { data: [], positions: [] };

    const pos = bodyMode === 'moon' ? moonPosition : sunPosition;
    if (!observer || !pos) return { data: [], positions: [] };

    // Desired flight parameters
    const velocityMps = 100; // 100 m/s (~200 kt)
    const secondsBeforeCrossing = 15; // 15 seconds before crossing
    const distanceKm = 20; // 20 km away

    // angle the flight travels in `secondsBeforeCrossing` at velocity relative to distance
    const angleRad = Math.atan((velocityMps * secondsBeforeCrossing) / (distanceKm * 1000));
    const angleDeg = angleRad * 180 / Math.PI;
    const mockAzimuth = (pos.azimuth - angleDeg + 360) % 360;
    const heading = (pos.azimuth + 90) % 360;
    const callsign = bodyMode === 'moon' ? 'MOONXING' : 'SUNXING';
    const icao24 = callsign.toLowerCase();

    // Project mock flight's lat/lon from observer at adjusted azimuth and distance
    const azimuthRad = mockAzimuth * Math.PI / 180;
    const earthRadiusKm = 6371;
    const lat1 = observer.latitude * Math.PI / 180;
    const lon1 = observer.longitude * Math.PI / 180;
    const dByR = distanceKm / earthRadiusKm;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dByR) + Math.cos(lat1) * Math.sin(dByR) * Math.cos(azimuthRad));
    const lon2 = lon1 + Math.atan2(
      Math.sin(azimuthRad) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
    );
    const offsetLat = lat2 * 180 / Math.PI;
    const offsetLon = lon2 * 180 / Math.PI;

    // Altitude so that, from observer, flight appears at the body's altitude above horizon
    const bodyAltRad = pos.altitude * Math.PI / 180;
    const flightAlt = observer.elevation + Math.tan(bodyAltRad) * (distanceKm * 1000);

    const flightData: FlightData = {
      icao24,
      callsign,
      latitude: offsetLat,
      longitude: offsetLon,
      altitude: flightAlt,
      velocity: velocityMps,
      heading,
      verticalRate: 0,
      lastUpdate: Date.now(),
    };

    const flightPosition = calculateFlightPosition(observer, flightData);

    return { data: [flightData], positions: [flightPosition] };
  }, [observer, bodyMode, moonPosition, sunPosition, enabled]);
}

export default useMockFlight;
