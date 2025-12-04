"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

// Registrar componentes dos gráficos
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Importar Mapa Dinamicamente
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <p>Carregando Mapa...</p>
});

export default function Home() {
  const [data, setData] = useState([]);

  // Buscar Dados
  async function fetchData() {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.data) {
        setData(json.data); 
      }
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Atualiza a cada 5s
    return () => clearInterval(interval);
  }, []);

  // --- Preparar Dados para Gráficos ---
  // Inverter para o tempo ir da Esquerda -> Direita
  const graphData = [...data].reverse(); 
  const labels = graphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));

  // Pegar a leitura MAIS RECENTE (Índice 0)
  const latest = data.length > 0 ? data[0] : { temp: 0, humidity: 0, mq9_val: 0, mq135_val: 0, latitude: 0, longitude: 0 };

  // --- CONFIGURAÇÃO DOS GRÁFICOS ---

  // GRÁFICOS COMBINADOS (Seção Superior)
  const climateChart = {
    labels,
    datasets: [
      { label: 'Temperatura (°C)', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', tension: 0.3 },
      { label: 'Umidade (%)', data: graphData.map(d => d.humidity), borderColor: 'rgb(54, 162, 235)', tension: 0.3 },
    ],
  };

  const gasChart = {
    labels,
    datasets: [
      { label: 'MQ9 (Gás Combustível)', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true },
      { label: 'MQ135 (Qualidade do Ar)', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', tension: 0.3 },
    ],
  };

  // GRÁFICOS INDIVIDUAIS (Seção Inferior)
  const tempOnlyChart = {
    labels,
    datasets: [{ label: 'Temperatura (°C)', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.3 }]
  };
  const humOnlyChart = {
    labels,
    datasets: [{ label: 'Umidade (%)', data: graphData.map(d => d.humidity), borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.3 }]
  };
  const mq9OnlyChart = {
    labels,
    datasets: [{ label: 'MQ9 - Gás', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true, tension: 0.3 }]
  };
  const mq135OnlyChart = {
    labels,
    datasets: [{ label: 'MQ135 - Ar', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.3 }]
  };

  // --- ESTILOS ---
  const containerStyle = {
    padding: '20px', 
    fontFamily: "'Cerebri Sans', 'Helvetica Neue', Arial, sans-serif", // Tentativa de usar Cerebri ou fallback
    maxWidth: '1400px', 
    margin: '0 auto', 
    backgroundColor: '#f2efeb', // Cor de fundo bege pedida
    minHeight: '100vh',
    color: '#333'
  };

  const cardStyle = {
    border: '1px solid #e0e0e0', 
    padding: '15px', 
    borderRadius: '12px', 
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    backgroundColor: '#fff'
  };

  const statBoxStyle = {
    ...cardStyle,
    textAlign: 'center',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const statNumberStyle = {
    fontSize: '2.5em',
    fontWeight: 'bold',
    margin: '10px 0'
  };

  return (
    <div style={containerStyle}>
      {/* CABEÇALHO */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: '0', fontSize: '2.5em', color: '#2c3e50' }}>Monitoramento de Qualidade do Ar - Lab. VI</h1>
        <h3 style={{ margin: '5px 0', fontWeight: 'normal', color: '#7f8c8d' }}>
          📍 SP - Brasil <span style={{fontSize: '0.7em'}}>({latest.latitude.toFixed(4)}, {latest.longitude.toFixed(4)})</span>
        </h3>
      </header>
      
      {/* SEÇÃO 1: MAPA */}
      <div style={{ height: '50vh', minHeight: '400px', marginBottom: '30px', border: '4px solid #fff', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <Map data={data} />
      </div>

      {/* SEÇÃO 2: GRÁFICOS COMBINADOS (RESUMO) */}
      <h2 style={{ borderLeft: '5px solid #2c3e50', paddingLeft: '10px', marginBottom: '20px' }}>Visão Geral</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h3 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>🌤️ Clima (Temp & Umidade)</h3>
          <Line data={climateChart} />
        </div>
        <div style={cardStyle}>
          <h3 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>⚠️ Gases (MQ9 & MQ135)</h3>
          <Line data={gasChart} />
        </div>
      </div>

      {/* SEÇÃO 3: CAIXAS DE LEITURA (CARDS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* Card Temp */}
        <div style={{ ...statBoxStyle, borderTop: '6px solid rgb(255, 99, 132)' }}>
          <div style={{ fontSize: '1.2em', color: '#555' }}>Temperatura</div>
          <div style={{ ...statNumberStyle, color: 'rgb(255, 99, 132)' }}>{latest.temp.toFixed(1)}°C</div>
        </div>

        {/* Card Umidade */}
        <div style={{ ...statBoxStyle, borderTop: '6px solid rgb(54, 162, 235)' }}>
          <div style={{ fontSize: '1.2em', color: '#555' }}>Umidade</div>
          <div style={{ ...statNumberStyle, color: 'rgb(54, 162, 235)' }}>{latest.humidity.toFixed(1)}%</div>
        </div>

        {/* Card MQ9 */}
        <div style={{ ...statBoxStyle, borderTop: '6px solid rgb(255, 159, 64)' }}>
          <div style={{ fontSize: '1.2em', color: '#555' }}>MQ9 (Gás)</div>
          <div style={{ ...statNumberStyle, color: 'rgb(255, 159, 64)' }}>{latest.mq9_val}</div>
          <div style={{ fontSize: '0.8em', color: '#999' }}>PPM (Estimado)</div>
        </div>

        {/* Card MQ135 */}
        <div style={{ ...statBoxStyle, borderTop: '6px solid rgb(75, 192, 192)' }}>
          <div style={{ fontSize: '1.2em', color: '#555' }}>MQ135 (Ar)</div>
          <div style={{ ...statNumberStyle, color: 'rgb(75, 192, 192)' }}>{latest.mq135_val}</div>
          <div style={{ fontSize: '0.8em', color: '#999' }}>Qualidade</div>
        </div>

      </div>

      {/* DIVISÓRIA */}
      <hr style={{ border: '0', height: '2px', backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0))', margin: '50px 0' }} />

      {/* SEÇÃO 4: GRÁFICOS DETALHADOS (4 SEPARADOS) */}
      <h2 style={{ borderLeft: '5px solid #2c3e50', paddingLeft: '10px', marginBottom: '20px' }}>Detalhamento por Sensor</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '20px',
        marginBottom: '50px'
      }}>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>🌡️ Temperatura</h4>
          <Line data={tempOnlyChart} />
        </div>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>💧 Umidade</h4>
          <Line data={humOnlyChart} />
        </div>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>🔥 MQ9 (CO/Gás)</h4>
          <Line data={mq9OnlyChart} />
        </div>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>💨 MQ135 (Qualidade)</h4>
          <Line data={mq135OnlyChart} />
        </div>
      </div>

    </div>
  );
}
