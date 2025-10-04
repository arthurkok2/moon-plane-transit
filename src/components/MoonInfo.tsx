import { Moon, Compass, Sunrise, Sunset } from 'lucide-react';
import { MoonPosition, Observer, getMoonRiseSetTimes } from '../lib/astronomy';

interface MoonInfoProps {
  moonPosition: MoonPosition;
  observer: Observer | null;
}

export function MoonInfo({ moonPosition, observer }: MoonInfoProps) {
  // Calculate moon rise/set times
  const riseSetTimes = observer ? getMoonRiseSetTimes(observer) : null;

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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

      {/* Moon Rise/Set Times */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
              <Sunrise className="w-4 h-4" />
              Moonrise
            </div>
            <div className="text-white text-lg font-medium">
              {riseSetTimes?.alwaysUp ? 'Always up' : 
               riseSetTimes?.alwaysDown ? 'Always down' :
               formatTime(riseSetTimes?.moonrise || null)}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-sm mb-1 flex items-center gap-1">
              <Sunset className="w-4 h-4" />
              Moonset
            </div>
            <div className="text-white text-lg font-medium">
              {riseSetTimes?.alwaysUp ? 'Always up' : 
               riseSetTimes?.alwaysDown ? 'Always down' :
               formatTime(riseSetTimes?.moonset || null)}
            </div>
          </div>
        </div>
        
        <div className="text-slate-400 text-xs">
          Distance: {moonPosition.distance.toFixed(0)} km
        </div>
      </div>
    </div>
  );
}
