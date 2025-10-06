import { useState, useEffect, useRef } from 'react';
import { Observer } from '../lib/astronomy';
import { FlightData, FlightPosition, fetchNearbyFlights, calculateFlightPosition } from '../lib/flights';

const UPDATE_INTERVAL = 60000;

export function useFlightTracking(observer: Observer | null, radiusKm: number = 50) {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [flightPositions, setFlightPositions] = useState<FlightPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastObserverRef = useRef<Observer | null>(null);

  useEffect(() => {
    if (!observer) {
      // Clear interval if observer becomes null
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check if observer has changed significantly (avoid unnecessary re-fetches for tiny changes)
    const hasObserverChanged = !lastObserverRef.current ||
      Math.abs(lastObserverRef.current.latitude - observer.latitude) > 0.001 ||
      Math.abs(lastObserverRef.current.longitude - observer.longitude) > 0.001 ||
      Math.abs(lastObserverRef.current.elevation - observer.elevation) > 100;

    if (!hasObserverChanged && intervalRef.current) {
      // Observer hasn't changed significantly and we already have an interval running
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    lastObserverRef.current = observer;

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

    // Fetch immediately for new observer
    fetchFlights();
    
    // Set up interval for regular updates
    intervalRef.current = setInterval(fetchFlights, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [observer, radiusKm]);

  return { flights, flightPositions, error, loading, lastUpdate };
}
