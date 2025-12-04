"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção de ícones
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png'; 
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// --- COMPONENTE MÁGICO PARA CENTRALIZAR O MAPA ---
// Isso garante que o mapa "pule" para a localização correta quando o GPS conectar
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.setView([lat, lng], 17); // Zoom 17 = Nível Rua (Bem focado)
    }
  }, [lat, lng, map]);
  return null;
}

export default function Map({ data, mode }) {
  const defaultCenter = [-23.5505, -46.6333]; 
  const latestData = data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // DEFINIR A COR TEMÁTICA (Coordenada com os Gráficos)
  const getThemeColor = () => {
    switch (mode) {
      case 'temp': return 'rgb(255, 99, 132)';  // Vermelho
      case 'hum':  return 'rgb(54, 162, 235)';  // Azul
      case 'mq9':  return 'rgb(255, 159, 64)';  // Laranja
      case 'mq135': return 'rgb(75, 192, 192)'; // Verde/Teal
      default: return '#333';
    }
  };

  const themeColor = getThemeColor();

  return (
    <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0' }}>
      
      {/* 1. ATIVAR RECENTRALIZAÇÃO AUTOMÁTICA */}
      {latestData && <RecenterAutomatically lat={latestData.latitude} lng={latestData.longitude} />}

      {/* Mapa Base Limpo */}
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* PONTOS "HEATMAP" (NUVEM) */}
      {/* Agora a cor é FIXA baseada no sensor, mudando apenas a transparência */}
      {data.map((reading, index) => (
        <CircleMarker 
          key={index}
          center={[reading.latitude, reading.longitude]} 
          radius={35} // Raio bem grande para criar a nuvem
          pathOptions={{ 
            stroke: false, 
            fillColor: themeColor, // Usa EXATAMENTE a cor do sensor
            fillOpacity: 0.15      // Bem transparente. Quando se sobrepõem, a cor fica forte!
          }}
        >
          <Tooltip direction="top" offset={[0, -20]} opacity={1}>
            <span>
              <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
              Valor: {
                mode === 'temp' ? reading.temp + '°C' : 
                mode === 'hum' ? reading.humidity + '%' : 
                mode === 'mq9' ? reading.mq9_val : 
                reading.mq135_val
              }
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
      
      {/* MARCADOR DA LOCALIZAÇÃO ATUAL */}
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={8}
          pathOptions={{ 
            color: '#fff',       
            weight: 3,           
            fillColor: themeColor, // O ponto atual também segue a cor
            fillOpacity: 1       
          }}
        >
          <Popup>Localização Atual</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
