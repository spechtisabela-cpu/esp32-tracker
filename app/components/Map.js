"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  });
}

function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 17);
    }
  }, [lat, lng, map]);
  return null;
}

export default function Map({ data, mode }) {
  const defaultCenter = [-23.5505, -46.6333]; 

  // --- LOGIC FIX: FILTER DATA BASED ON MODE ---
  // We only consider data valid if GPS is not 0 AND the specific sensor value is not 0
  const validData = data.filter(d => {
    const val = mode === 'temp' ? d.temp : 
                mode === 'hum' ? d.hum : 
                mode === 'mq9' ? d.mq9 : 
                d.mq135;
    
    // STRICT CHECK: Value must exist and NOT be 0
    return d.latitude !== 0 && d.longitude !== 0 && val !== 0 && val !== null && val !== undefined;
  });

  // Find the latest VALID reading (not just the latest timestamp)
  const latestValidData = validData.length > 0 ? validData[0] : null;

  const center = latestValidData 
    ? [latestValidData.latitude, latestValidData.longitude] 
    : defaultCenter;

  const createGradientIcon = (val, mode) => {
    let r=0, g=0, b=0, max=100;
    if (mode === 'temp') { r=255; g=99; b=132; max=35; }       
    else if (mode === 'hum') { r=54; g=162; b=235; max=100; }  
    else if (mode === 'mq9') { r=255; g=159; b=64; max=500; }  
    else if (mode === 'mq135') { r=75; g=192; b=192; max=500; }

    const safeVal = val || 0;
    const pct = Math.min(Math.max(safeVal, 0), max) / max;
    
    const size = 50 - (pct * 30); 
    const alpha = 0.2 + (pct * 0.8); 

    const colorStr = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    
    const htmlStyles = `
      width: ${size}px; 
      height: ${size}px;
      background: radial-gradient(circle, ${colorStr} 20%, rgba(${r},${g},${b},0.1) 60%, rgba(${r},${g},${b},0) 100%);
      border-radius: 50%;
    `;

    return L.divIcon({
      className: 'custom-heatmap-icon',
      html: `<div style="${htmlStyles}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  };

  return (
    <MapContainer 
      center={center} 
      zoom={17} 
      style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0', minHeight: '300px' }}
    >
      {latestValidData && <RecenterAutomatically lat={latestValidData.latitude} lng={latestValidData.longitude} />}
      
      <TileLayer 
        attribution='&copy; CARTO' 
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
      />
      
      {/* Use validData array (which already excludes zeros) */}
      {validData.map((reading, index) => {
        const val = mode === 'temp' ? reading.temp : 
                    mode === 'hum' ? reading.hum : 
                    mode === 'mq9' ? reading.mq9 : 
                    reading.mq135;

        return (
          <Marker 
            key={index} 
            position={[reading.latitude, reading.longitude]} 
            icon={createGradientIcon(val, mode)} 
            zIndexOffset={-100} 
          >
            <Popup>
               <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
               {mode.toUpperCase()}: {Number(val).toFixed(2)}
            </Popup>
          </Marker>
        );
      })}
      
      {/* Only show "Current Location" if there is valid data for this sensor */}
      {latestValidData && (
        <Marker position={[latestValidData.latitude, latestValidData.longitude]}>
          <Popup>Current Location ({mode.toUpperCase()})</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
