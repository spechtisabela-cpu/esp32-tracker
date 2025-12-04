"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for missing marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Map({ data }) {
  // Default to a central location if no data (e.g., Equator)
  const center = data.length > 0 
    ? [data[data.length - 1].latitude, data[data.length - 1].longitude] 
    : [0, 0];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Draw a path connecting all points */}
      {data.map((reading, index) => (
        <CircleMarker 
          key={index}
          center={[reading.latitude, reading.longitude]} 
          radius={5}
          pathOptions={{ 
            color: reading.mq9_val > 1000 ? 'red' : 'blue', // Color turns red if Gas is high
            fillColor: reading.mq9_val > 1000 ? 'red' : 'blue',
            fillOpacity: 0.7 
          }}
        >
          <Popup>
            Time: {new Date(reading.created_at).toLocaleTimeString()}<br/>
            Temp: {reading.temp}°C<br/>
            Gas (MQ9): {reading.mq9_val}
          </Popup>
        </CircleMarker>
      ))}
      
      {/* Marker for the latest position */}
      {data.length > 0 && (
        <Marker position={[data[data.length - 1].latitude, data[data.length - 1].longitude]}>
          <Popup>Current Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
