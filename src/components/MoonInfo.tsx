import { Moon, Compass } from 'lucide-react';
import { MoonPosition } from '../lib/astronomy';

interface MoonInfoProps {
  moonPosition: MoonPosition;
}

export function MoonInfo({ moonPosition }: MoonInfoProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
      <div className="flex items-center gap-3 mb-4">
        <Moon className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Moon Position</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-slate-400 text-sm mb-1">Altitude</div>
          <div className="text-white text-2xl font-bold">
            {moonPosition.altitude.toFixed(1)}°
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
            <Compass className="w-4 h-4" />
            Azimuth
          </div>
          <div className="text-white text-2xl font-bold">
            {moonPosition.azimuth.toFixed(1)}°
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-sm mb-1">Phase</div>
          <div className="text-white text-lg font-medium">
            {moonPosition.phase}
          </div>
        </div>

        <div>
          <div className="text-slate-400 text-sm mb-1">Illumination</div>
          <div className="text-white text-lg font-medium">
            {(moonPosition.illumination * 100).toFixed(0)}%
          </div>
        </div>

        <div className="col-span-2">
          <div className="text-slate-400 text-sm mb-1">Angular Diameter</div>
          <div className="text-white text-lg font-medium">
            {moonPosition.angularDiameter.toFixed(3)}°
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-slate-400 text-xs">
          Distance: {moonPosition.distance.toFixed(0)} km
        </div>
      </div>
    </div>
  );
}
