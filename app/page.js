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
  
  // ESTADOS PARA INTERATIVIDADE
  const [mapMode, setMapMode] = useState('temp'); // 'temp', 'hum', 'mq9', 'mq135'
  const [activeGraph, setActiveGraph] = useState('temp'); // Qual gráfico mostrar embaixo

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

  // --- CONFIG DOS GRÁFICOS ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }, // Esconde a legenda interna (pois já temos o título/botão)
    scales: { y: { beginAtZero: false } }
  };

  const datasets = {
    temp: { label: 'Temperatura (°C)', data: graphData.map(d => d.temp), color: 'rgb(255, 99, 132)' },
    hum: { label: 'Umidade (%)', data: graphData.map(d => d.humidity), color: 'rgb(54, 162, 235)' },
    mq9: { label: 'Gás Combustível (MQ9)', data: graphData.map(d => d.mq9_val), color: 'rgb(255, 159, 64)' },
    mq135: { label: 'Qualidade do Ar (MQ135)', data: graphData.map(d => d.mq135_val), color: 'rgb(75, 192, 192)' }
  };

  // Cria o objeto de dados dinamicamente baseado na aba selecionada
  const activeChartData = {
    labels,
    datasets: [{
      label: datasets[activeGraph].label,
      data: datasets[activeGraph].data,
      borderColor: datasets[activeGraph].color,
      backgroundColor: datasets[activeGraph].color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
      fill: true,
      tension: 0.4,
      pointRadius: 3
    }]
  };

  // --- ESTILOS ---
  const containerStyle = {
    padding: '40px', 
    fontFamily: "'Cerebri Sans', 'Arial', sans-serif", 
    backgroundColor: '#f2efeb', 
    minHeight: '100vh',
    color: '#333'
  };

  const cardStyle = {
    backgroundColor: '#fff', 
    borderRadius: '15px', 
    padding: '20px', 
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
    textAlign: 'center'
  };

  // Estilo dos botões do mapa e do gráfico
  const buttonStyle = (isActive, color) => ({
    padding: '10px 20px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9em',
    backgroundColor: isActive ? color : '#e0e0e0',
    color: isActive ? '#fff' : '#666',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? `0 4px 10px ${color}66` : 'none'
  });

  return (
    <div style={containerStyle}>
      
      {/* CABEÇALHO */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: '0', fontSize: '3em', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-1px' }}>
          MONITORAMENTO DE QUALIDADE DO AR
        </h1>
        <h2 style={{ margin: '5px 0 20px 0', fontWeight: '700', fontSize: '2.5em', color: '#555' }}>
          LAB. VI - IFUSP
        </h2>
        <p style={{ fontSize: '1em', color: '#888' }}>
          📍 SP - BRASIL ({latest.latitude.toFixed(4)}, {latest.longitude.toFixed(4)})
        </p>
      </header>

      {/* 1. CAIXAS DE LEITURA (AGORA NO TOPO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ ...cardStyle, borderBottom: '5px solid rgb(255, 99, 132)' }}>
          <div style={{ color: '#888', fontSize: '0.9em' }}>TEMPERATURA</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'rgb(255, 99, 132)' }}>{latest.temp.toFixed(1)}°C</div>
        </div>
        <div style={{ ...cardStyle, borderBottom: '5px solid rgb(54, 162, 235)' }}>
          <div style={{ color: '#888', fontSize: '0.9em' }}>UMIDADE</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'rgb(54, 162, 235)' }}>{latest.humidity.toFixed(1)}%</div>
        </div>
        <div style={{ ...cardStyle, borderBottom: '5px solid rgb(255, 159, 64)' }}>
          <div style={{ color: '#888', fontSize: '0.9em' }}>GÁS (MQ9)</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'rgb(255, 159, 64)' }}>{latest.mq9_val}</div>
        </div>
        <div style={{ ...cardStyle, borderBottom: '5px solid rgb(75, 192, 192)' }}>
          <div style={{ color: '#888', fontSize: '0.9em' }}>AR (MQ135)</div>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: 'rgb(75, 192, 192)' }}>{latest.mq135_val}</div>
        </div>
      </div>

      {/* 2. MAPA INTERATIVO (VISÃO GERAL) */}
      <div style={{ marginBottom: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5em' }}>VISÃO GERAL (MAPA)</h2>
          
          {/* BOTÕES DO MAPA */}
          <div>
            <span style={{ marginRight: '10px', color: '#666', fontSize: '0.9em' }}>Visualizar:</span>
            <button style={buttonStyle(mapMode === 'temp', 'rgb(255, 99, 132)')} onClick={() => setMapMode('temp')}>Temp</button>
            <button style={buttonStyle(mapMode === 'hum', 'rgb(54, 162, 235)')} onClick={() => setMapMode('hum')}>Umid</button>
            <button style={buttonStyle(mapMode === 'mq9', 'rgb(255, 159, 64)')} onClick={() => setMapMode('mq9')}>MQ9</button>
            <button style={buttonStyle(mapMode === 'mq135', 'rgb(75, 192, 192)')} onClick={() => setMapMode('mq135')}>MQ135</button>
          </div>
        </div>

        <div style={{ height: '60vh', minHeight: '500px', ...cardStyle, padding: 0, border: '4px solid #fff', overflow: 'hidden' }}>
          <Map data={data} mode={mapMode} />
        </div>
      </div>

      {/* 3. LEITURAS POR SENSOR (ABAS/BOTÕES) */}
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>LEITURAS POR SENSOR (HISTÓRICO)</h2>
        
        {/* BOTÕES DE SELEÇÃO DO GRÁFICO */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
          <button style={buttonStyle(activeGraph === 'temp', 'rgb(255, 99, 132)')} onClick={() => setActiveGraph('temp')}>TEMPERATURA</button>
          <button style={buttonStyle(activeGraph === 'hum', 'rgb(54, 162, 235)')} onClick={() => setActiveGraph('hum')}>UMIDADE</button>
          <button style={buttonStyle(activeGraph === 'mq9', 'rgb(255, 159, 64)')} onClick={() => setActiveGraph('mq9')}>GÁS (MQ9)</button>
          <button style={buttonStyle(activeGraph === 'mq135', 'rgb(75, 192, 192)')} onClick={() => setActiveGraph('mq135')}>AR (MQ135)</button>
        </div>

        {/* ÁREA DO GRÁFICO ÚNICO (GRANDE) */}
        <div style={{ ...cardStyle, height: '400px', padding: '30px' }}>
          <Line data={activeChartData} options={commonOptions} />
        </div>
      </div>

    </div>
  );
}
