import Dexie, { Table } from 'dexie';

// Generate a simple user ID for local storage (you could also use a more sophisticated approach)
const getUserId = (): string => {
  let userId = localStorage.getItem('moonTransitUserId');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('moonTransitUserId', userId);
  }
  return userId;
};

export interface UserLocation {
  id?: number;
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
  id?: number;
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

class MoonTransitDB extends Dexie {
  userLocations!: Table<UserLocation>;
  transitDetections!: Table<TransitDetection>;
  userPreferences!: Table<UserPreferences>;

  constructor() {
    super('MoonTransitDB');
    this.version(1).stores({
      userLocations: '++id, user_id, name, is_default, created_at, updated_at, latitude, longitude',
      transitDetections: '++id, user_id, detection_time, transit_time, flight_callsign, flight_icao24, confidence_score, was_captured, created_at, latitude, longitude',
      userPreferences: '&user_id, created_at, updated_at'
    });
  }
}

export const db = new MoonTransitDB();

// Helper functions to mimic Supabase-like API
export const localDB = {
  userLocations: {
    async insert(location: Omit<UserLocation, 'id' | 'created_at' | 'updated_at'>) {
      const now = new Date().toISOString();
      const newLocation: UserLocation = {
        ...location,
        created_at: now,
        updated_at: now
      };
      const id = await db.userLocations.add(newLocation);
      return { data: { ...newLocation, id }, error: null };
    },

    async selectAll(userId: string) {
      try {
        const data = await db.userLocations.where('user_id').equals(userId).toArray();
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async update(id: number, updates: Partial<UserLocation>) {
      try {
        const updatedData = { ...updates, updated_at: new Date().toISOString() };
        await db.userLocations.update(id, updatedData);
        return { data: updatedData, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async delete(id: number) {
      try {
        await db.userLocations.delete(id);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },

    async getDefault(userId: string) {
      try {
        const data = await db.userLocations
          .where('user_id').equals(userId)
          .and(location => location.is_default === true)
          .first();
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async setDefault(userId: string, locationId: number) {
      try {
        // First, unset all default flags
        await db.userLocations
          .where('user_id').equals(userId)
          .modify({ is_default: false });
        
        // Then set the new default
        await db.userLocations.update(locationId, { 
          is_default: true, 
          updated_at: new Date().toISOString() 
        });
        
        return { error: null };
      } catch (error) {
        return { error };
      }
    }
  },

  transitDetections: {
    async insert(detection: Omit<TransitDetection, 'id' | 'created_at'>) {
      const newDetection: TransitDetection = {
        ...detection,
        created_at: new Date().toISOString()
      };
      const id = await db.transitDetections.add(newDetection);
      return { data: { ...newDetection, id }, error: null };
    },

    async selectAll(userId: string) {
      try {
        const data = await db.transitDetections
          .where('user_id').equals(userId)
          .reverse()
          .sortBy('detection_time');
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async selectByDateRange(userId: string, startDate: string, endDate: string) {
      try {
        const data = await db.transitDetections
          .where('user_id').equals(userId)
          .and(detection => detection.detection_time >= startDate && detection.detection_time <= endDate)
          .reverse()
          .sortBy('detection_time');
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async selectCaptured(userId: string) {
      try {
        const data = await db.transitDetections
          .where('user_id').equals(userId)
          .and(detection => detection.was_captured === true)
          .reverse()
          .sortBy('detection_time');
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async update(id: number, updates: Partial<TransitDetection>) {
      try {
        await db.transitDetections.update(id, updates);
        return { data: updates, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  },

  userPreferences: {
    async upsert(preferences: UserPreferences) {
      try {
        await db.userPreferences.put(preferences);
        return { data: preferences, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async select(userId: string) {
      try {
        const data = await db.userPreferences.get(userId);
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  },

  // Utility function to get current user ID
  getCurrentUserId: getUserId,

  // Statistics and utility methods
  async getStats(userId: string) {
    try {
      const locations = await db.userLocations.where('user_id').equals(userId).count();
      const detections = await db.transitDetections.where('user_id').equals(userId).count();
      const captured = await db.transitDetections
        .where('user_id').equals(userId)
        .and(detection => detection.was_captured === true)
        .count();
      
      return {
        data: {
          totalLocations: locations,
          totalDetections: detections,
          capturedTransits: captured,
          successRate: detections > 0 ? (captured / detections) * 100 : 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async isFirstTime(userId: string) {
    try {
      const locationCount = await db.userLocations.where('user_id').equals(userId).count();
      const detectionCount = await db.transitDetections.where('user_id').equals(userId).count();
      const hasPreferences = await db.userPreferences.get(userId);
      
      return {
        data: locationCount === 0 && detectionCount === 0 && !hasPreferences,
        error: null
      };
    } catch (error) {
      return { data: true, error }; // Default to first time if error
    }
  },

  async clearAllData(userId: string) {
    try {
      await db.userLocations.where('user_id').equals(userId).delete();
      await db.transitDetections.where('user_id').equals(userId).delete();
      await db.userPreferences.delete(userId);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};
