import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localDB } from '../lib/database'

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-user-id-123')
  }
})

describe('Database - User Locations', () => {
  const testUserId = 'test-user-id-123'
  
  beforeEach(async () => {
    // Clear all data before each test
    await localDB.clearAllData(testUserId)
  })

  it('should insert a new user location with all fields', async () => {
    const locationData = {
      user_id: testUserId,
      name: 'Test Observatory',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10.5,
      is_default: true
    }

    const result = await localDB.userLocations.insert(locationData)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('Test Observatory')
    expect(result.data?.latitude).toBe(40.7128)
    expect(result.data?.longitude).toBe(-74.0060)
    expect(result.data?.elevation).toBe(10.5)
    expect(result.data?.is_default).toBe(true)
    expect(result.data?.created_at).toBeDefined()
    expect(result.data?.updated_at).toBeDefined()
    expect(result.data?.id).toBeDefined()
  })

  it('should retrieve all user locations', async () => {
    // Insert test locations
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

    const result = await localDB.userLocations.selectAll(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data).toHaveLength(2)
    expect(result.data?.[0]?.name).toBe('Location 1')
    expect(result.data?.[1]?.name).toBe('Location 2')
  })

  it('should find default location', async () => {
    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Default Location',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: true
    })

    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Non-default Location',
      latitude: 41.8781,
      longitude: -87.6298,
      elevation: 20,
      is_default: false
    })

    const result = await localDB.userLocations.getDefault(testUserId)
    
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.name).toBe('Default Location')
    expect(result.data?.is_default).toBe(true)
  })

  it('should update location and modify updated_at timestamp', async () => {
    const insertResult = await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Original Name',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: false
    })

    const locationId = insertResult.data?.id
    const originalUpdatedAt = insertResult.data?.updated_at
    
    expect(locationId).toBeDefined()

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))

    const updateResult = await localDB.userLocations.update(locationId, {
      name: 'Updated Name',
      elevation: 15
    })

    expect(updateResult.error).toBeNull()
    expect(updateResult.data?.updated_at).toBeDefined()
    expect(updateResult.data?.updated_at).not.toBe(originalUpdatedAt)

    // Verify the update persisted
    const allLocations = await localDB.userLocations.selectAll(testUserId)
    const updatedLocation = allLocations.data?.find(loc => loc.id === locationId)
    expect(updatedLocation?.name).toBe('Updated Name')
    expect(updatedLocation?.elevation).toBe(15)
  })

  it('should delete a location', async () => {
    const insertResult = await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'To Be Deleted',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: false
    })

    const locationId = insertResult.data?.id
    expect(locationId).toBeDefined()
    
    const deleteResult = await localDB.userLocations.delete(locationId!)
    expect(deleteResult.error).toBeNull()

    // Verify deletion
    const allLocations = await localDB.userLocations.selectAll(testUserId)
    expect(allLocations.data).toHaveLength(0)
  })

  it('should set new default location and unset others', async () => {
    await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Location 1',
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10,
      is_default: true
    })

    const location2 = await localDB.userLocations.insert({
      user_id: testUserId,
      name: 'Location 2',
      latitude: 41.8781,
      longitude: -87.6298,
      elevation: 20,
      is_default: false
    })

    const location2Id = location2.data?.id
    expect(location2Id).toBeDefined()

    // Set location 2 as default
    const setDefaultResult = await localDB.userLocations.setDefault(testUserId, location2Id!)
    expect(setDefaultResult.error).toBeNull()

    // Verify only location 2 is default
    const allLocations = await localDB.userLocations.selectAll(testUserId)
    const loc1 = allLocations.data?.find(loc => loc.name === 'Location 1')
    const loc2 = allLocations.data?.find(loc => loc.name === 'Location 2')
    
    expect(loc1?.is_default).toBe(false)
    expect(loc2?.is_default).toBe(true)
  })
})
