"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  // Icon Fix
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
    });
  }, []);

  const defaultCenter = [-23.5505, -46.6333]; 
  const latestData = data && data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // --- NEW VISUAL LOGIC (Opacity based) ---
  const getStyle = (val, mode) => {
    let r = 0, g = 0, b = 0;
    let max = 100;

    // Define Base Colors (RGB) and Max Values
    if (mode === 'temp') {
      r = 255; g = 99; b = 132; // Red
      max = 40; // Max Temp
    } else if (mode === 'hum') {
      r = 54; g = 162; b = 235; // Blue
      max = 100; // Max Humidity
    } else if (mode === 'mq9') {
      r = 255; g = 159; b = 64; // Orange
      max = 500; 
    } else if (mode === 'mq135') {
      r = 75; g = 192; b = 192; // Teal
      max = 500;
    }

    // Calculate Opacity (0.1 to 1.0)
    // We add a tiny base opacity (0.1) so 0 isn't completely invisible, 
    // but close to it as requested.
    const safeVal = val || 0;
    let pct = Math.min(Math.max(safeVal, 0), max) / max;
    
    // Scale Logic: 
    // Opacity: proportional to value. 
    // Radius: Smaller dots (4px to 14px)
    const opacity = 0.1 + (pct * 0.9); 
    const radius = 4 + (pct * 10); 

    return { 
      color: `rgba(${r}, ${g}, ${b}, ${opacity})`, 
      radius 
    };
  };

  return (
    <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0' }}>
      
      {latestData && <RecenterAutomatically lat={latestData.latitude} lng={latestData.longitude} />}

      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {data.map((reading, index) => {
        const val = mode === 'temp' ? reading.temp : 
                    mode === 'hum' ? reading.humidity : 
                    mode === 'mq9' ? reading.mq9_val : reading.mq135_val;

        const { color, radius } = getStyle(val, mode);

        return (
          <CircleMarker 
            key={index}
            center={[reading.latitude || 0, reading.longitude || 0]} 
            radius={radius} 
            pathOptions={{ 
              stroke: false, 
              fillColor: color, 
              fillOpacity: 1 // We handle opacity in the color string itself now
            }}
          >
            <Tooltip direction="top" opacity={1}>
              <span>
                <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
                {mode.toUpperCase()}: {val ? val.toFixed(2) : '0'}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      
      {/* Current Location Marker - SMALLER */}
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={5} // Reduced from 8
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#000', fillOpacity: 1 }}
        >
          <Popup>Localização Atual</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
