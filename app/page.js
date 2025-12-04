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
  
  // 1. Overview Options (Side Graphs)
  const overviewOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true, // LEGEND IS BACK!
        position: 'top',
        labels: { boxWidth: 10, font: { size: 10 } } // Keep it small/clean
      } 
    }, 
    scales: { x: { display: false } }, 
    elements: { point: { radius: 0 } } 
  };

  const climateChart = {
    labels,
    datasets: [
      { label: 'Temp (°C)', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', borderWidth: 2, tension: 0.4 },
      { label: 'Umid (%)', data: graphData.map(d => d.humidity), borderColor: 'rgb(54, 162, 235)', borderWidth: 2, tension: 0.4 },
    ],
  };

  const gasChart = {
    labels,
    datasets: [
      { label: 'MQ9 (Gás)', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true, tension: 0.4 },
      { label: 'MQ135 (Ar)', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', borderWidth: 2, tension: 0.4 },
    ],
  };

  // 2. Detailed Options (Big Graph)
  const detailOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true, // LEGEND IS BACK!
        labels: { font: { size: 14, weight: 'bold' } }
      } 
    },
    scales: { y: { beginAtZero: false } }
  };

  const datasets = {
    temp: { label: 'Temperatura (°C)', data: graphData.map(d => d.temp), color: 'rgb(255, 99, 132)' },
    hum: { label: 'Umidade (%)', data: graphData.map(d => d.humidity), color: 'rgb(54, 162, 235)' },
    mq9: { label: 'Gás Combustível - MQ9 (PPM)', data: graphData.map(d => d.mq9_val), color: 'rgb(255, 159, 64)' },
    mq135: { label: 'Qualidade do Ar - MQ135', data: graphData.map(d => d.mq135_val), color: 'rgb(75, 192, 192)' }
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
    borderRadius: '15px',     
    padding: '10px 15px',     
    border: `3px solid ${color}`,
    boxShadow: `0 4px 10px ${color}22`, 
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100px'        
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
          padding: 10px 15px; 
          border-radius: 40px; 
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          max-width: 90%;
        }

        @media (max-width: 768px) {
          .main-container { padding: 30px 4%; }
          .title-main { font-size: 2.0em; }
          .title-sub { font-size: 1.5em; margin-bottom: 20px; }
          .section-title { font-size: 1.8em; margin-top: 40px; }
          .map-controls {
            top: 10px;
            right: 50%;
            transform: translateX(50%);
            width: 90%;
            justify-content: center;
          }
          .map-label { display: none; }
        }
      `}</style>
      
      {/* HEADER */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="title-main">
          MONITORAMENTO DE QUALIDADE DO AR
        </h1>
        <h2 className="title-sub">
          LAB. VI - IFUSP
        </h2>
        
        {/* CARDS (Rectangular & Colored) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '40px' }}>
          
          <div style={getReadingCardStyle('rgb(255, 99, 132)')}>
            <div style={{ color: 'rgb(255, 99, 132)', fontSize: '1.1em', fontWeight: '900', margin: 0 }}>TEMPERATURA</div>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: 'rgb(255, 99, 132)', lineHeight: '1.2' }}>{latest.temp.toFixed(1)}°C</div>
          </div>

          <div style={getReadingCardStyle('rgb(54, 162, 235)')}>
            <div style={{ color: 'rgb(54, 162, 235)', fontSize: '1.1em', fontWeight: '900', margin: 0 }}>UMIDADE</div>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: 'rgb(54, 162, 235)', lineHeight: '1.2' }}>{latest.humidity.toFixed(1)}%</div>
          </div>

          <div style={getReadingCardStyle('rgb(255, 159, 64)')}>
            <div style={{ color: 'rgb(255, 159, 64)', fontSize: '1.1em', fontWeight: '900', margin: 0 }}>GÁS (MQ9)</div>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: 'rgb(255, 159, 64)', lineHeight: '1.2' }}>{latest.mq9_val}</div>
          </div>

          <div style={getReadingCardStyle('rgb(75, 192, 192)')}>
            <div style={{ color: 'rgb(75, 192, 192)', fontSize: '1.1em', fontWeight: '900', margin: 0 }}>AR (MQ135)</div>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', color: 'rgb(75, 192, 192)', lineHeight: '1.2' }}>{latest.mq135_val}</div>
          </div>

        </div>
      </header>

      {/* SECTION 1: OVERVIEW */}
      <h2 className="section-title">VISÃO GERAL</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '20px' }}>
        
        {/* MAP */}
        <div style={{ flex: '3', minWidth: '300px' }}>
          <div style={{ ...cardStyle, padding: '0', border: '5px solid #fff', overflow: 'hidden', height: '600px', position: 'relative' }}>
            <div className="map-controls">
              <span className="map-label" style={{ fontSize: '0.8em', fontWeight: 'bold', color: '#888', marginRight: '5px', alignSelf: 'center' }}>VISUALIZAR:</span>
              <button style={buttonStyle(mapMode === 'temp', 'rgb(255, 99, 132)')} onClick={() => setMapMode('temp')}>Temp</button>
              <button style={buttonStyle(mapMode === 'hum', 'rgb(54, 162, 235)')} onClick={() => setMapMode('hum')}>Umid</button>
              <button style={buttonStyle(mapMode === 'mq9', 'rgb(255, 159, 64)')} onClick={() => setMapMode('mq9')}>MQ9</button>
              <button style={buttonStyle(mapMode === 'mq135', 'rgb(75, 192, 192)')} onClick={() => setMapMode('mq135')}>MQ135</button>
            </div>
            <Map data={data} mode={mapMode} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '10px', color: '#999', fontSize: '0.9em' }}>📍 Localização: {latest.latitude.toFixed(4)}, {latest.longitude.toFixed(4)}</p>
        </div>

        {/* SIDE GRAPHS */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '30px', minWidth: '300px' }}>
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '250px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '1.2em' }}>🌦️ CLIMA</h4>
            </div>
            <div style={{ flex: 1, minHeight: '0' }}>
              <Line data={climateChart} options={overviewOptions} />
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '250px' }}>
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
      <h2 className="section-title" style={{ textAlign: 'center' }}>LEITURAS POR SENSOR</h2>
      
      <div>
        {/* TABS */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
          <button style={buttonStyle(activeGraph === 'temp', 'rgb(255, 99, 132)')} onClick={() => setActiveGraph('temp')}>TEMPERATURA</button>
          <button style={buttonStyle(activeGraph === 'hum', 'rgb(54, 162, 235)')} onClick={() => setActiveGraph('hum')}>UMIDADE</button>
          <button style={buttonStyle(activeGraph === 'mq9', 'rgb(255, 159, 64)')} onClick={() => setActiveGraph('mq9')}>GÁS (MQ9)</button>
          <button style={buttonStyle(activeGraph === 'mq135', 'rgb(75, 192, 192)')} onClick={() => setActiveGraph('mq135')}>AR (MQ135)</button>
        </div>

        {/* BIG CHART */}
        <div style={{ ...cardStyle, height: '500px', padding: '15px' }}>
          <Line data={activeChartData} options={detailOptions} />
        </div>
      </div>

    </div>
  );
}
