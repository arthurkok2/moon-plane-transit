import { Clock, Plane, Gauge } from 'lucide-react';
import { TransitPrediction, formatTimeToTransit } from '../lib/transitDetector';

interface TransitListProps {
  transits: TransitPrediction[];
  onSelectTransit?: (transit: TransitPrediction) => void;
}

export function TransitList({ transits, onSelectTransit }: TransitListProps) {
  if (transits.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">Transit Predictions</h2>
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
      <h2 className="text-xl font-semibold text-white mb-4">
        Transit Predictions ({transits.length})
      </h2>

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
