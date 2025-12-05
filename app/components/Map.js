"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correção dos ícones padrão do Leaflet que somem no Next.js
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  });
}

// --- COMPONENTE QUE FORÇA O MAPA A MEXER (AUTO-FOCUS) ---
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    // Só centraliza se a coordenada for válida (diferente de 0)
    if (lat !== 0 && lng !== 0 && lat !== undefined && lng !== undefined) {
      // setView([latitude, longitude], zoomLevel)
      // Zoom 17 = Bem perto (Nível Rua)
      map.setView([lat, lng], 17); 
    }
  }, [lat, lng, map]);
  return null;
}

export default function Map({ data, mode }) {
  // Centro padrão (São Paulo) caso não tenha dados
  const defaultCenter = [-23.5505, -46.6333]; 

  // 1. ACHAR A ÚLTIMA LEITURA VÁLIDA (Ignora GPS 0,0)
  // O array 'data' já vem ordenado do mais novo para o mais antigo.
  // Procuramos o primeiro item que não seja 0,0.
  const latestValidData = data.find(d => d.latitude !== 0 && d.longitude !== 0);

  // Se achou, usa. Se não, usa o padrão.
  const center = latestValidData 
    ? [latestValidData.latitude, latestValidData.longitude] 
    : defaultCenter;

  // Função para criar os ícones coloridos (Heatmap style)
  const createGradientIcon = (val, mode) => {
    let r=0, g=0, b=0, max=100;
    
    // Configuração das cores baseada no modo
    if (mode === 'temp') { r=255; g=99; b=132; max=35; }       
    else if (mode === 'hum') { r=54; g=162; b=235; max=100; }  
    else if (mode === 'mq9') { r=255; g=159; b=64; max=500; }  
    else if (mode === 'mq135') { r=75; g=192; b=192; max=500; }

    const safeVal = val || 0;
    // Calcula a intensidade da cor (transparência)
    const pct = Math.min(Math.max(safeVal, 0), max) / max;
    const size = 20 + (pct * 30); // Tamanho varia com a intensidade
    const centerAlpha = 0.5 + (pct * 0.5);

    const colorStr = `rgba(${r}, ${g}, ${b}, ${centerAlpha})`;
    
    // CSS do ícone
    const htmlStyles = `
      width: ${size}px; 
      height: ${size}px;
      background: radial-gradient(circle, ${colorStr} 20%, rgba(${r},${g},${b},0.2) 60%, rgba(${r},${g},${b},0) 100%);
      border-radius: 50%;
      box-shadow: 0 0 10px ${colorStr};
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
      zoom={17} // Zoom inicial alto (focado)
      style={{ height: "100%", width: "100%", borderRadius: "15px", background: '#e0e0e0', minHeight: '300px' }}
    >
      {/* Ativa o componente de recentralização automática */}
      {latestValidData && <RecenterAutomatically lat={latestValidData.latitude} lng={latestValidData.longitude} />}
      
      {/* Mapa Base Limpo (CartoDB) */}
      <TileLayer 
        attribution='&copy; CARTO' 
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
      />
      
      {/* Desenha os pontos históricos */}
      {data.map((reading, index) => {
        // Seleciona o valor correto baseado no botão clicado
        const val = mode === 'temp' ? reading.temp : 
                    mode === 'hum' ? reading.hum : 
                    mode === 'mq9' ? reading.mq9 : 
                    reading.mq135;
                    
        // Não desenha se GPS for inválido
        if (!reading.latitude || !reading.longitude || (reading.latitude === 0 && reading.longitude === 0)) return null;
        
        return (
          <Marker 
            key={index} 
            position={[reading.latitude, reading.longitude]} 
            icon={createGradientIcon(val, mode)} 
            zIndexOffset={-100} // Coloca atrás do ponto principal
          >
            <Popup>
               <b>{new Date(reading.created_at).toLocaleTimeString('pt-BR')}</b><br/>
               {mode.toUpperCase()}: {val ? Number(val).toFixed(2) : '0'}
            </Popup>
          </Marker>
        );
      })}
      
      {/* Marcador da Localização Atual (Pino Padrão) */}
      {latestValidData && (
        <Marker position={[latestValidData.latitude, latestValidData.longitude]}>
          <Popup>
            <strong>Localização Atual</strong><br/>
            (Baseado na última leitura válida)
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
