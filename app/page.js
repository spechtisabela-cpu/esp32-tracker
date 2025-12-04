"use client";
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

// Setup Charts
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data function
  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.data) setData(json.data.reverse()); // Reverse to show oldest to newest on graph
      setLoading(false);
    }
    fetchData();
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Prepare Chart Data
  const chartData = {
    labels: data.map(d => new Date(d.created_at).toLocaleTimeString()),
    datasets: [
      { label: 'Temp (°C)', data: data.map(d => d.temp), borderColor: 'red' },
      { label: 'Humidity (%)', data: data.map(d => d.humidity), borderColor: 'blue' },
    ],
  };

  const gasData = {
    labels: data.map(d => new Date(d.created_at).toLocaleTimeString()),
    datasets: [
      { label: 'MQ9 (Gas)', data: data.map(d => d.mq9_val), borderColor: 'orange' },
      { label: 'MQ135 (Air)', data: data.map(d => d.mq135_val), borderColor: 'green' },
    ],
  };

  if (loading) return <p>Loading Sensor Data...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>ESP32 Sensor Dashboard</h1>
      
      {/* MAP SECTION */}
      <div style={{ height: '400px', marginBottom: '20px', border: '1px solid #ccc' }}>
        <p>Map Placeholder (We need to import Leaflet dynamically in Next.js, check console for data)</p>
        <p>Latest Location: {data[data.length-1]?.latitude}, {data[data.length-1]?.longitude}</p>
      </div>

      {/* GRAPHS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Climate</h3>
          <Line data={chartData} />
        </div>
        <div>
          <h3>Gas Levels</h3>
          <Line data={gasData} />
        </div>
      </div>
    </div>
  );
}
