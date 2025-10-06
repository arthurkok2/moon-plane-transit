import { Observer } from './astronomy';

// OpenSky API state array format
type OpenSkyState = [
  string,      // icao24
  string,      // callsign
  string,      // origin_country
  number,      // time_position
  number,      // last_contact
  number,      // longitude
  number,      // latitude
  number,      // baro_altitude
  boolean,     // on_ground
  number,      // velocity
  number,      // true_track
  number,      // vertical_rate
  number[],    // sensors
  number,      // geo_altitude
  string,      // squawk
  boolean,     // spi
  number       // position_source
];

export interface FlightData {
  icao24: string;
  callsign: string | null;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  verticalRate: number;
  lastUpdate: number;
}

export interface FlightPosition {
  flight: FlightData;
  altitude: number;
  azimuth: number;
  distanceKm: number;
}

const OPENSKY_BASE_URL = 'https://opensky-network.org/api/states/all';

// Minimum airborne speed in m/s (approximately 100 knots)
const MIN_AIRBORNE_SPEED = 51.4; // m/s

export async function fetchNearbyFlights(
  observer: Observer,
  radiusKm: number = 50
): Promise<FlightData[]> {
  const latMin = observer.latitude - (radiusKm / 111.32);
  const latMax = observer.latitude + (radiusKm / 111.32);
  const lonMin = observer.longitude - (radiusKm / (111.32 * Math.cos(observer.latitude * Math.PI / 180)));
  const lonMax = observer.longitude + (radiusKm / (111.32 * Math.cos(observer.latitude * Math.PI / 180)));

  try {
    const url = `${OPENSKY_BASE_URL}?lamin=${latMin}&lomin=${lonMin}&lamax=${latMax}&lomax=${lonMax}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. OpenSky Network has usage limits.');
      }
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const data = await response.json();

    if (!data.states || !Array.isArray(data.states)) {
      return [];
    }

    const flights: FlightData[] = data.states
      .filter((state: OpenSkyState) => {
        return state[5] !== null && state[6] !== null && state[7] !== null && 
               state[9] !== null && state[9] >= MIN_AIRBORNE_SPEED;
      })
      .map((state: OpenSkyState) => ({
        icao24: state[0],
        callsign: state[1] ? state[1].trim() : null,
        latitude: state[6],
        longitude: state[5],
        altitude: state[7] || state[13] || 0,
        velocity: state[9] || 0,
        heading: state[10] || 0,
        verticalRate: state[11] || 0,
        lastUpdate: state[4] || Date.now() / 1000
      }));

    return flights;
  } catch (error) {
    console.error('Error fetching flight data:', error);
    throw error;
  }
}

export function calculateFlightPosition(
  observer: Observer,
  flight: FlightData
): FlightPosition {
  const R = 6371;

  const lat1 = observer.latitude * Math.PI / 180;
  const lat2 = flight.latitude * Math.PI / 180;
  const deltaLat = (flight.latitude - observer.latitude) * Math.PI / 180;
  const deltaLon = (flight.longitude - observer.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
  const azimuth = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  const altitudeMeters = flight.altitude - observer.elevation;
  const altitudeAngle = Math.atan2(altitudeMeters, distanceKm * 1000) * 180 / Math.PI;

  return {
    flight,
    altitude: altitudeAngle,
    azimuth,
    distanceKm
  };
}

export function predictFlightPosition(
  flight: FlightData,
  secondsAhead: number
): { latitude: number; longitude: number; altitude: number } {
  const metersPerSecond = flight.velocity;
  const distanceMeters = metersPerSecond * secondsAhead;

  const R = 6371000;
  const bearing = flight.heading * Math.PI / 180;

  const lat1 = flight.latitude * Math.PI / 180;
  const lon1 = flight.longitude * Math.PI / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / R) +
    Math.cos(lat1) * Math.sin(distanceMeters / R) * Math.cos(bearing)
  );

  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(distanceMeters / R) * Math.cos(lat1),
    Math.cos(distanceMeters / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  const predictedAltitude = flight.altitude + (flight.verticalRate * secondsAhead);

  return {
    latitude: lat2 * 180 / Math.PI,
    longitude: lon2 * 180 / Math.PI,
    altitude: predictedAltitude
  };
}
