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
  
  // States
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
  // 1. Overview Small Charts
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

  // 2. Detailed Big Chart
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

  // --- STYLES ---
  const containerStyle = {
    padding: '60px 8%', 
    fontFamily: "'Cerebri Sans', 'Arial', sans-serif", 
    backgroundColor: '#f2efeb', 
    minHeight: '100vh',
    color: '#333'
  };

  const cardStyle = {
    backgroundColor: '#fff', 
    borderRadius: '20px', 
    padding: '25px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    textAlign: 'center',
    height: '100%'
  };

  const buttonStyle = (isActive, color) => ({
    padding: '8px 16px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.85em',
    backgroundColor: isActive ? color : '#e0e0e0',
    color: isActive ? '#fff' : '#666',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? `0 4px 10px ${color}66` : 'none'
  });

  const sectionTitleStyle = {
    fontSize: '2.5em', // BIGGER Font
    fontWeight: '900', 
    color: '#2c3e50', 
    marginBottom: '30px', 
    marginTop: '60px', // Spacing instead of lines
    textTransform: 'uppercase',
    letterSpacing: '-1px'
  };

  return (
    <div style={containerStyle}>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ margin: '0', fontSize: '3.8em', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-2px' }}>
          MONITORAMENTO DE QUALIDADE DO AR
        </h1>
        <h2 style={{ margin: '10px 0 40px 0', fontWeight: '800', fontSize: '2.8em', color: '#555' }}>
          LAB. VI - IFUSP
        </h2>
        
        {/* TOP CARDS (READINGS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '40px' }}>
          <div style={{ ...cardStyle, borderBottom: '8px solid rgb(255, 99, 132)' }}>
            <div style={{ color: '#888', fontSize: '0.9em', fontWeight: 'bold' }}>TEMPERATURA</div>
            <div style={{ fontSize: '2.8em', fontWeight: 'bold', color: 'rgb(255, 99, 132)' }}>{latest.temp.toFixed(1)}°C</div>
          </div>
          <div style={{ ...cardStyle, borderBottom: '8px solid rgb(54, 162, 235)' }}>
            <div style={{ color: '#888', fontSize: '0.9em', fontWeight: 'bold' }}>UMIDADE</div>
            <div style={{ fontSize: '2.8em', fontWeight: 'bold', color: 'rgb(54, 162, 235)' }}>{latest.humidity.toFixed(1)}%</div>
          </div>
          <div style={{ ...cardStyle, borderBottom: '8px solid rgb(255, 159, 64)' }}>
            <div style={{ color: '#888', fontSize: '0.9em', fontWeight: 'bold' }}>GÁS (MQ9)</div>
            <div style={{ fontSize: '2.8em', fontWeight: 'bold', color: 'rgb(255, 159, 64)' }}>{latest.mq9_val}</div>
          </div>
          <div style={{ ...cardStyle, borderBottom: '8px solid rgb(75, 192, 192)' }}>
            <div style={{ color: '#888', fontSize: '0.9em', fontWeight: 'bold' }}>AR (MQ135)</div>
            <div style={{ fontSize: '2.8em', fontWeight: 'bold', color: 'rgb(75, 192, 192)' }}>{latest.mq135_val}</div>
          </div>
        </div>
      </header>

      {/* SECTION 1: OVERVIEW */}
      <h2 style={sectionTitleStyle}>VISÃO GERAL</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '20px' }}>
        
        {/* MAP (60%) */}
        <div style={{ flex: '3', minWidth: '500px' }}>
          <div style={{ ...cardStyle, padding: '0', border: '5px solid #fff', overflow: 'hidden', height: '600px', position: 'relative' }}>
            {/* Map Controls (Floating inside) */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, background: 'rgba(255,255,255,0.95)', padding: '10px 15px', borderRadius: '40px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#888', marginRight: '10px' }}>VISUALIZAR:</span>
              <button style={buttonStyle(mapMode === 'temp', 'rgb(255, 99, 132)')} onClick={() => setMapMode('temp')}>Temp</button>
              <button style={buttonStyle(mapMode === 'hum', 'rgb(54, 162, 235)')} onClick={() => setMapMode('hum')}>Umid</button>
              <button style={buttonStyle(mapMode === 'mq9', 'rgb(255, 159, 64)')} onClick={() => setMapMode('mq9')}>MQ9</button>
              <button style={buttonStyle(mapMode === 'mq135', 'rgb(75, 192, 192)')} onClick={() => setMapMode('mq135')}>MQ135</button>
            </div>
            <Map data={data} mode={mapMode} />
          </div>
          <p style={{ textAlign: 'right', marginTop: '10px', color: '#999', fontSize: '0.9em' }}>📍 Localização: {latest.latitude.toFixed(4)}, {latest.longitude.toFixed(4)}</p>
        </div>

        {/* SIDE GRAPHS (40%) */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '30px', minWidth: '350px' }}>
          
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '1.2em' }}>🌦️ CLIMA</h4>
            </div>
            <div style={{ flex: 1, minHeight: '0' }}>
              <Line data={climateChart} options={overviewOptions} />
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '1.2em' }}>⚠️ GASES</h4>
            </div>
            <div style={{ flex: 1, minHeight: '0' }}>
              <Line data={gasChart} options={overviewOptions} />
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: DETAILED HISTORY */}
      <h2 style={{ ...sectionTitleStyle, textAlign: 'center', marginTop: '80px' }}>LEITURAS POR SENSOR</h2>
      
      <div>
        {/* TABS */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
          <button style={{ ...buttonStyle(activeGraph === 'temp', 'rgb(255, 99, 132)'), fontSize: '1.1em', padding: '15px 30px' }} onClick={() => setActiveGraph('temp')}>TEMPERATURA</button>
          <button style={{ ...buttonStyle(activeGraph === 'hum', 'rgb(54, 162, 235)'), fontSize: '1.1em', padding: '15px 30px' }} onClick={() => setActiveGraph('hum')}>UMIDADE</button>
          <button style={{ ...buttonStyle(activeGraph === 'mq9', 'rgb(255, 159, 64)'), fontSize: '1.1em', padding: '15px 30px' }} onClick={() => setActiveGraph('mq9')}>GÁS (MQ9)</button>
          <button style={{ ...buttonStyle(activeGraph === 'mq135', 'rgb(75, 192, 192)'), fontSize: '1.1em', padding: '15px 30px' }} onClick={() => setActiveGraph('mq135')}>AR (MQ135)</button>
        </div>

        {/* BIG CHART */}
        <div style={{ ...cardStyle, height: '500px', padding: '40px' }}>
          <Line data={activeChartData} options={detailOptions} />
        </div>
      </div>

    </div>
  );
}
