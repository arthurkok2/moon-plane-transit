import { Observer } from './astronomy';

// Data source types
export enum ADSBDataSource {
  OPENSKY = 'opensky',
  ADSB_ONE = 'adsb-one'
}

export interface DataSourceInfo {
  id: ADSBDataSource;
  name: string;
  description: string;
  rateLimit: string;
  maxRadius: number; // in km
  updateInterval: number; // in milliseconds
}

export const DATA_SOURCES: Record<ADSBDataSource, DataSourceInfo> = {
  [ADSBDataSource.OPENSKY]: {
    id: ADSBDataSource.OPENSKY,
    name: 'OpenSky Network',
    description: 'Free, community-driven ADS-B network',
    rateLimit: '400 requests/day (anonymous)',
    maxRadius: 250,
    updateInterval: 60000 // 60 seconds
  },
  [ADSBDataSource.ADSB_ONE]: {
    id: ADSBDataSource.ADSB_ONE,
    name: 'ADSB.One',
    description: 'High-quality ADS-B data with good coverage',
    rateLimit: '1 request/second',
    maxRadius: 463, // 250 nautical miles
    updateInterval: 10000 // 10 seconds
  }
};

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

// ADSB.One API response format (ADSBExchange v2 compatible)
interface ADSBOneAircraft {
  hex: string;
  type?: string;
  flight?: string;
  alt_baro?: number;
  alt_geom?: number;
  gs?: number;
  track?: number;
  baro_rate?: number;
  squawk?: string;
  lat?: number;
  lon?: number;
  seen?: number;
  seen_pos?: number;
}

interface ADSBOneResponse {
  ac: ADSBOneAircraft[];
  msg: string;
  now: number;
  total: number;
}

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
  radiusKm: number = 50,
  dataSource: ADSBDataSource = ADSBDataSource.OPENSKY
): Promise<FlightData[]> {
  const sourceInfo = DATA_SOURCES[dataSource];
  const clampedRadius = Math.min(radiusKm, sourceInfo.maxRadius);
  
  switch (dataSource) {
    case ADSBDataSource.OPENSKY:
      return fetchOpenSkyFlights(observer, clampedRadius);
    case ADSBDataSource.ADSB_ONE:
      return fetchADSBOneFlights(observer, clampedRadius);
    default:
      throw new Error(`Unsupported data source: ${dataSource}`);
  }
}

async function fetchOpenSkyFlights(
  observer: Observer,
  radiusKm: number
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
    console.error('Error fetching OpenSky flight data:', error);
    throw error;
  }
}

async function fetchADSBOneFlights(
  observer: Observer,
  radiusKm: number
): Promise<FlightData[]> {
  // Convert km to nautical miles for ADSB.One API
  const radiusNm = Math.min(radiusKm * 0.539957, 250); // Max 250 nm
  
  try {
    const url = `https://api.adsb.one/v2/point/${observer.latitude}/${observer.longitude}/${radiusNm}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. ADSB.One allows 1 request per second.');
      }
      throw new Error(`Failed to fetch flight data: ${response.status}`);
    }

    const data: ADSBOneResponse = await response.json();

    if (!data.ac || !Array.isArray(data.ac)) {
      return [];
    }

    const flights: FlightData[] = data.ac
      .filter((aircraft: ADSBOneAircraft) => {
        return aircraft.lat !== undefined && aircraft.lon !== undefined && 
               aircraft.alt_baro !== undefined && aircraft.gs !== undefined &&
               aircraft.gs >= (MIN_AIRBORNE_SPEED * 1.94384); // Convert m/s to knots
      })
      .map((aircraft: ADSBOneAircraft) => ({
        icao24: aircraft.hex.toLowerCase(),
        callsign: aircraft.flight ? aircraft.flight.trim() : null,
        latitude: aircraft.lat!,
        longitude: aircraft.lon!,
        altitude: aircraft.alt_baro! * 0.3048, // Convert feet to meters
        velocity: (aircraft.gs! * 0.514444), // Convert knots to m/s
        heading: aircraft.track || 0,
        verticalRate: aircraft.baro_rate ? aircraft.baro_rate * 0.00508 : 0, // Convert ft/min to m/s
        lastUpdate: (data.now - (aircraft.seen || 0) * 1000) / 1000
      }));

    return flights;
  } catch (error) {
    console.error('Error fetching ADSB.One flight data:', error);
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
