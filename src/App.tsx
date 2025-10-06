import { useState, useEffect } from 'react';
import { MapPin, Satellite, AlertCircle, Loader2 } from 'lucide-react';
import { MoonInfo } from './components/MoonInfo';
import { SunInfo } from './components/SunInfo';
import { SkyMap } from './components/SkyMap';
import { HorizonView } from './components/HorizonView';
import { TransitList } from './components/TransitList';
import { FlightList } from './components/FlightList';
import { CameraAssistant } from './components/CameraAssistant';
import { DataSourceSelector } from './components/DataSourceSelector';
import { useGeolocation } from './hooks/useGeolocation';
import { useMoonTracking } from './hooks/useMoonTracking';
import { useSunTracking } from './hooks/useSunTracking';
import { useFlightTracking } from './hooks/useFlightTracking';
import { useDataSource } from './hooks/useDataSource';
import { TransitDetector, TransitPrediction } from './lib/transitDetector';
import { DATA_SOURCES } from './lib/flights';
import useMockFlight from './hooks/useMockFlight';

function App() {
  const { observer, error: locationError, loading: locationLoading } = useGeolocation();
  const moonPosition = useMoonTracking(observer);
  const sunPosition = useSunTracking(observer);
  const [bodyMode, setBodyMode] = useState<'moon' | 'sun'>(() => {
    try { return (localStorage.getItem('transitBodyMode') as 'moon'|'sun') || 'moon'; } catch { return 'moon'; }
  });
  useEffect(() => { try { localStorage.setItem('transitBodyMode', bodyMode); } catch { /* ignore persistence errors */ } }, [bodyMode]);
  const { dataSource, setDataSource } = useDataSource();
  const { flights, flightPositions, error: flightError, loading: flightLoading, lastUpdate } = useFlightTracking(observer, 50, dataSource);
  const [mockMode, setMockMode] = useState(false);

  const [transits, setTransits] = useState<TransitPrediction[]>([]);
  const [selectedTransit, setSelectedTransit] = useState<TransitPrediction | null>(null);
  const [detector] = useState(() => new TransitDetector());

  // Use mock flights if mockMode is enabled (moved to hook)
  const mock = useMockFlight(observer, bodyMode, moonPosition, sunPosition, mockMode);
  const activeFlights = mockMode ? mock.data : flights;
  const activeFlightPositions = mockMode ? mock.positions : flightPositions;

  useEffect(() => {
    if (!observer || activeFlights.length === 0) { setTransits([]); return; }
    if (bodyMode === 'moon') {
      if (moonPosition) setTransits(detector.detectMoonTransits(observer, activeFlights, moonPosition));
      else setTransits([]);
    } else {
      if (sunPosition) setTransits(detector.detectSunTransits(observer, activeFlights, sunPosition));
      else setTransits([]);
    }
  }, [observer, activeFlights, bodyMode, moonPosition, sunPosition, detector, mockMode]);

  useEffect(() => {
    if (!selectedTransit || selectedTransit.bodyName.toLowerCase() !== bodyMode) {
      setSelectedTransit(transits[0] || null);
    }
  }, [bodyMode, transits, selectedTransit]);

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

  if (!observer) {
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

        {/* Transit Body Selector Row (moved to top) */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <div className="text-sm text-slate-400">Transit Body:</div>
          <div className="flex gap-2">
            {(['moon','sun'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setBodyMode(mode)}
                aria-pressed={bodyMode === mode}
                className={`px-3 py-1 rounded text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:ring-offset-slate-900 ${bodyMode===mode? 'bg-blue-600 border-blue-500 text-white':'border-slate-600 text-slate-300 hover:border-slate-400'}`}
              >
                {mode.charAt(0).toUpperCase()+mode.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Mock Flights</span>
            <button
              onClick={() => setMockMode(m => !m)}
              aria-pressed={mockMode}
              className={`px-3 py-1 rounded text-sm border transition-colors ${mockMode ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}
            >{mockMode ? 'On' : 'Off'}</button>
          </div>
        </div>
        {/* Data Source Selector Row */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <DataSourceSelector 
            selectedSource={dataSource}
            onSourceChange={setDataSource}
          />
        </div>

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
              <div>Aircraft tracked: {mockMode ? activeFlights.length : flights.length}</div>
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
              <h3 className="text-white font-semibold">{bodyMode === 'moon' ? 'Moon' : 'Sun'} Visibility</h3>
            </div>
            <div className="text-slate-300 text-sm">
              {bodyMode === 'moon' ? (
                moonPosition && moonPosition.altitude > 0 ? (
                  <>
                    <div className="text-green-400 font-medium">Moon is visible</div>
                    <div>{moonPosition.phase}</div>
                  </>
                ) : <div className="text-orange-400 font-medium">Moon below horizon</div>
              ) : (
                sunPosition && sunPosition.altitude > 0 ? (
                  <div className="text-amber-300 font-medium">Sun is above horizon</div>
                ) : <div className="text-orange-400 font-medium">Sun below horizon</div>
              )}
            </div>
          </div>
        </div>

        {bodyMode==='moon' && moonPosition && moonPosition.altitude <= 0 && (
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
        {bodyMode==='sun' && sunPosition && sunPosition.altitude <= 0 && (
          <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">Sun Not Visible</h3>
                <p className="text-orange-200 text-sm">
                  The sun is currently below the horizon at your location.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            {bodyMode==='moon' && moonPosition && <MoonInfo moonPosition={moonPosition} observer={observer} />}
            {bodyMode==='sun' && sunPosition && <SunInfo sunPosition={sunPosition} observer={observer} />}
            {(bodyMode==='moon' && moonPosition) && <HorizonView bodyPosition={moonPosition} bodyName='Moon' flights={activeFlightPositions} />}
            {(bodyMode==='sun' && sunPosition) && <HorizonView bodyPosition={sunPosition} bodyName='Sun' flights={activeFlightPositions} />}
            {(bodyMode==='moon' && moonPosition) && <SkyMap bodyPosition={moonPosition} bodyName='Moon' flights={activeFlightPositions} />}
            {(bodyMode==='sun' && sunPosition) && <SkyMap bodyPosition={sunPosition} bodyName='Sun' flights={activeFlightPositions} />}            
          </div>

          <div className="space-y-6">
            <TransitList 
              transits={transits} 
              onSelectTransit={setSelectedTransit} 
              title='Transit Predictions'
              showSafetyNote={bodyMode==='sun'}
              bodyName={bodyMode==='moon' ? 'Moon' : 'Sun'}
            />
            {selectedTransit && (
              <CameraAssistant transit={selectedTransit} />
            )}
            <FlightList 
              flights={activeFlights} 
              flightPositions={activeFlightPositions}
              loading={mockMode ? false : flightLoading}
              error={mockMode ? null : flightError}
              lastUpdate={mockMode ? new Date() : lastUpdate}
              dataSource={dataSource}
            />
          </div>

          <div className="space-y-6">

          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400 text-sm">
          <p>
            Flight data: <span className="text-slate-300 font-medium">{DATA_SOURCES[dataSource].name}</span>. Celestial calculations: <span className="text-slate-300 font-medium">Astronomy Engine</span>.
          </p>
          <p className="mt-2">
            Available data sources: <span className="text-slate-300">ADSB.One</span> • <span className="text-slate-300">OpenSky Network</span>
          </p>
          <p className="mt-2 text-xs text-orange-300">Safety: Use certified solar filters when attempting Sun transit photography.</p>
          <p className="mt-2">For best results, use a telephoto lens and start shooting before the predicted transit time.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
