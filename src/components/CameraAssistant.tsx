import { Camera, Compass, TrendingUp, Clock } from 'lucide-react';
import { TransitPrediction, formatTimeToTransit } from '../lib/transitDetector';
import { useEffect, useState } from 'react';

interface CameraAssistantProps {
  transit: TransitPrediction;
}

export function CameraAssistant({ transit }: CameraAssistantProps) {
  const [countdown, setCountdown] = useState(transit.timeToTransit);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const remaining = (transit.transitTime.getTime() - now.getTime()) / 1000;
      setCountdown(Math.max(0, remaining));
    }, 100);

    return () => clearInterval(interval);
  }, [transit.transitTime]);

  const getDirectionName = (azimuth: number): string => {
    const directions = [
      'North', 'NNE', 'NE', 'ENE',
      'East', 'ESE', 'SE', 'SSE',
      'South', 'SSW', 'SW', 'WSW',
      'West', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  const isImminent = countdown < 60;

  return (
    <div className={`bg-slate-800 rounded-xl p-6 shadow-lg border-2 transition-colors ${
      isImminent ? 'border-red-500 animate-pulse' : 'border-slate-700'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <Camera className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Camera Assistant</h2>
      </div>

      <div className="bg-slate-900 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-slate-400 text-sm mb-1">Time to Transit</div>
          <div className={`text-4xl font-bold mb-2 ${
            isImminent ? 'text-red-400' : 'text-white'
          }`}>
            {formatTimeToTransit(countdown)}
          </div>
          <div className="text-slate-500 text-sm">
            {transit.transitTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">Point Your Camera</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-slate-400 text-sm mb-1">Azimuth ({transit.bodyName})</div>
              <div className="text-white text-2xl font-bold">
                {transit.bodyAzimuth.toFixed(1)}°
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {getDirectionName(transit.bodyAzimuth)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Altitude</div>
              <div className="text-white text-2xl font-bold">
                {transit.bodyAltitude.toFixed(1)}°
              </div>
              <div className="text-slate-500 text-xs mt-1">
                above horizon
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-white font-semibold">Transit Details</h3>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Aircraft</span>
              <span className="text-white font-medium">
                {transit.flight.callsign || transit.flight.icao24}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude</span>
              <span className="text-white font-medium">
                {transit.flight.altitude.toFixed(0)} m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Angular Separation</span>
              <span className="text-white font-medium">
                {transit.angularSeparation.toFixed(3)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Confidence</span>
              <span className={`font-medium ${
                transit.confidenceScore >= 0.7 ? 'text-green-400' :
                transit.confidenceScore >= 0.5 ? 'text-yellow-400' :
                'text-orange-400'
              }`}>
                {(transit.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <div className="font-semibold mb-1">Photography Tips</div>
              <ul className="space-y-1 text-blue-300/80">
                <li>• Use a telephoto lens (200mm+) for best results</li>
                <li>• Set camera to burst mode for multiple shots</li>
                <li>• Use manual focus on the moon</li>
                <li>• Start shooting 5-10 seconds before predicted time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
