"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- COMPONENTE AUXILIAR PARA RECENTRALIZAR ---
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
  // --- CORREÇÃO DE ÍCONES (EXECUTAR APENAS NO CLIENTE) ---
  useEffect(() => {
    // Isso garante que o código só roda no navegador
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

  // LÓGICA DE ESCALA DE CORES (HEATMAP)
  const getScaleStyle = (val, mode) => {
    let color = '#999';
    let radius = 10;
    
    // Evitar valores nulos/undefined
    const safeVal = val || 0;

    if (mode === 'temp') {
      // Escala: 0°C a 40°C
      const max = 40;
      const pct = Math.min(Math.max(safeVal, 0), max) / max; 
      // Azul (frio) -> Vermelho (quente)
      const hue = (1 - pct) * 240; 
      color = `hsl(${hue}, 100%, 50%)`; 
      radius = 10 + (pct * 40); 
    } 
    else if (mode === 'hum') {
      // Escala: 0% a 100%
      const max = 100;
      const pct = Math.min(Math.max(safeVal, 0), max) / max;
      color = `rgba(0, 0, 255, ${0.3 + (pct * 0.7)})`;
      radius = 10 + (pct * 40);
    }
    else if (mode === 'mq9' || mode === 'mq135') {
       // Escala Arbitrária: 0 a 500
       const max = 500;
       const pct = Math.min(safeVal, max) / max;
       const hue = 120 - (pct * 120); 
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
      
      {data.map((reading, index) => {
        const val = mode === 'temp' ? reading.temp : 
                    mode === 'hum' ? reading.humidity : 
                    mode === 'mq9' ? reading.mq9_val : reading.mq135_val;

        const { color, radius } = getScaleStyle(val, mode);

        return (
          <CircleMarker 
            key={index}
            center={[reading.latitude || 0, reading.longitude || 0]} 
            radius={radius} 
            pathOptions={{ 
              stroke: false, 
              fillColor: color, 
              fillOpacity: 0.5 
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
      
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={8}
          pathOptions={{ color: '#fff', weight: 3, fillColor: '#000', fillOpacity: 1 }}
        >
          <Popup>Localização Atual</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
