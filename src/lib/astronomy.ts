import * as Astronomy from 'astronomy-engine';

export interface Observer {
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface MoonPosition {
  altitude: number;
  azimuth: number;
  distance: number;
  angularDiameter: number;
  rightAscension: number;
  declination: number;
  illumination: number;
  phase: string;
}

export interface HorizontalCoordinates {
  altitude: number;
  azimuth: number;
}

export function calculateMoonPosition(observer: Observer, date: Date = new Date()): MoonPosition {
  const observerObj = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation);

  const moonEquatorial = Astronomy.Equator(Astronomy.Body.Moon, date, observerObj, true, true);
  const moonHorizontal = Astronomy.Horizon(date, observerObj, moonEquatorial.ra, moonEquatorial.dec, 'normal');

  const moonDistance = Astronomy.GeoVector(Astronomy.Body.Moon, date, true);
  const distanceAU = Math.sqrt(
    moonDistance.x * moonDistance.x +
    moonDistance.y * moonDistance.y +
    moonDistance.z * moonDistance.z
  );
  
  // Convert distance from AU to km (1 AU = 149,597,870.7 km)
  const distanceKm = distanceAU * 149597870.7;

  // Moon's radius is 1737.4 km
  const moonAngularDiameter = (2 * Math.atan(1737.4 / distanceKm)) * (180 / Math.PI);

  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date);

  const phase = getMoonPhase(illumination.phase_fraction);

  return {
    altitude: moonHorizontal.altitude,
    azimuth: moonHorizontal.azimuth,
    distance: distanceKm,
    angularDiameter: moonAngularDiameter,
    rightAscension: moonEquatorial.ra,
    declination: moonEquatorial.dec,
    illumination: illumination.phase_fraction,
    phase
  };
}

function getMoonPhase(phaseFraction: number): string {
  if (phaseFraction < 0.03) return 'New Moon';
  if (phaseFraction < 0.22) return 'Waxing Crescent';
  if (phaseFraction < 0.28) return 'First Quarter';
  if (phaseFraction < 0.47) return 'Waxing Gibbous';
  if (phaseFraction < 0.53) return 'Full Moon';
  if (phaseFraction < 0.72) return 'Waning Gibbous';
  if (phaseFraction < 0.78) return 'Last Quarter';
  if (phaseFraction < 0.97) return 'Waning Crescent';
  return 'New Moon';
}

export function calculateHorizontalCoordinates(
  observer: Observer,
  latitude: number,
  longitude: number,
  altitude: number
): HorizontalCoordinates {
  const dx = longitude - observer.longitude;
  const dy = latitude - observer.latitude;
  const dz = altitude - observer.elevation;

  const distance = Math.sqrt(dx * dx + dy * dy + (dz / 111320) * (dz / 111320));
  const distanceKm = distance * 111.32;

  const azimuth = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;

  const altitudeAngle = Math.atan2(dz, distanceKm * 1000) * 180 / Math.PI;

  return {
    altitude: altitudeAngle,
    azimuth
  };
}

export function calculateAngularSeparation(
  alt1: number,
  az1: number,
  alt2: number,
  az2: number
): number {
  const toRad = Math.PI / 180;

  const phi1 = alt1 * toRad;
  const phi2 = alt2 * toRad;
  const deltaTheta = (az2 - az1) * toRad;

  const a = Math.sin((phi2 - phi1) / 2) ** 2 +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaTheta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return c * 180 / Math.PI;
}

export function getMoonRiseSetTimes(observer: Observer, date: Date = new Date()): {
  moonrise: Date | null;
  moonset: Date | null;
  alwaysUp: boolean;
  alwaysDown: boolean;
} {
  const observerObj = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation);

  try {
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observerObj, 1, searchDate, 1);
    const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observerObj, -1, searchDate, 1);

    return {
      moonrise: moonrise ? moonrise.date : null,
      moonset: moonset ? moonset.date : null,
      alwaysUp: false,
      alwaysDown: false
    };
  } catch {
    const currentMoonPos = calculateMoonPosition(observer, date);

    return {
      moonrise: null,
      moonset: null,
      alwaysUp: currentMoonPos.altitude > 0,
      alwaysDown: currentMoonPos.altitude <= 0
    };
  }
}
