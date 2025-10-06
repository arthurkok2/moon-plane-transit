import { useState, useEffect, useRef } from 'react';
import { Observer } from '../lib/astronomy';

// Minimum distance change (in meters) to trigger a location update
const MIN_LOCATION_CHANGE = 100;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function useGeolocation() {
  const [observer, setObserver] = useState<Observer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPositionRef = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLon = position.coords.longitude;
        
        // Check if this is the first position or if we've moved significantly
        const shouldUpdate = !lastPositionRef.current || 
          calculateDistance(
            lastPositionRef.current.lat, 
            lastPositionRef.current.lon, 
            newLat, 
            newLon
          ) > MIN_LOCATION_CHANGE;

        if (shouldUpdate) {
          setObserver({
            latitude: newLat,
            longitude: newLon,
            elevation: position.coords.altitude || 0
          });
          lastPositionRef.current = { lat: newLat, lon: newLon };
          setError(null);
        }
        
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache position for 5 minutes to reduce GPS polling
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { observer, error, loading };
}
