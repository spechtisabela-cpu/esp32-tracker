"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção de ícones do Leaflet
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

  // 1. DEFINIR A COR "TEMA" PARA O PONTO ATUAL
  const getThemeColor = () => {
    switch (mode) {
      case 'temp': return 'rgb(255, 99, 132)'; // Vermelho
      case 'hum':  return 'rgb(54, 162, 235)'; // Azul
      case 'mq9':  return 'rgb(255, 159, 64)'; // Laranja
      case 'mq135': return 'rgb(75, 192, 192)'; // Verde/Teal
      default: return '#333';
    }
  };

  const themeColor = getThemeColor();

  // 2. FUNÇÃO PARA O HEATMAP (NUVENS)
  const getStyle = (reading) => {
    let color = '#ccc';
    let radius = 30; // Pontos grandes para efeito "Heatmap/Nuvem"

    if (mode === 'temp') {
      if (reading.temp > 30) color = '#ff0000';      // Muito Quente
      else if (reading.temp > 25) color = '#ff8c00'; // Quente
      else if (reading.temp > 20) color = '#ffd700'; // Agradável
      else color = '#00bfff';                        // Frio
    } 
    else if (mode === 'hum') {
      if (reading.humidity > 80) color = '#00008b';
      else if (reading.humidity > 60) color = '#1e90ff';
      else if (reading.humidity > 40) color = '#87cefa';
      else color = '#d3d3d3';
    }
    else if (mode === 'mq9') {
      if (reading.mq9_val > 2000) color = '#8b0000';
      else if (reading.mq9_val > 1000) color = '#ff4500';
      else color = '#ffd700';
    }
    else if (mode === 'mq135') {
      if (reading.mq135_val > 2000) color = '#800080';
      else if (reading.mq135_val > 1000) color = '#ff00ff';
      else color = '#32cd32';
    }

    return { color, radius };
  };

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0' }}>
      
      {/* Mapa Base Limpo */}
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* PONTOS TIPO "HEATMAP" (HISTÓRICO) */}
      {data.map((reading, index) => {
        const style = getStyle(reading);
        return (
          <CircleMarker 
            key={index}
            center={[reading.latitude, reading.longitude]} 
            radius={style.radius} 
            pathOptions={{ 
              stroke: false, 
              fillColor: style.color,
              fillOpacity: 0.25 
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
      
      {/* MARCADOR DA LOCALIZAÇÃO ATUAL (AGORA COLORIDO) */}
      {latestData && (
        <CircleMarker 
          center={[latestData.latitude, latestData.longitude]}
          radius={8} // Um pouco maior para destacar
          pathOptions={{ 
            color: '#fff',       // Borda branca para destacar do fundo
            weight: 2,           // Espessura da borda
            fillColor: themeColor, // AQUI: A cor muda conforme o botão selecionado!
            fillOpacity: 1       // Totalmente sólido
          }}
        >
          <Popup>
            <strong>Localização Atual</strong><br/>
            Sensor: {mode.toUpperCase()}
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
