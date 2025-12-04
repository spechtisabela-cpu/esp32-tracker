"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção de ícones
const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png'; 
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export default function Map({ data, mode }) {
  // mode = 'temp', 'hum', 'mq9', ou 'mq135'

  const defaultCenter = [-23.5505, -46.6333]; 
  const latestData = data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // Função para definir COR e RAIO baseado no modo selecionado
  const getStyle = (reading) => {
    let color = '#ccc';
    let radius = 30; // Pontos grandes para efeito "Heatmap/Nuvem"

    if (mode === 'temp') {
      // Escala Azul (Frio) -> Vermelho (Quente)
      if (reading.temp > 30) color = '#ff0000';
      else if (reading.temp > 25) color = '#ff8c00';
      else if (reading.temp > 20) color = '#ffd700';
      else color = '#00bfff';
    } 
    else if (mode === 'hum') {
      // Escala Branco (Seco) -> Azul Escuro (Úmido)
      if (reading.humidity > 80) color = '#00008b';
      else if (reading.humidity > 60) color = '#1e90ff';
      else if (reading.humidity > 40) color = '#87cefa';
      else color = '#d3d3d3';
    }
    else if (mode === 'mq9') {
      // Escala Amarelo -> Marrom (Perigo)
      if (reading.mq9_val > 2000) color = '#8b0000';
      else if (reading.mq9_val > 1000) color = '#ff4500';
      else color = '#ffd700';
    }
    else if (mode === 'mq135') {
      // Escala Verde (Bom) -> Roxo (Ruim)
      if (reading.mq135_val > 2000) color = '#800080';
      else if (reading.mq135_val > 1000) color = '#ff00ff';
      else color = '#32cd32';
    }

    return { color, radius };
  };

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0' }}>
      
      {/* Mapa Base Super Limpo (Toner Lite ou Positron) */}
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* PONTOS TIPO "HEATMAP" */}
      {data.map((reading, index) => {
        const style = getStyle(reading);
        return (
          <CircleMarker 
            key={index}
            center={[reading.latitude, reading.longitude]} 
            radius={style.radius} 
            pathOptions={{ 
              stroke: false, // Sem borda para parecer fumaça/nuvem
              fillColor: style.color,
              fillOpacity: 0.25 // Bem transparente para misturar as cores
            }}
          >
            <Tooltip direction="top" offset={[0, -20]} opacity={1}>
              <span>
                <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
                Temp: {reading.temp}°C | Umid: {reading.humidity}%<br/>
                MQ9: {reading.mq9_val} | MQ135: {reading.mq135_val}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      
      {/* Marcador Exato Atual */}
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={5}
          pathOptions={{ color: '#333', fillColor: '#333', fillOpacity: 1 }}
        >
          <Popup>Localização Atual</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
