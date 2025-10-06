import { Observer, MoonPosition, SunPosition, calculateMoonPosition, calculateSunPosition, calculateAngularSeparation } from './astronomy';
import { FlightData, FlightPosition, calculateFlightPosition, predictFlightPosition } from './flights';

export interface TransitPrediction {
  flight: FlightData;
  transitTime: Date;
  angularSeparation: number;
  confidenceScore: number;
  bodyName: 'Moon' | 'Sun';
  bodyAltitude: number;
  bodyAzimuth: number;
  flightAltitude: number;
  flightAzimuth: number;
  timeToTransit: number;
}

export interface TransitDetectorConfig {
  maxAngularSeparation: number;
  predictionWindowSeconds: number;
  minConfidenceScore: number;
}

const DEFAULT_CONFIG: TransitDetectorConfig = {
  maxAngularSeparation: 0.5,
  predictionWindowSeconds: 600,
  minConfidenceScore: 0.3
};

export class TransitDetector {
  private config: TransitDetectorConfig;

  constructor(config?: Partial<TransitDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  detectTransits(
    observer: Observer,
    flights: FlightData[],
    moonPosition: MoonPosition,
    currentTime: Date = new Date()
  ): TransitPrediction[] {
    // Backward compatible Moon-only pathway
    return this.detectBodyTransits('Moon', observer, flights, moonPosition, currentTime);
  }

  detectMoonTransits(observer: Observer, flights: FlightData[], moonPosition: MoonPosition, currentTime: Date = new Date()) {
    return this.detectBodyTransits('Moon', observer, flights, moonPosition, currentTime);
  }

  detectSunTransits(observer: Observer, flights: FlightData[], sunPosition: SunPosition, currentTime: Date = new Date()) {
    return this.detectBodyTransits('Sun', observer, flights, sunPosition, currentTime);
  }

  private detectBodyTransits(
    body: 'Moon' | 'Sun',
    observer: Observer,
    flights: FlightData[],
    bodyPosition: MoonPosition | SunPosition,
    currentTime: Date
  ): TransitPrediction[] {
    const predictions: TransitPrediction[] = [];
    for (const flight of flights) {
      const flightPosition = calculateFlightPosition(observer, flight);
      if (flightPosition.altitude < 0) continue;
      const prediction = this.predictTransit(observer, flight, flightPosition, body, bodyPosition, currentTime);
      if (prediction && prediction.confidenceScore >= this.config.minConfidenceScore) predictions.push(prediction);
    }
    predictions.sort((a, b) => a.timeToTransit - b.timeToTransit);
    return predictions;
  }

  private predictTransit(
    observer: Observer,
    flight: FlightData,
    currentFlightPosition: FlightPosition,
    body: 'Moon' | 'Sun',
    bodyPosition: MoonPosition | SunPosition,
    currentTime: Date
  ): TransitPrediction | null {
    let closestSeparation = Infinity;
    let closestTime: Date | null = null;
    let closestFlightAlt = 0;
    let closestFlightAz = 0;

    const timeStep = 5;

    for (let seconds = 0; seconds <= this.config.predictionWindowSeconds; seconds += timeStep) {
      const futureTime = new Date(currentTime.getTime() + seconds * 1000);
      const predictedPosition = predictFlightPosition(flight, seconds);

      const futureBodyPosition = body === 'Moon' ? calculateMoonPosition(observer, futureTime) : calculateSunPosition(observer, futureTime);

      if (futureBodyPosition.altitude < 0) {
        continue;
      }

      const futureFlightPosition = this.calculatePredictedFlightHorizontal(
        observer,
        predictedPosition.latitude,
        predictedPosition.longitude,
        predictedPosition.altitude
      );

      if (futureFlightPosition.altitude < 0) {
        continue;
      }

      const separation = calculateAngularSeparation(
        futureBodyPosition.altitude,
        futureBodyPosition.azimuth,
        futureFlightPosition.altitude,
        futureFlightPosition.azimuth
      );

      if (separation < closestSeparation) {
        closestSeparation = separation;
        closestTime = futureTime;
        closestFlightAlt = futureFlightPosition.altitude;
        closestFlightAz = futureFlightPosition.azimuth;
      }
    }

    if (closestTime === null || closestSeparation > this.config.maxAngularSeparation) {
      return null;
    }

    const confidence = this.calculateConfidence(
      closestSeparation,
      flight,
      bodyPosition as MoonPosition, // for now use moon-specific logic; Sun confidence uses same heuristics
      currentFlightPosition
    );

    const timeToTransit = (closestTime.getTime() - currentTime.getTime()) / 1000;

    const prediction: TransitPrediction = {
      flight,
      transitTime: closestTime,
      angularSeparation: closestSeparation,
      confidenceScore: confidence,
      bodyName: body,
      bodyAltitude: bodyPosition.altitude,
      bodyAzimuth: bodyPosition.azimuth,
      flightAltitude: closestFlightAlt,
      flightAzimuth: closestFlightAz,
      timeToTransit
    };
    return prediction;
  }

  private calculatePredictedFlightHorizontal(
    observer: Observer,
    latitude: number,
    longitude: number,
    altitude: number
  ): { altitude: number; azimuth: number } {
    const R = 6371;

    const lat1 = observer.latitude * Math.PI / 180;
    const lat2 = latitude * Math.PI / 180;
    const deltaLat = (latitude - observer.latitude) * Math.PI / 180;
    const deltaLon = (longitude - observer.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    const azimuth = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

    const altitudeMeters = altitude - observer.elevation;
    const altitudeAngle = Math.atan2(altitudeMeters, distanceKm * 1000) * 180 / Math.PI;

    return {
      altitude: altitudeAngle,
      azimuth
    };
  }

  private calculateConfidence(
    angularSeparation: number,
    flight: FlightData,
    moonPosition: MoonPosition,
    flightPosition: FlightPosition
  ): number {
    let confidence = 1.0;

    const separationFactor = 1 - (angularSeparation / this.config.maxAngularSeparation);
    confidence *= separationFactor;

    const moonAngularRadius = moonPosition.angularDiameter / 2;
    if (angularSeparation <= moonAngularRadius) {
      confidence *= 1.2;
    }

    if (flight.velocity > 0 && flight.velocity < 1000) {
      confidence *= 1.0;
    } else {
      confidence *= 0.8;
    }

    const dataAge = (Date.now() / 1000) - flight.lastUpdate;
    if (dataAge < 10) {
      confidence *= 1.0;
    } else if (dataAge < 30) {
      confidence *= 0.9;
    } else {
      confidence *= 0.7;
    }

    if (flightPosition.altitude > 10) {
      confidence *= 1.1;
    } else if (flightPosition.altitude > 5) {
      confidence *= 1.0;
    } else {
      confidence *= 0.8;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  setConfig(config: Partial<TransitDetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TransitDetectorConfig {
    return { ...this.config };
  }
}

export function formatTimeToTransit(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
