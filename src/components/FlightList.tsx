import { Plane, Navigation, TrendingUp, Clock, MapPin, Gauge, Radio } from 'lucide-react';
import { FlightData, FlightPosition, ADSBDataSource, DATA_SOURCES } from '../lib/flights';

interface FlightListProps {
  flights: FlightData[];
  flightPositions: FlightPosition[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  dataSource: ADSBDataSource;
}

export function FlightList({ flights, flightPositions, loading, error, lastUpdate, dataSource }: FlightListProps) {
  const sortedFlights = [...flights].sort((a, b) => {
    const posA = flightPositions.find(pos => pos.flight.icao24 === a.icao24);
    const posB = flightPositions.find(pos => pos.flight.icao24 === b.icao24);
    return (posA?.distanceKm || Infinity) - (posB?.distanceKm || Infinity);
  });

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const age = now - timestamp;
    if (age < 60) return `${Math.floor(age)}s ago`;
    if (age < 3600) return `${Math.floor(age / 60)}m ago`;
    return `${Math.floor(age / 3600)}h ago`;
  };

  const formatAltitude = (altitude: number) => {
    if (altitude < 1000) return `${Math.round(altitude)}ft`;
    return `${(altitude / 1000).toFixed(1)}k ft`;
  };

  const formatSpeed = (velocity: number) => {
    const mph = velocity * 2.237; // m/s to mph
    const knots = velocity * 1.944; // m/s to knots
    return `${Math.round(mph)} mph (${Math.round(knots)} kt)`;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)} km`;
  };

  const formatHeading = (heading: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(heading / 22.5) % 16;
    return `${Math.round(heading)}° (${directions[index]})`;
  };

  const getAltitudeColor = (altitude: number) => {
    if (altitude < 5000) return 'text-orange-400';
    if (altitude < 15000) return 'text-yellow-400';
    if (altitude < 30000) return 'text-green-400';
    return 'text-blue-400';
  };

  const getSpeedColor = (velocity: number) => {
    const mph = velocity * 2.237;
    if (mph < 200) return 'text-yellow-400';
    if (mph < 400) return 'text-green-400';
    return 'text-blue-400';
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Current Flights</h3>
          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
            {flights.length}
          </span>
        </div>
        {lastUpdate && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {loading && flights.length === 0 && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">Loading flights...</p>
        </div>
      )}

      {flights.length === 0 && !loading && (
        <div className="text-center py-8">
          <Plane className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No flights detected in your area</p>
          <p className="text-slate-500 text-xs mt-1">Flights are searched within 50km radius</p>
        </div>
      )}

      {flights.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedFlights.map((flight) => {
            const position = flightPositions.find(pos => pos.flight.icao24 === flight.icao24);
            
            return (
              <div key={flight.icao24} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                      <Plane className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {flight.callsign?.trim() || 'Unknown'}
                      </div>
                      <div className="text-slate-400 text-xs font-mono">
                        {flight.icao24.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {position && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-slate-300">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(position.distanceKm)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {position.altitude.toFixed(1)}° elevation
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Altitude</span>
                    </div>
                    <div className={`font-mono ${getAltitudeColor(flight.altitude)}`}>
                      {formatAltitude(flight.altitude)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Gauge className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Speed</span>
                    </div>
                    <div className={`font-mono text-xs ${getSpeedColor(flight.velocity)}`}>
                      {formatSpeed(flight.velocity)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Navigation className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Heading</span>
                    </div>
                    <div className="text-slate-300 font-mono text-xs">
                      {formatHeading(flight.heading)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-400">Last Seen</span>
                    </div>
                    <div className="text-slate-300 font-mono text-xs">
                      {formatTime(flight.lastUpdate)}
                    </div>
                  </div>
                </div>

                {flight.verticalRate !== 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-600/50">
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className={`w-3 h-3 ${flight.verticalRate > 0 ? 'text-green-400' : 'text-red-400'}`} />
                      <span className="text-slate-400">
                        {flight.verticalRate > 0 ? 'Climbing' : 'Descending'} at{' '}
                        <span className={`font-mono ${flight.verticalRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {Math.abs(Math.round(flight.verticalRate * 196.85))} ft/min
                        </span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {flights.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-600/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Radio className="w-3 h-3" />
              <span>Source: {DATA_SOURCES[dataSource].name}</span>
            </div>
            <span>
              {flights.length > 5 ? 'Showing closest flights first • ' : ''}
              Total: {flights.length} aircraft tracked
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
