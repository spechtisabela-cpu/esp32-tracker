"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icons fix
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png'; 
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.setView([lat, lng], 17);
    }
  }, [lat, lng, map]);
  return null;
}

export default function Map({ data, mode }) {
  const defaultCenter = [-23.5505, -46.6333]; 
  const latestData = data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // --- HEATMAP SCALING LOGIC ---
  const getScaleStyle = (val, mode) => {
    let color = '#999';
    let radius = 10;
    
    // Helper for color interpolation (Yellow -> Red)
    // You can adjust these ranges to change the "Heat" colors
    if (mode === 'temp') {
      // Scale: 0°C to 40°C
      const max = 40;
      const pct = Math.min(Math.max(val, 0), max) / max; 
      // Color shifts from Blue (cold) to Red (hot)
      const hue = (1 - pct) * 240; // 240 is blue, 0 is red
      color = `hsl(${hue}, 100%, 50%)`; 
      radius = 10 + (pct * 40); // Radius 10px to 50px
    } 
    else if (mode === 'hum') {
      // Scale: 0% to 100%
      const max = 100;
      const pct = val / max;
      // Blue intensity
      color = `rgba(0, 0, 255, ${0.3 + (pct * 0.7)})`;
      radius = 10 + (pct * 40);
    }
    else if (mode === 'mq9' || mode === 'mq135') {
       // Placeholder Scale: 0 to 500 (adjust based on your sensor calibration)
       const max = 500;
       const pct = Math.min(val, max) / max;
       const hue = 120 - (pct * 120); // Green (120) to Red (0)
       color = `hsl(${hue}, 100%, 40%)`;
       radius = 10 + (pct * 40);
    }

    return { color, radius };
  };

  return (
    <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0' }}>
      
      {latestData && <RecenterAutomatically lat={latestData.latitude} lng={latestData.longitude} />}

      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* HEATMAP DOTS */}
      {data.map((reading, index) => {
        const val = mode === 'temp' ? reading.temp : 
                    mode === 'hum' ? reading.humidity : 
                    mode === 'mq9' ? reading.mq9_val : reading.mq135_val;

        const { color, radius } = getScaleStyle(val, mode);

        return (
          <CircleMarker 
            key={index}
            center={[reading.latitude, reading.longitude]} 
            radius={radius} 
            pathOptions={{ 
              stroke: false, 
              fillColor: color, 
              fillOpacity: 0.3 
            }}
          >
            <Tooltip direction="top" opacity={1}>
              <span>
                <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
                {mode.toUpperCase()}: {val}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      
      {/* CURRENT LOCATION MARKER */}
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#000', fillOpacity: 1 }}
        >
          <Popup>Você está aqui</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
