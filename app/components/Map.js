"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção dos ícones do Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png'; 
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
});

export default function Map({ data }) {
  // Centro padrão (São Paulo)
  const defaultCenter = [-23.5505, -46.6333]; 

  // Centralizar na leitura mais recente
  const latestData = data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // Função para cor baseada na Temperatura
  const getColor = (temp) => {
    if (temp > 30) return '#FF0000'; // Quente (Vermelho)
    if (temp > 24) return '#FFA500'; // Morno (Laranja)
    return '#0088FF';                // Fresco (Azul)
  };

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "10px" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* PONTOS DO HISTÓRICO */}
      {data.map((reading, index) => (
        <CircleMarker 
          key={index}
          center={[reading.latitude, reading.longitude]} 
          radius={10} 
          pathOptions={{ 
            color: 'white',
            weight: 1,
            fillColor: getColor(reading.temp),
            fillOpacity: 0.8 
          }}
        >
          {/* Tooltip em Português */}
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <span>
              <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
              Temp: {reading.temp}°C<br/>
              Umid: {reading.humidity}%<br/>
              Gás (MQ9): {reading.mq9_val}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
      
      {/* MARCADOR ATUAL */}
      {latestData && (
        <Marker position={[latestData.latitude, latestData.longitude]}>
          <Popup>Localização Atual</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
