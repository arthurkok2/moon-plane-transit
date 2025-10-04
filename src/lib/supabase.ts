import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransitDetection {
  id: string;
  user_id: string | null;
  detection_time: string;
  transit_time: string;
  latitude: number;
  longitude: number;
  elevation: number;
  flight_callsign: string | null;
  flight_icao24: string | null;
  flight_altitude: number | null;
  flight_velocity: number | null;
  moon_altitude: number;
  moon_azimuth: number;
  angular_separation: number;
  confidence_score: number;
  was_captured: boolean;
  notes: string | null;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  notification_lead_time: number;
  min_confidence_score: number;
  max_distance_km: number;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}
