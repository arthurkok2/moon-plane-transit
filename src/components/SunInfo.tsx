import { Sun, Compass, Sunrise, Sunset } from 'lucide-react';
import { SunPosition, Observer, getSunRiseSetTimes } from '../lib/astronomy';

interface SunInfoProps { sunPosition: SunPosition; observer: Observer | null; }

export function SunInfo({ sunPosition, observer }: SunInfoProps) {
  const riseSet = observer ? getSunRiseSetTimes(observer) : null;
  const formatTime = (d: Date | null) => d ? d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A';
  return (
    <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Sun className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-semibold text-white">Sun Position</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Altitude</div>
          <div className="text-lg font-medium text-slate-100">{sunPosition.altitude.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Azimuth</div>
          <div className="text-lg font-medium text-slate-100">{sunPosition.azimuth.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Angular Size</div>
          <div className="text-lg font-medium text-slate-100">{sunPosition.angularDiameter.toFixed(3)}°</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Distance</div>
          <div className="text-lg font-medium text-slate-100">{(sunPosition.distance/1_000_000).toFixed(2)}M km</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Compass className="w-4 h-4" />
        <span>RA {sunPosition.rightAscension.toFixed(2)}h • Dec {sunPosition.declination.toFixed(2)}°</span>
      </div>
        <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Sunrise className="w-4 h-4"/>Sunrise</div>
            <div className="text-slate-100 font-medium">{riseSet?.alwaysUp ? 'Always up' : riseSet?.alwaysDown ? 'Always down' : formatTime(riseSet?.sunrise||null)}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Sunset className="w-4 h-4"/>Sunset</div>
            <div className="text-slate-100 font-medium">{riseSet?.alwaysUp ? 'Always up' : riseSet?.alwaysDown ? 'Always down' : formatTime(riseSet?.sunset||null)}</div>
          </div>
        </div>
      <p className="mt-4 text-amber-300 text-xs">Never look directly at the Sun without certified solar filtration.</p>
    </div>
  );
}
