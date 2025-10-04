import { useState, useEffect } from 'react';
import { Observer } from '../lib/astronomy';
import { FlightData, FlightPosition, fetchNearbyFlights, calculateFlightPosition } from '../lib/flights';

const UPDATE_INTERVAL = 60000;

export function useFlightTracking(observer: Observer | null, radiusKm: number = 50) {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [flightPositions, setFlightPositions] = useState<FlightPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!observer) return;

    const fetchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedFlights = await fetchNearbyFlights(observer, radiusKm);
        setFlights(fetchedFlights);

        const positions = fetchedFlights.map(flight =>
          calculateFlightPosition(observer, flight)
        );
        setFlightPositions(positions);

        setLastUpdate(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch flight data');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [observer, radiusKm]);

  return { flights, flightPositions, error, loading, lastUpdate };
}
