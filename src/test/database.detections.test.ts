import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localDB } from '../lib/database'

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-user-id-123')
  }
})

describe('Database - Transit Detections', () => {
  const testUserId = 'test-user-id-123'
  
  beforeEach(async () => {
    // Clear all data before each test
    await localDB.clearAllData(testUserId)
  })

  it('should insert a new transit detection with all fields', async () => {
    const detectionData = {
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10.5,
      flight_callsign: 'UA123',
      flight_icao24: 'ABC123',
      flight_altitude: 35000,
      flight_velocity: 900.5,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'Test detection with all fields'
    }

    const result = await localDB.transitDetections.insert(detectionData)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.detection_time).toBe('2024-10-04T10:00:00.000Z')
    expect(result.data?.transit_time).toBe('2024-10-04T10:05:00.000Z')
    expect(result.data?.latitude).toBe(40.7128)
    expect(result.data?.longitude).toBe(-74.0060)
    expect(result.data?.elevation).toBe(10.5)
    expect(result.data?.flight_callsign).toBe('UA123')
    expect(result.data?.flight_icao24).toBe('ABC123')
    expect(result.data?.flight_altitude).toBe(35000)
    expect(result.data?.flight_velocity).toBe(900.5)
    expect(result.data?.moon_altitude).toBe(45.5)
    expect(result.data?.moon_azimuth).toBe(180.0)
    expect(result.data?.angular_separation).toBe(0.25)
    expect(result.data?.confidence_score).toBe(0.85)
    expect(result.data?.was_captured).toBe(false)
    expect(result.data?.notes).toBe('Test detection with all fields')
    expect(result.data?.created_at).toBeDefined()
    expect(result.data?.id).toBeDefined()
  })

  it('should retrieve all transit detections sorted by detection_time', async () => {
    // Insert detections with different times
    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'UA123',
      flight_icao24: 'ABC123',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'First detection'
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T11:00:00.000Z',
      transit_time: '2024-10-04T11:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'DL456',
      flight_icao24: 'DEF456',
      flight_altitude: 38000,
      flight_velocity: 850,
      moon_altitude: 50.0,
      moon_azimuth: 185.0,
      angular_separation: 0.30,
      confidence_score: 0.75,
      was_captured: true,
      notes: 'Second detection'
    })

    const result = await localDB.transitDetections.selectAll(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data).toHaveLength(2)
    // Should be sorted in reverse order (most recent first)
    expect(result.data?.[0]?.notes).toBe('Second detection')
    expect(result.data?.[1]?.notes).toBe('First detection')
  })

  it('should filter detections by date range', async () => {
    // Insert detections with different dates
    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-01T10:00:00.000Z',
      transit_time: '2024-10-01T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'OLD123',
      flight_icao24: 'OLD123',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'Old detection'
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'NEW456',
      flight_icao24: 'NEW456',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'Recent detection'
    })

    const result = await localDB.transitDetections.selectByDateRange(
      testUserId,
      '2024-10-04T00:00:00.000Z',
      '2024-10-04T23:59:59.999Z'
    )
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0]?.notes).toBe('Recent detection')
  })

  it('should filter captured detections only', async () => {
    // Insert mix of captured and non-captured detections
    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'MISS123',
      flight_icao24: 'MISS123',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'Missed detection'
    })

    await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T11:00:00.000Z',
      transit_time: '2024-10-04T11:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'CAPTURED456',
      flight_icao24: 'CAPTURED456',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: true,
      notes: 'Captured detection'
    })

    const result = await localDB.transitDetections.selectCaptured(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data).toHaveLength(1)
    expect(result.data?.[0]?.was_captured).toBe(true)
    expect(result.data?.[0]?.notes).toBe('Captured detection')
  })

  it('should update detection fields', async () => {
    const insertResult = await localDB.transitDetections.insert({
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: 'UPDATE123',
      flight_icao24: 'UPDATE123',
      flight_altitude: 35000,
      flight_velocity: 900,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: 'Original notes'
    })

    const detectionId = insertResult.data?.id
    expect(detectionId).toBeDefined()

    const updateResult = await localDB.transitDetections.update(detectionId!, {
      was_captured: true,
      notes: 'Updated: Successfully captured!'
    })

    expect(updateResult.error).toBeNull()

    // Verify the update persisted
    const allDetections = await localDB.transitDetections.selectAll(testUserId)
    const updatedDetection = allDetections.data?.find(det => det.id === detectionId)
    expect(updatedDetection?.was_captured).toBe(true)
    expect(updatedDetection?.notes).toBe('Updated: Successfully captured!')
  })

  it('should handle null values correctly', async () => {
    const detectionData = {
      user_id: testUserId,
      detection_time: '2024-10-04T10:00:00.000Z',
      transit_time: '2024-10-04T10:05:00.000Z',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      flight_callsign: null,
      flight_icao24: 'NULLTEST',
      flight_altitude: null,
      flight_velocity: null,
      moon_altitude: 45.5,
      moon_azimuth: 180.0,
      angular_separation: 0.25,
      confidence_score: 0.85,
      was_captured: false,
      notes: null
    }

    const result = await localDB.transitDetections.insert(detectionData)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.flight_callsign).toBeNull()
    expect(result.data?.flight_altitude).toBeNull()
    expect(result.data?.flight_velocity).toBeNull()
    expect(result.data?.notes).toBeNull()
    expect(result.data?.flight_icao24).toBe('NULLTEST')
  })
})
