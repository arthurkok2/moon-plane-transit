import { useEffect, useRef } from 'react';
import { MoonPosition } from '../lib/astronomy';
import { FlightPosition } from '../lib/flights';

interface HorizonViewProps {
  moonPosition: MoonPosition;
  flights: FlightPosition[];
}

export function HorizonView({ moonPosition, flights }: HorizonViewProps) {
  const horizonCanvasRef = useRef<HTMLCanvasElement>(null);

  // Horizon view effect
  useEffect(() => {
    const canvas = horizonCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const horizonY = height * 0.75; // Horizon line at 75% down

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, '#1e293b'); // Dark blue at top
    skyGradient.addColorStop(1, '#334155'); // Lighter blue at horizon
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    // Ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, horizonY, width, height - horizonY);

    // Horizon line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    // Altitude grid lines (every 15 degrees)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    for (let alt = 15; alt <= 75; alt += 15) {
      const y = horizonY - (alt / 90) * horizonY;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Altitude labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${alt}°`, 5, y - 2);
    }
    
    ctx.setLineDash([]);

    // Calculate moon-centered view
    const moonAzimuth = moonPosition.azimuth;
    const viewRange = 120; // degrees of azimuth to show

    // Draw compass along the bottom
    const compassY = height - 30;
    const compassHeight = 20;
    
    // Compass background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(0, compassY, width, compassHeight);
    
    // Compass border
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, compassY);
    ctx.lineTo(width, compassY);
    ctx.stroke();

    // Draw compass markings
    const startAzimuth = moonAzimuth - viewRange / 2;
    const endAzimuth = moonAzimuth + viewRange / 2;
    
    // Major compass points every 30 degrees
    for (let az = Math.floor(startAzimuth / 30) * 30; az <= endAzimuth; az += 30) {
      let normalizedAz = az;
      while (normalizedAz < 0) normalizedAz += 360;
      while (normalizedAz >= 360) normalizedAz -= 360;
      
      const relativeAz = az - moonAzimuth;
      if (Math.abs(relativeAz) <= viewRange / 2) {
        const x = width / 2 + (relativeAz / viewRange) * width;
        
        // Major tick mark
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, compassY);
        ctx.lineTo(x, compassY + 8);
        ctx.stroke();
        
        // Direction label
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const direction = getCompassDirection(normalizedAz);
        ctx.fillText(direction, x, compassY + 18);
        
        // Azimuth degree label
        ctx.fillStyle = '#64748b';
        ctx.font = '8px sans-serif';
        ctx.fillText(`${normalizedAz}°`, x, compassY - 2);
      }
    }
    
    // Minor compass points every 15 degrees
    for (let az = Math.floor(startAzimuth / 15) * 15; az <= endAzimuth; az += 15) {
      if (az % 30 !== 0) { // Skip major points
        const relativeAz = az - moonAzimuth;
        if (Math.abs(relativeAz) <= viewRange / 2) {
          const x = width / 2 + (relativeAz / viewRange) * width;
          
          // Minor tick mark
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, compassY);
          ctx.lineTo(x, compassY + 4);
          ctx.stroke();
        }
      }
    }
    
    // Center indicator (moon direction)
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, compassY);
    ctx.lineTo(width / 2, compassY + 12);
    ctx.stroke();
    
    // Moon direction arrow
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(width / 2, compassY);
    ctx.lineTo(width / 2 - 4, compassY + 8);
    ctx.lineTo(width / 2 + 4, compassY + 8);
    ctx.closePath();
    ctx.fill();

    // Draw moon if above horizon
    if (moonPosition.altitude > 0) {
      const moonX = width / 2; // Moon is always centered horizontally
      const moonY = horizonY - (moonPosition.altitude / 90) * horizonY;

      // Moon glow
      const glowGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 20);
      glowGradient.addColorStop(0, 'rgba(248, 250, 252, 0.8)');
      glowGradient.addColorStop(0.5, 'rgba(226, 232, 240, 0.4)');
      glowGradient.addColorStop(1, 'rgba(203, 213, 225, 0.0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 20, 0, 2 * Math.PI);
      ctx.fill();

      // Moon body
      const moonGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 10);
      moonGradient.addColorStop(0, '#f8fafc');
      moonGradient.addColorStop(0.5, '#e2e8f0');
      moonGradient.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = moonGradient;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Moon label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MOON', moonX, moonY - 25);
      ctx.fillText(`${moonPosition.altitude.toFixed(1)}°`, moonX, moonY + 20);
    }

    // Draw aircraft
    flights.forEach(flightPos => {
      if (flightPos.altitude > 0) {
        // Calculate relative azimuth to moon direction
        let relativeAzimuth = flightPos.azimuth - moonAzimuth;
        
        // Normalize to [-180, 180]
        while (relativeAzimuth > 180) relativeAzimuth -= 360;
        while (relativeAzimuth < -180) relativeAzimuth += 360;

        // Only show aircraft within view range
        if (Math.abs(relativeAzimuth) <= viewRange / 2) {
          const aircraftX = width / 2 + (relativeAzimuth / viewRange) * width;
          const aircraftY = horizonY - (flightPos.altitude / 90) * horizonY;

          // Aircraft dot
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(aircraftX, aircraftY, 3, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Aircraft callsign and altitude
          if (flightPos.flight.callsign) {
            ctx.fillStyle = '#93c5fd';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(flightPos.flight.callsign.trim(), aircraftX, aircraftY - 8);
            ctx.fillText(`${flightPos.altitude.toFixed(0)}°`, aircraftX, aircraftY + 12);
          }
        }
      }
    });

    // View info (positioned in top right corner)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Facing: ${moonAzimuth.toFixed(0)}° (${getCompassDirection(moonAzimuth)})`, width - 5, 15);
    ctx.fillText(`View: ${viewRange}° azimuth range`, width - 5, 28);

  }, [moonPosition, flights]);

  // Helper function to get compass direction
  const getCompassDirection = (azimuth: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-700">
      <h3 className="text-white text-lg font-semibold mb-3">Horizon View</h3>
      
      <canvas
        ref={horizonCanvasRef}
        width={600}
        height={250}
        className="w-full border border-slate-600 rounded"
      />
      
      <div className="mt-3 space-y-2 text-xs text-slate-400">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Moon</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Aircraft</span>
          </div>
        </div>
        
        <div className="text-center">
          <p>Side view facing the moon's direction • Grid lines show altitude every 15°</p>
          {moonPosition.altitude <= 0 && (
            <p className="text-amber-400 mt-1">Moon is below horizon</p>
          )}
        </div>
      </div>
    </div>
  );
}
