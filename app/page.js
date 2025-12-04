"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <p>Carregando Mapa...</p>
});

export default function Home() {
  const [data, setData] = useState([]);
  const [mapMode, setMapMode] = useState('temp'); 
  const [activeGraph, setActiveGraph] = useState('temp'); 

  async function fetchData() {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.data) setData(json.data); 
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const graphData = [...data].reverse(); 
  const labels = graphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
  const latest = data.length > 0 ? data[0] : { temp: 0, humidity: 0, mq9_val: 0, mq135_val: 0, latitude: 0, longitude: 0 };

  // --- CHART CONFIG ---
  const overviewOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }, 
    scales: { x: { display: false } }, 
    elements: { point: { radius: 0 } } 
  };

  const climateChart = {
    labels,
    datasets: [
      { label: 'Temp', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', borderWidth: 2, tension: 0.4 },
      { label: 'Umid', data: graphData.map(d => d.humidity), borderColor: 'rgb(54, 162, 235)', borderWidth: 2, tension: 0.4 },
    ],
  };

  const gasChart = {
    labels,
    datasets: [
      { label: 'MQ9', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true, tension: 0.4 },
      { label: 'MQ135', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', borderWidth: 2, tension: 0.4 },
    ],
  };

  const detailOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false } }
  };

  const datasets = {
    temp: { label: 'Temperatura (°C)', data: graphData.map(d => d.temp), color: 'rgb(255, 99, 132)' },
    hum: { label: 'Umidade (%)', data: graphData.map(d => d.humidity), color: 'rgb(54, 162, 235)' },
    mq9: { label: 'Gás Combustível (MQ9)', data: graphData.map(d => d.mq9_val), color: 'rgb(255, 159, 64)' },
    mq135: { label: 'Qualidade do Ar (MQ135)', data: graphData.map(d => d.mq135_val), color: 'rgb(75, 192, 192)' }
  };

  const activeChartData = {
    labels,
    datasets: [{
      label: datasets[activeGraph].label,
      data: datasets[activeGraph].data,
      borderColor: datasets[activeGraph].color,
      backgroundColor: datasets[activeGraph].color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
      fill: true,
      tension: 0.3,
      pointRadius: 3
    }]
  };

  // --- STYLES HELPER ---
  const getReadingCardStyle = (color) => ({
    backgroundColor: '#fff', 
    borderRadius: '15px',     // Slightly tighter corners
    padding: '10px 15px',     // Much less padding
    border: `3px solid ${color}`,
    boxShadow: `0 4px 10px ${color}22`, 
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100px'        // Reduced height (was 160px)
  });

  const cardStyle = {
    backgroundColor: '#fff', 
    borderRadius: '20px', 
    padding: '25px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    textAlign: 'center',
    height: '100%'
  };

  const buttonStyle = (isActive, color) => ({
    padding: '10px 20px',
    margin: '5px',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9em',
    backgroundColor: isActive ? color : '#e0e0e0',
    color: isActive ? '#fff' : '#666',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? `0 4px 10px ${color}66` : 'none',
    flex: '1 1 auto', 
    minWidth: '120px'
  });

  return (
    <div className="main-container">
      <style jsx global>{`
        body { margin: 0; background-color: #f2efeb; font-family: 'Cerebri Sans', 'Arial', sans-serif; }
        
        .main-container {
          padding: 60px 8%;
          min-height: 100vh;
          color: #333;
        }

        .title-main {
          margin: 0;
          font-size: 3.8em;
          font-weight: 900;
          color: #1a1a1a;
          letter-spacing: -2px;
          line-height: 1.1;
        }

        .title-sub {
          margin: 10px 0 40px 0;
          font-weight: 800;
          font-size: 2.8em;
          color: #555;
        }

        .section-title {
          font-size: 2.5em;
          font-weight: 900;
          color: #2c3e50;
          margin-bottom: 30px;
          margin-top: 60px;
          text-transform: uppercase;
          letter-spacing: -1px;
        }

        .map-controls {
          position: absolute; 
          top: 20px; 
          right: 20px; 
          z-index: 1000; 
          background: rgba(255,255,255,0.95); 
          padding: 10px
