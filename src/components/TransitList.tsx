import { useState } from 'react';
import { Clock, Plane, Gauge } from 'lucide-react';
import { TransitPrediction, formatTimeToTransit } from '../lib/transitDetector';

interface TransitListProps {
  transits: TransitPrediction[];
  onSelectTransit?: (transit: TransitPrediction) => void;
}

export function TransitList({ transits, onSelectTransit }: TransitListProps) {
  const [showHelp, setShowHelp] = useState(false);

  if (transits.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Transit Predictions</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
          >
            {showHelp ? 'Hide Help' : 'Algorithm Details'}
          </button>
        </div>

        {showHelp && (
          <div className="mb-4 p-3 bg-slate-700 rounded-lg text-sm text-slate-300 space-y-3">
            <h4 className="text-slate-100 font-semibold mb-2">Transit Detection Algorithm</h4>
            
            <div className="space-y-3">
              <div>
                <strong className="text-slate-200">1. Flight Position Calculation:</strong>
                <p className="text-xs mt-1">Each aircraft's position is converted to horizontal coordinates (altitude & azimuth) relative to your location using spherical trigonometry.</p>
              </div>
              
              <div>
                <strong className="text-slate-200">2. Moon Position Tracking:</strong>
                <p className="text-xs mt-1">Moon's precise position is calculated using astronomical algorithms accounting for your exact location and time.</p>
              </div>
              
              <div>
                <strong className="text-slate-200">3. Angular Separation:</strong>
                <p className="text-xs mt-1">The angular distance between each aircraft and the moon is calculated. Transits occur when this distance is less than 5° (configurable threshold).</p>
              </div>
              
              <div>
                <strong className="text-slate-200">4. Predictive Modeling:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Aircraft trajectory is extrapolated based on current velocity and heading</li>
                  <li>• Moon's motion is predicted using orbital mechanics</li>
                  <li>• Algorithm checks 300 seconds ahead in 30-second intervals</li>
                </ul>
              </div>
              
              <div>
                <strong className="text-slate-200">5. Confidence Scoring:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Closer angular separation = higher confidence</li>
                  <li>• Higher altitude objects = better visibility</li>
                  <li>• Recent flight data = more reliable prediction</li>
                  <li>• Transits within moon's angular diameter (0.5°) get bonus confidence</li>
                </ul>
              </div>
              
              <div>
                <strong className="text-slate-200">6. Filtering & Ranking:</strong>
                <ul className="ml-4 mt-1 space-y-1 text-xs">
                  <li>• Only predictions above minimum confidence threshold (30%) are shown</li>
                  <li>• Results sorted by time to transit (nearest first)</li>
                  <li>• Objects below 10° altitude are filtered out (poor visibility)</li>
                </ul>
              </div>
              
              <div className="text-xs text-slate-400 pt-2 border-t border-slate-600">
                <strong>Note:</strong> The algorithm accounts for Earth's curvature, atmospheric refraction, and the relative motion of both the aircraft and moon. Accuracy depends on real-time flight data quality and atmospheric conditions.
              </div>
            </div>
          </div>
        )}

        <div className="text-center py-8">
          <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No transits detected</p>
          <p className="text-slate-500 text-sm mt-2">
            Check back in a few moments as aircraft positions update
          </p>
        </div>
      </div>
    );
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          Transit Predictions ({transits.length})
        </h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
        >
          {showHelp ? 'Hide Help' : 'Algorithm Details'}
        </button>
      </div>

      {showHelp && (
        <div className="mb-4 p-3 bg-slate-700 rounded-lg text-sm text-slate-300 space-y-3">
          <h4 className="text-slate-100 font-semibold mb-2">Transit Detection Algorithm</h4>
          
          <div className="space-y-3">
            <div>
              <strong className="text-slate-200">1. Flight Position Calculation:</strong>
              <p className="text-xs mt-1">Each aircraft's position is converted to horizontal coordinates (altitude & azimuth) relative to your location using spherical trigonometry.</p>
            </div>
            
            <div>
              <strong className="text-slate-200">2. Moon Position Tracking:</strong>
              <p className="text-xs mt-1">Moon's precise position is calculated using astronomical algorithms accounting for your exact location and time.</p>
            </div>
            
            <div>
              <strong className="text-slate-200">3. Angular Separation:</strong>
              <p className="text-xs mt-1">The angular distance between each aircraft and the moon is calculated. Transits occur when this distance is less than 5° (configurable threshold).</p>
            </div>
            
            <div>
              <strong className="text-slate-200">4. Predictive Modeling:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Aircraft trajectory is extrapolated based on current velocity and heading</li>
                <li>• Moon's motion is predicted using orbital mechanics</li>
                <li>• Algorithm checks 300 seconds ahead in 30-second intervals</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-slate-200">5. Confidence Scoring:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Closer angular separation = higher confidence</li>
                <li>• Higher altitude objects = better visibility</li>
                <li>• Recent flight data = more reliable prediction</li>
                <li>• Transits within moon's angular diameter (0.5°) get bonus confidence</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-slate-200">6. Filtering & Ranking:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Only predictions above minimum confidence threshold (30%) are shown</li>
                <li>• Results sorted by time to transit (nearest first)</li>
                <li>• Objects below 10° altitude are filtered out (poor visibility)</li>
              </ul>
            </div>
            
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-600">
              <strong>Note:</strong> The algorithm accounts for Earth's curvature, atmospheric refraction, and the relative motion of both the aircraft and moon. Accuracy depends on real-time flight data quality and atmospheric conditions.
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {transits.map((transit, index) => (
          <div
            key={index}
            onClick={() => onSelectTransit?.(transit)}
            className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-400" />
                <span className="text-white font-semibold">
                  {transit.flight.callsign || transit.flight.icao24}
                </span>
              </div>
              <div className={`text-sm font-medium ${getConfidenceColor(transit.confidenceScore)}`}>
                {getConfidenceLabel(transit.confidenceScore)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{formatTimeToTransit(transit.timeToTransit)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Gauge className="w-4 h-4" />
                <span>{transit.angularSeparation.toFixed(3)}° sep</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Transit at {transit.transitTime.toLocaleTimeString()}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
              <div>Alt: {transit.flight.altitude.toFixed(0)}m | Speed: {(transit.flight.velocity * 3.6).toFixed(0)} km/h</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
