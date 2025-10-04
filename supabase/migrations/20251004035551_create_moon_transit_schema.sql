/*
  # Moon-Plane Transit Tracker Database Schema

  ## Overview
  This migration creates the database schema for tracking moon-plane transits,
  user locations, preferences, and transit history for photography planning.

  ## 1. New Tables
  
  ### `user_locations`
  Stores saved observation locations for users
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users
  - `name` (text) - Location name (e.g., "Home", "Observatory Hill")
  - `latitude` (double precision) - Latitude in decimal degrees
  - `longitude` (double precision) - Longitude in decimal degrees
  - `elevation` (double precision) - Elevation in meters above sea level
  - `is_default` (boolean) - Whether this is the default location
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `transit_detections`
  Stores detected transit events for future reference and analysis
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - Reference to auth.users (nullable for guest users)
  - `detection_time` (timestamptz) - When the transit was detected
  - `transit_time` (timestamptz) - Predicted time of the transit
  - `latitude` (double precision) - Observer latitude
  - `longitude` (double precision) - Observer longitude
  - `elevation` (double precision) - Observer elevation in meters
  - `flight_callsign` (text) - Aircraft callsign/flight number
  - `flight_icao24` (text) - Aircraft ICAO 24-bit address
  - `flight_altitude` (double precision) - Aircraft altitude in meters
  - `flight_velocity` (double precision) - Aircraft ground speed in m/s
  - `moon_altitude` (double precision) - Moon altitude in degrees
  - `moon_azimuth` (double precision) - Moon azimuth in degrees
  - `angular_separation` (double precision) - Minimum angular separation in degrees
  - `confidence_score` (double precision) - Confidence score 0-1
  - `was_captured` (boolean) - Whether user successfully captured photo
  - `notes` (text) - User notes about the transit
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_preferences`
  Stores user notification and app preferences
  - `user_id` (uuid, primary key) - Reference to auth.users
  - `notification_lead_time` (integer) - Minutes before transit to notify (default 10)
  - `min_confidence_score` (double precision) - Minimum confidence to show transit (default 0.5)
  - `max_distance_km` (double precision) - Maximum distance to search for flights (default 50)
  - `notification_enabled` (boolean) - Whether notifications are enabled
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Guest users (unauthenticated) can create transit_detections but cannot update them
  - Authenticated users have full CRUD access to their own records
*/

-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  latitude double precision NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude double precision NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  elevation double precision DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);

-- Create transit_detections table
CREATE TABLE IF NOT EXISTS transit_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  detection_time timestamptz DEFAULT now(),
  transit_time timestamptz NOT NULL,
  latitude double precision NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude double precision NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  elevation double precision DEFAULT 0,
  flight_callsign text,
  flight_icao24 text,
  flight_altitude double precision,
  flight_velocity double precision,
  moon_altitude double precision NOT NULL,
  moon_azimuth double precision NOT NULL,
  angular_separation double precision NOT NULL,
  confidence_score double precision DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  was_captured boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transit_detections_user_id ON transit_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_transit_detections_transit_time ON transit_detections(transit_time);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_lead_time integer DEFAULT 10 CHECK (notification_lead_time >= 1 AND notification_lead_time <= 60),
  min_confidence_score double precision DEFAULT 0.5 CHECK (min_confidence_score >= 0 AND min_confidence_score <= 1),
  max_distance_km double precision DEFAULT 50 CHECK (max_distance_km >= 1 AND max_distance_km <= 500),
  notification_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_locations
CREATE POLICY "Users can view own locations"
  ON user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
  ON user_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON user_locations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transit_detections
CREATE POLICY "Users can view own transit detections"
  ON transit_detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert transit detections"
  ON transit_detections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert transit detections"
  ON transit_detections FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can update own transit detections"
  ON transit_detections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transit detections"
  ON transit_detections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_locations_updated_at
  BEFORE UPDATE ON user_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();