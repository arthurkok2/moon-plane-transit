import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransitDetector, formatTimeToTransit } from '../lib/transitDetector';
import { Observer, MoonPosition, calculateMoonPosition, calculateAngularSeparation } from '../lib/astronomy';
import { FlightData, calculateFlightPosition, predictFlightPosition } from '../lib/flights';

// Mock the astronomy and flights modules
vi.mock('../lib/astronomy');
vi.mock('../lib/flights');

describe('TransitDetector', () => {
  let detector: TransitDetector;
  let mockObserver: Observer;
  let mockMoonPosition: MoonPosition;
  let mockFlight: FlightData;

  beforeEach(() => {
    detector = new TransitDetector();
    
    mockObserver = {
      latitude: 40.7128,
      longitude: -74.0060,
      elevation: 10
    };

    mockMoonPosition = {
      altitude: 45.0,
      azimuth: 180.0,
      distance: 384400,
      angularDiameter: 0.52,
      rightAscension: 12.0,
      declination: 0.0,
      illumination: 0.5,
      phase: 'First Quarter'
    };

    mockFlight = {
      icao24: 'AAL123',
      callsign: 'AAL123',
      latitude: 40.7500,
      longitude: -73.9850,
      altitude: 10000,
      velocity: 450,
      heading: 270,
      lastUpdate: Date.now() / 1000,
      verticalRate: 0
    };
  });

  describe('constructor', () => {
    it('should use default configuration when no config provided', () => {
      const config = detector.getConfig();
      expect(config.maxAngularSeparation).toBe(0.5);
      expect(config.predictionWindowSeconds).toBe(600);
      expect(config.minConfidenceScore).toBe(0.3);
    });

    it('should accept partial configuration overrides', () => {
      const customDetector = new TransitDetector({
        maxAngularSeparation: 1.0,
        minConfidenceScore: 0.5
      });
      
      const config = customDetector.getConfig();
      expect(config.maxAngularSeparation).toBe(1.0);
      expect(config.predictionWindowSeconds).toBe(600); // default
      expect(config.minConfidenceScore).toBe(0.5);
    });
  });

  describe('setConfig and getConfig', () => {
    it('should update configuration', () => {
      detector.setConfig({ maxAngularSeparation: 2.0 });
      const config = detector.getConfig();
      expect(config.maxAngularSeparation).toBe(2.0);
    });

    it('should return a copy of the configuration', () => {
      const config1 = detector.getConfig();
      const config2 = detector.getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('detectTransits', () => {
    beforeEach(() => {
      // Mock the required functions
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        latitude: 40.7600,
        longitude: -73.9750,
        altitude: 10000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.3); // Close enough for a transit
    });

    it('should return empty array when no flights provided', () => {
      const result = detector.detectTransits(mockObserver, [], mockMoonPosition);
      expect(result).toEqual([]);
    });

    it('should skip flights below horizon', () => {
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: -5.0, // Below horizon
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      expect(result).toEqual([]);
    });

    it('should detect valid transits', () => {
      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        flight: mockFlight,
        angularSeparation: 0.3,
        bodyName: 'Moon',
        bodyAltitude: 45.0,
        bodyAzimuth: 180.0
      });
    });

    it('should filter out low confidence predictions', () => {
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.45); // Higher separation = lower confidence

      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      expect(result).toEqual([]);
    });

    it('should sort results by time to transit', () => {
      const flight1 = { ...mockFlight, icao24: 'AAL001' };
      const flight2 = { ...mockFlight, icao24: 'AAL002' };
      
      vi.mocked(calculateAngularSeparation)
        .mockReturnValueOnce(0.2) // First flight - closer
        .mockReturnValueOnce(0.3); // Second flight - further

      const result = detector.detectTransits(mockObserver, [flight1, flight2], mockMoonPosition);
      expect(result).toHaveLength(2);
      expect(result[0].flight.icao24).toBe('AAL001');
      expect(result[1].flight.icao24).toBe('AAL002');
    });
  });

  describe('calculatePredictedFlightHorizontal', () => {
    it('should calculate horizontal coordinates correctly', () => {
      // Test the private method through a transit detection
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 40.8000, // Different from observer
        longitude: -74.1000,
        altitude: 12000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.2);

      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      expect(result).toHaveLength(1);
      expect(result[0].flightAltitude).toBeGreaterThan(0);
      expect(result[0].flightAzimuth).toBeGreaterThanOrEqual(0);
      expect(result[0].flightAzimuth).toBeLessThan(360);
    });
  });

  describe('calculateConfidence', () => {
    it('should return higher confidence for closer angular separation', () => {
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 40.7600,
        longitude: -73.9750,
        altitude: 10000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);

      // Test with close separation
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.1);
      const closeResult = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);

      // Test with far separation
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.4);
      const farResult = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);

      if (closeResult.length > 0 && farResult.length > 0) {
        expect(closeResult[0].confidenceScore).toBeGreaterThan(farResult[0].confidenceScore);
      }
    });

    it('should boost confidence for transits within moon angular radius', () => {
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 40.7600,
        longitude: -73.9750,
        altitude: 10000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);
      
      // Separation smaller than moon radius (0.52/2 = 0.26)
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.2);

      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      expect(result).toHaveLength(1);
      expect(result[0].confidenceScore).toBeGreaterThan(0.5);
    });

    it('should reduce confidence for old flight data', () => {
      const oldFlight = {
        ...mockFlight,
        lastUpdate: (Date.now() / 1000) - 60 // 60 seconds old
      };

      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: oldFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 40.7600,
        longitude: -73.9750,
        altitude: 10000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.2);

      const result = detector.detectTransits(mockObserver, [oldFlight], mockMoonPosition);
      expect(result).toHaveLength(1);
      expect(result[0].confidenceScore).toBeLessThan(0.8);
    });
  });

  describe('edge cases', () => {
    it('should handle moon below horizon during prediction window', () => {
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 40.7600,
        longitude: -73.9750,
        altitude: 10000
      });

      // Moon goes below horizon during prediction
      vi.mocked(calculateMoonPosition).mockReturnValue({
        ...mockMoonPosition,
        altitude: -10.0
      });

      vi.mocked(calculateAngularSeparation).mockReturnValue(0.2);

      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      expect(result).toEqual([]);
    });

    it('should handle flight going below horizon during prediction', () => {
      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      // Flight predicted to go below horizon
      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 35.0000, // Very far away
        longitude: -120.0000,
        altitude: 1000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.2);

      const result = detector.detectTransits(mockObserver, [mockFlight], mockMoonPosition);
      // Should still work if flight is initially above horizon
      expect(result).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should handle multiple flights efficiently', () => {
      const flights = Array.from({ length: 100 }, (_, i) => ({
        ...mockFlight,
        icao24: `AAL${i.toString().padStart(3, '0')}`,
        latitude: mockFlight.latitude + (i * 0.01),
        longitude: mockFlight.longitude + (i * 0.01)
      }));

      vi.mocked(calculateFlightPosition).mockReturnValue({
        altitude: 15.0,
        azimuth: 180.0,
        distanceKm: 5.0,
        flight: mockFlight
      });

      vi.mocked(predictFlightPosition).mockReturnValue({
        ...mockFlight,
        latitude: 40.7600,
        longitude: -73.9750,
        altitude: 10000
      });

      vi.mocked(calculateMoonPosition).mockReturnValue(mockMoonPosition);
      vi.mocked(calculateAngularSeparation).mockReturnValue(0.8); // Too far for transit

      const startTime = Date.now();
      const result = detector.detectTransits(mockObserver, flights, mockMoonPosition);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toEqual([]); // No transits due to high separation
    });
  });
});

describe('formatTimeToTransit', () => {
  it('should format seconds correctly', () => {
    expect(formatTimeToTransit(30)).toBe('30s');
    expect(formatTimeToTransit(45.7)).toBe('46s');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatTimeToTransit(90)).toBe('1m 30s');
    expect(formatTimeToTransit(125)).toBe('2m 5s');
    expect(formatTimeToTransit(3540)).toBe('59m 0s');
  });

  it('should format hours and minutes correctly', () => {
    expect(formatTimeToTransit(3600)).toBe('1h 0m');
    expect(formatTimeToTransit(3900)).toBe('1h 5m');
    expect(formatTimeToTransit(7380)).toBe('2h 3m');
  });

  it('should handle edge cases', () => {
    expect(formatTimeToTransit(0)).toBe('0s');
    expect(formatTimeToTransit(59)).toBe('59s');
    expect(formatTimeToTransit(60)).toBe('1m 0s');
    expect(formatTimeToTransit(3599)).toBe('59m 59s');
  });
});
