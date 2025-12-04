"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

// Register Chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Import Map Dynamically
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <p>Loading Map...</p>
});

export default function Home() {
  const [data, setData] = useState([]);

  // Fetch Data
  async function fetchData() {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.data) {
        setData(json.data); 
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // --- Prepare Graph Data ---
  // Reverse so time goes Left -> Right
  const graphData = [...data].reverse(); 
  const labels = graphData.map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  // 1. Temperature Chart (Red)
  const tempChart = {
    labels,
    datasets: [{
      label: 'Temperature (°C)',
      data: graphData.map(d => d.temp),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.3,
      fill: true
    }]
  };

  // 2. Humidity Chart (Blue)
  const humChart = {
    labels,
    datasets: [{
      label: 'Humidity (%)',
      data: graphData.map(d => d.humidity),
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.3,
      fill: true
    }]
  };

  // 3. MQ9 Chart (Orange)
  const mq9Chart = {
    labels,
    datasets: [{
      label: 'MQ9 - CO/Combustible Gas',
      data: graphData.map(d => d.mq9_val),
      borderColor: 'rgb(255, 159, 64)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)',
      tension: 0.1,
      fill: true
    }]
  };

  // 4. MQ135 Chart (Green)
  const mq135Chart = {
    labels,
    datasets: [{
      label: 'MQ135 - Air Quality',
      data: graphData.map(d => d.mq135_val),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
      fill: true
    }]
  };

  // Common Style for Graph Cards
  const cardStyle = {
    border: '1px solid #eee', 
    padding: '15px', 
    borderRadius: '8px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    backgroundColor: '#fff'
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1400px', margin: '0 auto', backgroundColor: '#f9f9f9' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>ESP32 Enviro-Tracker</h1>
      
      {/* MAP SECTION */}
      <div style={{ height: '50vh', minHeight: '400px', marginBottom: '30px', border: '2px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <Map data={data} />
      </div>

      {/* 2x2 GRID FOR GRAPHS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '20px' 
      }}>
        
        {/* Graph 1: Temp */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>🌡️ Temperature</h3>
          <Line data={tempChart} />
        </div>

        {/* Graph 2: Humidity */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>💧 Humidity</h3>
          <Line data={humChart} />
        </div>

        {/* Graph 3: MQ9 */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>🔥 MQ9 (Gas)</h3>
          <Line data={mq9Chart} />
        </div>

        {/* Graph 4: MQ135 */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>💨 MQ135 (Air Quality)</h3>
          <Line data={mq135Chart} />
        </div>

      </div>
    </div>
  );
}
