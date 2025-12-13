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
    if (lat !== 0 && lng !== 0 && lat !== undefined && lng !== undefined) {
      map.setView([lat, lng], 17);
    }
  }, [lat, lng, map]);
  return null;
}

export default function Map({ data, mode }) {
  const defaultCenter = [-23.5505, -46.6333]; 
  
  // Find the latest data point that has BOTH valid GPS AND valid Sensor Data for the current mode
  const latestValidData = data.find(d => {
    const val = mode === 'temp' ? d.temp : mode === 'hum' ? d.hum : mode === 'mq9' ? d.mq9 : d.mq135;
    return d.latitude !== 0 && d.longitude !== 0 && val !== 0 && val !== null;
  });

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
    
    // VISUAL POLLUTION FIX:
    // Low value = Big & Transparent (Background noise)
    // High value = Small & Solid (Hotspot)
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
      
      {data.map((reading, index) => {
        const val = mode === 'temp' ? reading.temp : 
                    mode === 'hum' ? reading.hum : 
                    mode === 'mq9' ? reading.mq9 : 
                    reading.mq135;
        
        // === THE FIX ===
        // 1. Check GPS Validity
        if (!reading.latitude || !reading.longitude || (reading.latitude === 0 && reading.longitude === 0)) return null;
        
        // 2. Check SENSOR Validity (Clean Data)
        // If the value is 0, null, or undefined, DO NOT draw a dot.
        if (val === 0 || val === null || val === undefined) return null;
        
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
      
      {latestValidData && (
        <Marker position={[latestValidData.latitude, latestValidData.longitude]}>
          <Popup>Current Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
