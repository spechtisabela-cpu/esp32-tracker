"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção dos ícones
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
  const defaultCenter = [-23.5505, -46.6333]; 
  const latestData = data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // Função de cor (Gradiente de Calor)
  const getColor = (temp) => {
    if (temp > 30) return '#FF0000'; // Vermelho (Muito Quente)
    if (temp > 25) return '#FF8C00'; // Laranja Escuro
    if (temp > 20) return '#FFD700'; // Amarelo/Dourado
    return '#00BFFF';                // Azul Claro (Fresco)
  };

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "10px", background: '#f2efeb' }}>
      
      {/* MAPA DE FUNDO LIMPO (CartoDB Positron) - Remove o excesso de detalhes */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* EFEITO "HEATMAP" (NUVEM) */}
      {data.map((reading, index) => (
        <CircleMarker 
          key={index}
          center={[reading.latitude, reading.longitude]} 
          radius={25} // Raio bem grande para criar a "mancha"
          pathOptions={{ 
            stroke: false, // Sem borda (importante para o efeito nuvem)
            fillColor: getColor(reading.temp),
            fillOpacity: 0.3 // Bem transparente para misturar as cores
          }}
        >
          <Tooltip direction="top" offset={[0, -20]} opacity={1}>
            <span>
              <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
              Temp: {reading.temp}°C<br/>
              Gás: {reading.mq9_val}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
      
      {/* PONTO ATUAL (Pequeno ponto preto para saber onde está exatamente) */}
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={5}
          pathOptions={{ color: 'black', fillColor: 'black', fillOpacity: 1 }}
        >
          <Popup>Localização Atual</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
