import { useState, useEffect } from 'react';
import { MapPin, Satellite, AlertCircle, Loader2 } from 'lucide-react';
import { MoonInfo } from './components/MoonInfo';
import { SkyMap } from './components/SkyMap';
import { HorizonView } from './components/HorizonView';
import { TransitList } from './components/TransitList';
import { CameraAssistant } from './components/CameraAssistant';
import { useGeolocation } from './hooks/useGeolocation';
import { useMoonTracking } from './hooks/useMoonTracking';
import { useFlightTracking } from './hooks/useFlightTracking';
import { TransitDetector, TransitPrediction } from './lib/transitDetector';

function App() {
  const { observer, error: locationError, loading: locationLoading } = useGeolocation();
  const moonPosition = useMoonTracking(observer);
  const { flights, flightPositions, error: flightError, loading: flightLoading, lastUpdate } = useFlightTracking(observer);

  const [transits, setTransits] = useState<TransitPrediction[]>([]);
  const [selectedTransit, setSelectedTransit] = useState<TransitPrediction | null>(null);
  const [detector] = useState(() => new TransitDetector());

  useEffect(() => {
    if (!observer || !moonPosition || flights.length === 0) {
      setTransits([]);
      return;
    }

    const detectedTransits = detector.detectTransits(observer, flights, moonPosition);
    setTransits(detectedTransits);

    if (detectedTransits.length > 0 && !selectedTransit) {
      setSelectedTransit(detectedTransits[0]);
    }
  }, [observer, moonPosition, flights, detector, selectedTransit]);

  if (locationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Getting your location...</p>
          <p className="text-slate-400 text-sm mt-2">Please allow location access</p>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold text-center mb-2">Location Required</h2>
          <p className="text-red-200 text-center mb-4">{locationError}</p>
          <p className="text-red-300/80 text-sm text-center">
            This app needs your location to calculate moon and aircraft positions accurately.
          </p>
        </div>
      </div>
    );
  }

  if (!observer || !moonPosition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Satellite className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Moon Transit Tracker
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Track when aircraft will pass in front of the moon from your location
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Your Location</h3>
            </div>
            <div className="text-slate-300 text-sm">
              <div>Lat: {observer.latitude.toFixed(4)}°</div>
              <div>Lon: {observer.longitude.toFixed(4)}°</div>
              <div>Alt: {observer.elevation.toFixed(0)}m</div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Satellite className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Flight Tracking</h3>
            </div>
            <div className="text-slate-300 text-sm">
              <div>Aircraft tracked: {flights.length}</div>
              <div className="flex items-center gap-2">
                {flightLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>
                  {lastUpdate ? `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago` : 'Fetching...'}
                </span>
              </div>
            </div>
            {flightError && (
              <div className="mt-2 text-xs text-orange-400">
                {flightError}
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Moon Visibility</h3>
            </div>
            <div className="text-slate-300 text-sm">
              {moonPosition.altitude > 0 ? (
                <>
                  <div className="text-green-400 font-medium">Moon is visible</div>
                  <div>{moonPosition.phase}</div>
                </>
              ) : (
                <div className="text-orange-400 font-medium">Moon below horizon</div>
              )}
            </div>
          </div>
        </div>

        {moonPosition.altitude <= 0 && (
          <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Moon Not Visible</h3>
                <p className="text-orange-200 text-sm">
                  The moon is currently below the horizon at your location. Transit detection requires the moon to be visible in the sky.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <MoonInfo moonPosition={moonPosition} observer={observer} />
            <SkyMap moonPosition={moonPosition} flights={flightPositions} />
          </div>

          <div className="space-y-6">
            <TransitList transits={transits} onSelectTransit={setSelectedTransit} />
            <HorizonView moonPosition={moonPosition} flights={flightPositions} observer={observer} />
            {selectedTransit && (
              <CameraAssistant transit={selectedTransit} />
            )}
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>Flight data provided by OpenSky Network. Astronomical calculations powered by Astronomy Engine.</p>
          <p className="mt-2">For best results, use a telephoto lens and start shooting before the predicted transit time.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
