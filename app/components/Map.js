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
    if (lat !== 0 && lng !== 0) {
      map.setView([lat, lng], 17);
    }
  }, [lat, lng, map]);
  return null;
}

export default function Map({ data, mode }) {
  const defaultCenter = [-23.5505, -46.6333]; 
  const latestData = data && data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  const createGradientIcon = (val, mode) => {
    let r=0, g=0, b=0, max=100;
    if (mode === 'temp') { r=255; g=99; b=132; max=40; }       
    else if (mode === 'hum') { r=54; g=162; b=235; max=100; }  
    else if (mode === 'mq9') { r=255; g=159; b=64; max=500; }  
    else if (mode === 'mq135') { r=75; g=192; b=192; max=500; }

    const safeVal = val || 0;
    const pct = Math.min(Math.max(safeVal, 0), max) / max;
    const size = 15 + (pct * 25); 
    const centerAlpha = 0.4 + (pct * 0.5);

    const colorStr = `rgba(${r}, ${g}, ${b}, ${centerAlpha})`;
    const htmlStyles = `
      width: ${size}px; height: ${size}px;
      background: radial-gradient(circle, ${colorStr} 0%, rgba(${r},${g},${b},0) 70%);
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
    <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0' }}>
      {latestData && <RecenterAutomatically lat={latestData.latitude} lng={latestData.longitude} />}
      <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {data.map((reading, index) => {
        const val = mode === 'temp' ? reading.temp : mode === 'hum' ? reading.humidity : mode === 'mq9' ? reading.mq9_val : reading.mq135_val;
        if (!reading.latitude || !reading.longitude) return null;
        return (
          <Marker key={index} position={[reading.latitude, reading.longitude]} icon={createGradientIcon(val, mode)} zIndexOffset={-100}>
            <Popup>
               <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
               {mode.toUpperCase()}: {val ? val.toFixed(2) : '0'}
            </Popup>
          </Marker>
        );
      })}
      {latestData && (
        <Marker position={[latestData.latitude, latestData.longitude]}>
          <Popup>Localização Atual</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
