import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localDB } from '../lib/database'

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-user-id-123')
  }
})

describe('Database - User Preferences', () => {
  const testUserId = 'test-user-id-123'
  
  beforeEach(async () => {
    // Clear all data before each test
    await localDB.clearAllData(testUserId)
  })

  it('should insert/upsert user preferences with all fields', async () => {
    const preferencesData = {
      user_id: testUserId,
      notification_lead_time: 300,
      min_confidence_score: 0.7,
      max_distance_km: 50,
      notification_enabled: true,
      created_at: '2024-10-04T10:00:00.000Z',
      updated_at: '2024-10-04T10:00:00.000Z'
    }

    const result = await localDB.userPreferences.upsert(preferencesData)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.user_id).toBe(testUserId)
    expect(result.data?.notification_lead_time).toBe(300)
    expect(result.data?.min_confidence_score).toBe(0.7)
    expect(result.data?.max_distance_km).toBe(50)
    expect(result.data?.notification_enabled).toBe(true)
    expect(result.data?.created_at).toBe('2024-10-04T10:00:00.000Z')
    expect(result.data?.updated_at).toBe('2024-10-04T10:00:00.000Z')
  })

  it('should retrieve user preferences', async () => {
    const preferencesData = {
      user_id: testUserId,
      notification_lead_time: 600,
      min_confidence_score: 0.8,
      max_distance_km: 75,
      notification_enabled: false,
      created_at: '2024-10-04T10:00:00.000Z',
      updated_at: '2024-10-04T10:00:00.000Z'
    }

    // Insert preferences
    await localDB.userPreferences.upsert(preferencesData)

    // Retrieve preferences
    const result = await localDB.userPreferences.select(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.notification_lead_time).toBe(600)
    expect(result.data?.min_confidence_score).toBe(0.8)
    expect(result.data?.max_distance_km).toBe(75)
    expect(result.data?.notification_enabled).toBe(false)
  })

  it('should update existing preferences (upsert behavior)', async () => {
    // Insert initial preferences
    const initialPrefs = {
      user_id: testUserId,
      notification_lead_time: 300,
      min_confidence_score: 0.7,
      max_distance_km: 50,
      notification_enabled: true,
      created_at: '2024-10-04T10:00:00.000Z',
      updated_at: '2024-10-04T10:00:00.000Z'
    }

    await localDB.userPreferences.upsert(initialPrefs)

    // Update preferences
    const updatedPrefs = {
      user_id: testUserId,
      notification_lead_time: 600,
      min_confidence_score: 0.9,
      max_distance_km: 100,
      notification_enabled: false,
      created_at: '2024-10-04T10:00:00.000Z', // Keep original created_at
      updated_at: '2024-10-04T11:00:00.000Z'  // New updated_at
    }

    const updateResult = await localDB.userPreferences.upsert(updatedPrefs)
    expect(updateResult.error).toBeNull()

    // Verify update
    const result = await localDB.userPreferences.select(testUserId)
    expect(result.data?.notification_lead_time).toBe(600)
    expect(result.data?.min_confidence_score).toBe(0.9)
    expect(result.data?.max_distance_km).toBe(100)
    expect(result.data?.notification_enabled).toBe(false)
    expect(result.data?.created_at).toBe('2024-10-04T10:00:00.000Z') // Original created_at preserved
    expect(result.data?.updated_at).toBe('2024-10-04T11:00:00.000Z') // Updated timestamp
  })

  it('should return null for non-existent user preferences', async () => {
    const result = await localDB.userPreferences.select('non-existent-user')
    
    expect(result.error).toBeNull()
    expect(result.data).toBeUndefined() // or null, depending on Dexie behavior
  })

  it('should handle edge case values correctly', async () => {
    const preferencesData = {
      user_id: testUserId,
      notification_lead_time: 0, // Zero lead time
      min_confidence_score: 0.0, // Minimum confidence
      max_distance_km: 1000, // Large distance
      notification_enabled: false,
      created_at: '2024-10-04T10:00:00.000Z',
      updated_at: '2024-10-04T10:00:00.000Z'
    }

    const result = await localDB.userPreferences.upsert(preferencesData)
    
    expect(result.error).toBeNull()
    expect(result.data?.notification_lead_time).toBe(0)
    expect(result.data?.min_confidence_score).toBe(0.0)
    expect(result.data?.max_distance_km).toBe(1000)
    expect(result.data?.notification_enabled).toBe(false)
  })

  it('should handle maximum confidence score correctly', async () => {
    const preferencesData = {
      user_id: testUserId,
      notification_lead_time: 1800, // 30 minutes
      min_confidence_score: 1.0, // Maximum confidence
      max_distance_km: 25, // Small radius
      notification_enabled: true,
      created_at: '2024-10-04T10:00:00.000Z',
      updated_at: '2024-10-04T10:00:00.000Z'
    }

    const result = await localDB.userPreferences.upsert(preferencesData)
    
    expect(result.error).toBeNull()
    expect(result.data?.min_confidence_score).toBe(1.0)
    expect(result.data?.notification_lead_time).toBe(1800)
    expect(result.data?.max_distance_km).toBe(25)
  })
})
