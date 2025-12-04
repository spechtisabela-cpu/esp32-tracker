"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; // Required for Map to work
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

// Register Chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Import Map Dynamically (Disable Server-Side Rendering for this component)
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <p>Loading Map...</p>
});

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch data from your API
  async function fetchData() {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.data) {
        setData(json.data); 
      }
      setLoading(false);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // --- Prepare Graph Data ---
  // We reverse data for graphs so time goes Left -> Right
  const graphData = [...data].reverse(); 

  const climateChart = {
    labels: graphData.map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
    datasets: [
      { label: 'Temp (°C)', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', tension: 0.1 },
      { label: 'Humidity (%)', data: graphData.map(d => d.humidity), borderColor: 'rgb(53, 162, 235)', tension: 0.1 },
    ],
  };

  const gasChart = {
    labels: graphData.map(d => new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})),
    datasets: [
      { label: 'MQ9 (CO/Gas)', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)', fill: true },
      { label: 'MQ135 (Air Quality)', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', tension: 0.1 },
    ],
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>ESP32 Sensor Tracker</h1>
      
      {/* MAP SECTION */}
      <div style={{ height: '50vh', minHeight: '400px', marginBottom: '30px', border: '2px solid #ddd', borderRadius: '10px' }}>
        <Map data={data} />
      </div>

      {/* GRAPHS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ textAlign: 'center' }}>Temperature & Humidity</h3>
          <Line data={climateChart} />
        </div>
        <div style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ textAlign: 'center' }}>Gas Levels (Analog Value)</h3>
          <Line data={gasChart} />
        </div>
      </div>
    </div>
  );
}
