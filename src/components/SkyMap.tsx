import { useEffect, useRef, useState } from 'react';
import { MoonPosition } from '../lib/astronomy';
import { FlightPosition } from '../lib/flights';

interface SkyMapProps {
  moonPosition: MoonPosition;
  flights: FlightPosition[];
}

export function SkyMap({ moonPosition, flights }: SkyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    for (let i = 1; i <= 3; i++) {
      const r = (radius / 3) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    for (let i = 0; i < 360; i += 30) {
      const angle = (i - 90) * Math.PI / 180;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const directions = [
      { label: 'N', angle: 0 },
      { label: 'E', angle: 90 },
      { label: 'S', angle: 180 },
      { label: 'W', angle: 270 }
    ];

    directions.forEach(({ label, angle }) => {
      const rad = (angle - 90) * Math.PI / 180;
      const x = centerX + (radius + 15) * Math.cos(rad);
      const y = centerY + (radius + 15) * Math.sin(rad);
      ctx.fillText(label, x, y);
    });

    if (moonPosition.altitude > 0) {
      const altFactor = 1 - (moonPosition.altitude / 90);
      const moonRadius = altFactor * radius;
      const moonAngle = (moonPosition.azimuth - 90) * Math.PI / 180;
      const moonX = centerX + moonRadius * Math.cos(moonAngle);
      const moonY = centerY + moonRadius * Math.sin(moonAngle);

      const gradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 12);
      gradient.addColorStop(0, '#fef3c7');
      gradient.addColorStop(0.5, '#fde047');
      gradient.addColorStop(1, '#facc15');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 12, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MOON', moonX, moonY - 18);
    }

    flights.forEach(flightPos => {
      if (flightPos.altitude > 0) {
        const altFactor = 1 - (flightPos.altitude / 90);
        const flightRadius = altFactor * radius;
        const flightAngle = (flightPos.azimuth - 90) * Math.PI / 180;
        const flightX = centerX + flightRadius * Math.cos(flightAngle);
        const flightY = centerY + flightRadius * Math.sin(flightAngle);

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(flightX, flightY, 4, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (flightPos.flight.callsign) {
          ctx.fillStyle = '#93c5fd';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(flightPos.flight.callsign.trim(), flightX + 6, flightY);
        }
      }
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Center = Zenith (90°)', 10, height - 10);

  }, [moonPosition, flights]);

  return (
    <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-lg font-semibold">Sky Map</h3>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded border border-slate-600 hover:border-slate-500 transition-colors"
        >
          {showHelp ? 'Hide Help' : 'How to Read'}
        </button>
      </div>

      {showHelp && (
        <div className="mb-4 p-3 bg-slate-700 rounded-lg text-sm text-slate-300 space-y-2">
          <h4 className="text-slate-100 font-semibold mb-2">How to Read the Sky Map</h4>
          
          <div className="space-y-2">
            <div>
              <strong className="text-slate-200">Center:</strong> Represents the zenith (directly overhead, 90° altitude)
            </div>
            
            <div>
              <strong className="text-slate-200">Concentric Circles:</strong> Show altitude angles
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• Outer ring: 30° above horizon</li>
                <li>• Middle ring: 60° above horizon</li>
                <li>• Inner ring: 90° (zenith)</li>
              </ul>
            </div>
            
            <div>
              <strong className="text-slate-200">Compass Directions:</strong> N (North), E (East), S (South), W (West) around the edge
            </div>
            
            <div>
              <strong className="text-slate-200">Objects:</strong>
              <ul className="ml-4 mt-1 space-y-1 text-xs">
                <li>• <span className="text-yellow-400">Yellow circle</span>: Moon position</li>
                <li>• <span className="text-blue-400">Blue dots</span>: Aircraft positions</li>
              </ul>
            </div>
            
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-600">
              <strong>Tip:</strong> The closer an object is to the center, the higher it appears in the sky. Objects near the edge are close to the horizon.
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full max-w-md mx-auto"
      />
      
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span>Moon</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Aircraft</span>
        </div>
      </div>
    </div>
  );
}
