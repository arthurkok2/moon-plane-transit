import { Satellite, Radio, Info } from 'lucide-react';
import { ADSBDataSource, DATA_SOURCES, DataSourceInfo } from '../lib/flights';

interface DataSourceSelectorProps {
  selectedSource: ADSBDataSource;
  onSourceChange: (source: ADSBDataSource) => void;
}

export function DataSourceSelector({ selectedSource, onSourceChange }: DataSourceSelectorProps) {
  // Ensure ADSB.One appears first
  const sources = [
    DATA_SOURCES[ADSBDataSource.ADSB_ONE],
    DATA_SOURCES[ADSBDataSource.OPENSKY]
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold">ADS-B Data Source</h3>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <SourceOption
            key={source.id}
            source={source}
            isSelected={selectedSource === source.id}
            onSelect={() => onSourceChange(source.id)}
          />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-600">
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="mb-1">
              <strong className="text-slate-300">Current:</strong> {DATA_SOURCES[selectedSource].name}
            </p>
            <p className="mb-1">
              <strong className="text-slate-300">Rate Limit:</strong> {DATA_SOURCES[selectedSource].rateLimit}
            </p>
            <p className="mb-1">
              <strong className="text-slate-300">Update Frequency:</strong> {DATA_SOURCES[selectedSource].updateInterval / 1000}s
            </p>
            <p>
              <strong className="text-slate-300">Max Radius:</strong> {DATA_SOURCES[selectedSource].maxRadius}km
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SourceOptionProps {
  source: DataSourceInfo;
  isSelected: boolean;
  onSelect: () => void;
}

function SourceOption({ source, isSelected, onSelect }: SourceOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-purple-900/30 border-purple-500/50 text-white'
          : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Satellite className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
          <span className="font-medium">{source.name}</span>
        </div>
        {isSelected && (
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
        )}
      </div>
      <p className={`text-xs mt-1 ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
        {source.description}
      </p>
      <div className="flex gap-4 mt-2 text-xs">
        <span className={isSelected ? 'text-purple-300' : 'text-slate-500'}>
          {source.rateLimit}
        </span>
        <span className={isSelected ? 'text-purple-300' : 'text-slate-500'}>
          Updates: {source.updateInterval / 1000}s
        </span>
        <span className={isSelected ? 'text-purple-300' : 'text-slate-500'}>
          Max: {source.maxRadius}km
        </span>
      </div>
    </button>
  );
}