"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icons
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
  // Default center (Brazil)
  const defaultCenter = [-23.5505, -46.6333]; 

  // Center on the most recent valid reading
  const latestData = data.length > 0 ? data[0] : null;
  const center = latestData ? [latestData.latitude, latestData.longitude] : defaultCenter;

  // Helper to choose color based on Temperature (Visual Graph)
  const getColor = (temp) => {
    if (temp > 30) return '#FF0000'; // Hot (Red)
    if (temp > 24) return '#FFA500'; // Warm (Orange)
    return '#0088FF';                // Cool (Blue)
  };

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "10px" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* HISTORY DOTS */}
      {data.map((reading, index) => (
        <CircleMarker 
          key={index}
          center={[reading.latitude, reading.longitude]} 
          radius={10} // Bigger dots
          pathOptions={{ 
            color: 'white',
            weight: 1,
            fillColor: getColor(reading.temp), // Color changes based on Temp
            fillOpacity: 0.8 
          }}
        >
          {/* Tooltip shows on HOVER (No click needed) */}
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <span>
              <b>{new Date(reading.created_at).toLocaleTimeString()}</b><br/>
              Temp: {reading.temp}°C<br/>
              Hum: {reading.humidity}%<br/>
              Gas: {reading.mq9_val}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
      
      {/* CURRENT LOCATION MARKER */}
      {latestData && (
        <Marker position={[latestData.latitude, latestData.longitude]}>
          <Popup>You are here!</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
