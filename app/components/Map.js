"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing marker icons in React-Leaflet
// (Leaflet's default icons sometimes break in Next.js, this forces them to load)
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
  // If no data, default to Brazil (approximate center) or 0,0
  // You can change these numbers to your city's coordinates if you want a better default view
  const defaultCenter = [-23.5505, -46.6333]; 

  const center = data.length > 0 
    ? [data[0].latitude, data[0].longitude] // Focus on the most recent reading (index 0)
    : defaultCenter;

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%", borderRadius: "10px" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Draw points for history */}
      {data.map((reading, index) => (
        <CircleMarker 
          key={index}
          center={[reading.latitude, reading.longitude]} 
          radius={8}
          pathOptions={{ 
            color: 'white',
            weight: 1,
            fillColor: reading.mq9_val > 2000 ? '#ff4d4d' : '#3388ff', // Red if gas is high, Blue if safe
            fillOpacity: 0.8 
          }}
        >
          <Popup>
            <strong>Time:</strong> {new Date(reading.created_at).toLocaleTimeString()}<br/>
            <strong>Temp:</strong> {reading.temp}°C<br/>
            <strong>MQ9:</strong> {reading.mq9_val}
          </Popup>
        </CircleMarker>
      ))}
      
      {/* Big Marker for the CURRENT location (most recent) */}
      {data.length > 0 && (
        <Marker position={[data[0].latitude, data[0].longitude]}>
          <Popup>Current Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
