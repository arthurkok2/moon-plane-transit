import { useState, useEffect, useCallback } from 'react';
import { localDB, UserLocation, TransitDetection, UserPreferences } from '../lib/database';

// Hook for managing user locations
export function useUserLocations() {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = localDB.getCurrentUserId();

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      const result = await localDB.userLocations.selectAll(userId);
      if (result.error) {
        setError('Failed to load locations');
      } else {
        setLocations(result.data || []);
      }
    } catch {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addLocation = async (location: Omit<UserLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const result = await localDB.userLocations.insert({
        ...location,
        user_id: userId
      });
      if (result.error) {
        setError('Failed to add location');
        return false;
      }
      await loadLocations(); // Refresh the list
      return true;
    } catch {
      setError('Failed to add location');
      return false;
    }
  };

  const updateLocation = async (id: number, updates: Partial<UserLocation>) => {
    try {
      const result = await localDB.userLocations.update(id, updates);
      if (result.error) {
        setError('Failed to update location');
        return false;
      }
      await loadLocations(); // Refresh the list
      return true;
    } catch {
      setError('Failed to update location');
      return false;
    }
  };

  const deleteLocation = async (id: number) => {
    try {
      const result = await localDB.userLocations.delete(id);
      if (result.error) {
        setError('Failed to delete location');
        return false;
      }
      await loadLocations(); // Refresh the list
      return true;
    } catch {
      setError('Failed to delete location');
      return false;
    }
  };

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return {
    locations,
    loading,
    error,
    addLocation,
    updateLocation,
    deleteLocation,
    refreshLocations: loadLocations
  };
}

// Hook for managing transit detections
export function useTransitHistory() {
  const [detections, setDetections] = useState<TransitDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = localDB.getCurrentUserId();

  const loadDetections = useCallback(async () => {
    try {
      setLoading(true);
      const result = await localDB.transitDetections.selectAll(userId);
      if (result.error) {
        setError('Failed to load transit history');
      } else {
        setDetections(result.data || []);
      }
    } catch {
      setError('Failed to load transit history');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const saveDetection = async (detection: Omit<TransitDetection, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const result = await localDB.transitDetections.insert({
        ...detection,
        user_id: userId
      });
      if (result.error) {
        setError('Failed to save detection');
        return false;
      }
      await loadDetections(); // Refresh the list
      return true;
    } catch {
      setError('Failed to save detection');
      return false;
    }
  };

  const updateDetection = async (id: number, updates: Partial<TransitDetection>) => {
    try {
      const result = await localDB.transitDetections.update(id, updates);
      if (result.error) {
        setError('Failed to update detection');
        return false;
      }
      await loadDetections(); // Refresh the list
      return true;
    } catch {
      setError('Failed to update detection');
      return false;
    }
  };

  useEffect(() => {
    loadDetections();
  }, [loadDetections]);

  return {
    detections,
    loading,
    error,
    saveDetection,
    updateDetection,
    refreshDetections: loadDetections
  };
}

// Hook for managing user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = localDB.getCurrentUserId();

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const result = await localDB.userPreferences.select(userId);
      if (result.error) {
        setError('Failed to load preferences');
      } else {
        setPreferences(result.data || null);
      }
    } catch {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const savePreferences = async (newPreferences: Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const now = new Date().toISOString();
      const prefsToSave: UserPreferences = {
        ...newPreferences,
        user_id: userId,
        created_at: preferences?.created_at || now,
        updated_at: now
      };
      
      const result = await localDB.userPreferences.upsert(prefsToSave);
      if (result.error) {
        setError('Failed to save preferences');
        return false;
      }
      setPreferences(prefsToSave);
      return true;
    } catch {
      setError('Failed to save preferences');
      return false;
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    refreshPreferences: loadPreferences
  };
}
