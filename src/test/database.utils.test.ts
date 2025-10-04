import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localDB } from '../lib/database'

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-user-id-123')
  }
})

describe('Database - Utility Functions', () => {
  const testUserId = 'test-user-id-123'
  
  beforeEach(async () => {
    // Clear all data before each test
    await localDB.clearAllData(testUserId)
    // Clear localStorage to reset user ID
    localStorage.clear()
  })

  it('should generate and persist user ID', () => {
    const userId1 = localDB.getCurrentUserId()
    const userId2 = localDB.getCurrentUserId()
    
    // Should return the same ID on subsequent calls
    expect(userId1).toBe(userId2)
    expect(userId1).toBe('test-user-id-123') // Our mocked UUID
    
    // Should be stored in localStorage
    expect(localStorage.getItem('moonTransitUserId')).toBe(userId1)
  })

  it('should detect first-time user correctly', async () => {
    const result = await localDB.isFirstTime(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBe(true) // Should be first time with empty database
  })

  it('should detect returning user after adding data', async () => {
    // Add some data
    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Test Location',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: true
    })

    const result = await localDB.isFirstTime(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBe(false) // Should not be first time anymore
  })

  it('should provide accurate database statistics', async () => {
    // Initially should have zero stats
    let stats = await localDB.getStats(testUserId)
    expect(stats.data?.totalLocations).toBe(0)
    expect(stats.data?.totalDetections).toBe(0)
    expect(stats.data?.capturedTransits).toBe(0)
    expect(stats.data?.successRate).toBe(0)

    // Add some locations
    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Location 1',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: true
    })

    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Location 2',
      latitude: 41.8781,
      longitude: -87.6298,
      elevation: 20,
      is_default: false
    })

    // Add some detections (mix of captured and missed)
    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'CAPTURED1',
      flight_icao24: 'CAP1',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: true,
      notes: 'Successfully captured'
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T11:00:00.000Z',
      transit_time: '2024-10-04T11:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'MISSED1',
      flight_icao24: 'MISS1',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.75,
      was_captured: false,
      notes: 'Missed this one'
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T12:00:00.000Z',
      transit_time: '2024-10-04T12:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'CAPTURED2',
      flight_icao24: 'CAP2',
      flight_altitude: 38000,
      flight_velocity: 850,
      moon_altitude: 50.0,
      moon_azimuth: 185.0,
      angular_separation: 0.30,
      confidence_score: 0.90,
      was_captured: true,
      notes: 'Another successful capture'
    })

    // Check updated stats
    stats = await localDB.getStats(testUserId)
    expect(stats.error).toBeNull()
    expect(stats.data?.totalLocations).toBe(2)
    expect(stats.data?.totalDetections).toBe(3)
    expect(stats.data?.capturedTransits).toBe(2)
    expect(stats.data?.successRate).toBeCloseTo(66.67, 1) // 2/3 * 100 = 66.67%
  })

  it('should calculate success rate correctly with zero detections', async () => {
    const stats = await localDB.getStats(testUserId)
    
    expect(stats.error).toBeNull()
    expect(stats.data?.totalDetections).toBe(0)
    expect(stats.data?.capturedTransits).toBe(0)
    expect(stats.data?.successRate).toBe(0) // Should handle division by zero
  })

  it('should calculate 100% success rate correctly', async () => {
    // Add only captured detections
    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'PERFECT1',
      flight_icao24: 'PERF1',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.95,
      was_captured: true,
      notes: 'Perfect shot'
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T11:00:00.000Z',
      transit_time: '2024-10-04T11:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'PERFECT2',
      flight_icao24: 'PERF2',
      flight_altitude: 37000,
      flight_velocity: 880,
      moon_altitude: 48.0,
      moon_azimuth: 175.0,
      angular_separation: 0.20,
      confidence_score: 0.92,
      was_captured: true,
      notes: 'Another perfect shot'
    })

    const stats = await localDB.getStats(testUserId)
    
    expect(stats.error).toBeNull()
    expect(stats.data?.totalDetections).toBe(2)
    expect(stats.data?.capturedTransits).toBe(2)
    expect(stats.data?.successRate).toBe(100) // Perfect success rate
  })

  it('should clear all user data correctly', async () => {
    // Add data to all tables
    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Test Location',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: true
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'TEST123',
      flight_icao24: 'TEST123',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'Test detection'
    })

    await localDB.userPreferences.upsert({
      user_id: testUserId,
      notification_lead_time: 300,
      min_confidence_score: 0.7,
      max_distance_km: 50,
      notification_enabled: true,
      created_at: '2024-10-04T10:00:00.000Z',
      updated_at: '2024-10-04T10:00:00.000Z'
    })

    // Verify data exists
    let stats = await localDB.getStats(testUserId)
    expect(stats.data?.totalLocations).toBe(1)
    expect(stats.data?.totalDetections).toBe(1)

    let preferences = await localDB.userPreferences.select(testUserId)
    expect(preferences.data).toBeDefined()

    // Clear all data
    const clearResult = await localDB.clearAllData(testUserId)
    expect(clearResult.error).toBeNull()

    // Verify data is cleared
    stats = await localDB.getStats(testUserId)
    expect(stats.data?.totalLocations).toBe(0)
    expect(stats.data?.totalDetections).toBe(0)
    expect(stats.data?.capturedTransits).toBe(0)

    preferences = await localDB.userPreferences.select(testUserId)
    expect(preferences.data).toBeUndefined()

    // Should be detected as first time user again
    const isFirstTime = await localDB.isFirstTime(testUserId)
    expect(isFirstTime.data).toBe(true)
  })

  it('should not affect other users data when clearing', async () => {
    const otherUserId = 'other-user-123'

    // Add data for both users
    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'User 1 Location',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: true
    })

    await localDB.userLocations.insert({
      user_id: otherUserId,
      name: 'User 2 Location',
      latitude: 41.8781,
      longitude: -87.6298,
      elevation: 20,
      is_default: true
    })

    // Clear only first user's data
    await localDB.clearAllData(testUserId)

    // Verify first user's data is cleared
    const user1Stats = await localDB.getStats(testUserId)
    expect(user1Stats.data?.totalLocations).toBe(0)

    // Verify second user's data is preserved
    const user2Stats = await localDB.getStats(otherUserId)
    expect(user2Stats.data?.totalLocations).toBe(1)
  })
})
