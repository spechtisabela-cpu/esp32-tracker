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

  // --- CONFIGURAÇÃO DOS GRÁFICOS ---
  // Opções para esconder a legenda e deixar o gráfico mais limpo nos menores
  const miniChartOptions = {
    plugins: { legend: { display: false } },
    scales: { x: { display: false } }, // Esconde datas no mini gráfico para economizar espaço
    maintainAspectRatio: false,
  };

  // Gráficos Combinados (Direita)
  const climateChart = {
    labels,
    datasets: [
      { label: 'Temp', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', borderWidth: 2, pointRadius: 0, tension: 0.4 },
      { label: 'Umid', data: graphData.map(d => d.humidity), borderColor: 'rgb(54, 162, 235)', borderWidth: 2, pointRadius: 0, tension: 0.4 },
    ],
  };

  const gasChart = {
    labels,
    datasets: [
      { label: 'MQ9', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true, pointRadius: 0 },
      { label: 'MQ135', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', borderWidth: 2, pointRadius: 0 },
    ],
  };

  // Gráficos Detalhados (Inferior)
  const tempOnlyChart = { labels, datasets: [{ label: 'Temp (°C)', data: graphData.map(d => d.temp), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: true, tension: 0.3 }] };
  const humOnlyChart = { labels, datasets: [{ label: 'Umid (%)', data: graphData.map(d => d.humidity), borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.3 }] };
  const mq9OnlyChart = { labels, datasets: [{ label: 'MQ9 (PPM)', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)', fill: true, tension: 0.3 }] };
  const mq135OnlyChart = { labels, datasets: [{ label: 'MQ135 (Nível)', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.3 }] };

  // --- ESTILOS ---
  const containerStyle = {
    padding: '30px', 
    fontFamily: "'Cerebri Sans', 'Helvetica Neue', Arial, sans-serif", 
    backgroundColor: '#f2efeb', 
    minHeight: '100vh',
    color: '#333'
  };

  const sectionTitleStyle = {
    borderLeft: '6px solid #2c3e50', 
    paddingLeft: '15px', 
    marginBottom: '20px', 
    textTransform: 'uppercase', 
    letterSpacing: '1px',
    color: '#2c3e50'
  };

  const cardStyle = {
    backgroundColor: '#fff', 
    borderRadius: '15px', 
    padding: '20px', 
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    height: '100%'
  };

  return (
    <div style={containerStyle}>
      
      {/* CABEÇALHO */}
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: '0', fontSize: '2.8em', fontWeight: '800', color: '#1a1a1a', letterSpacing: '-1px' }}>
          MONITORAMENTO DE QUALIDADE DO AR
        </h1>
        <h3 style={{ margin: '10px 0 0 0', fontWeight: '400', fontSize: '1.2em', color: '#666' }}>
          (LAB. VI - IFUSP)
        </h3>
        <p style={{ marginTop: '5px', fontSize: '0.9em', color: '#999' }}>
          📍 SP - BRASIL ({latest.latitude.toFixed(4)}, {latest.longitude.toFixed(4)})
        </p>
      </header>
      
      {/* SEÇÃO 1: VISÃO GERAL (MAPA ESQUERDA + GRÁFICOS DIREITA) */}
      <h2 style={sectionTitleStyle}>VISÃO GERAL</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        
        {/* COLUNA ESQUERDA: MAPA (65% largura) */}
        <div style={{ flex: '2', minWidth: '400px', height: '500px' }}>
           <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', border: '4px solid #fff' }}>
             <Map data={data} />
           </div>
        </div>

        {/* COLUNA DIREITA: GRÁFICOS RESUMO (35% largura) */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Gráfico 1: Clima */}
          <div style={{ ...cardStyle, flex: 1, minHeight: '200px' }}>
            <h4 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>🌦️ Clima</h4>
            <div style={{ height: '160px' }}>
              <Line data={climateChart} options={miniChartOptions} />
            </div>
          </div>
          {/* Gráfico 2: Gases */}
          <div style={{ ...cardStyle, flex: 1, minHeight: '200px' }}>
            <h4 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>⚠️ Gases</h4>
            <div style={{ height: '160px' }}>
              <Line data={gasChart} options={miniChartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* BOXES COLORIDOS (MANTIDO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
        <div style={{ ...cardStyle, borderTop: '6px solid rgb(255, 99, 132)', textAlign: 'center' }}>
          <div style={{ color: '#555' }}>TEMPERATURA</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'rgb(255, 99, 132)' }}>{latest.temp.toFixed(1)}°C</div>
        </div>
        <div style={{ ...cardStyle, borderTop: '6px solid rgb(54, 162, 235)', textAlign: 'center' }}>
          <div style={{ color: '#555' }}>UMIDADE</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'rgb(54, 162, 235)' }}>{latest.humidity.toFixed(1)}%</div>
        </div>
        <div style={{ ...cardStyle, borderTop: '6px solid rgb(255, 159, 64)', textAlign: 'center' }}>
          <div style={{ color: '#555' }}>CO/GÁS (MQ9)</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'rgb(255, 159, 64)' }}>{latest.mq9_val}</div>
        </div>
        <div style={{ ...cardStyle, borderTop: '6px solid rgb(75, 192, 192)', textAlign: 'center' }}>
          <div style={{ color: '#555' }}>QUALIDADE (MQ135)</div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'rgb(75, 192, 192)' }}>{latest.mq135_val}</div>
        </div>
      </div>

      {/* DIVISÓRIA */}
      <hr style={{ border: '0', height: '2px', backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0), #ccc, rgba(0, 0, 0, 0))', margin: '50px 0' }} />

      {/* SEÇÃO 2: LEITURAS POR SENSOR */}
      <h2 style={sectionTitleStyle}>LEITURAS POR SENSOR</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '50px' }}>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>🌡️ TEMPERATURA (DHT11)</h4>
          <Line data={tempOnlyChart} />
        </div>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>💧 UMIDADE (DHT11)</h4>
          <Line data={humOnlyChart} />
        </div>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>🔥 CO/GÁS (MQ9)</h4>
          <Line data={mq9OnlyChart} />
        </div>
        <div style={cardStyle}>
          <h4 style={{ margin: '0 0 15px 0', color: '#555' }}>💨 QUALIDADE DO AR (MQ135)</h4>
          <Line data={mq135OnlyChart} />
        </div>
      </div>

    </div>
  );
}
