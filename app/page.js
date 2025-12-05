"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Import Map dynamically (Client-side only)
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div style={{height: '100%', width: '100%', background: '#ddd', borderRadius: '15px'}}>Carregando Mapa...</div>
});

// --- ICONS (SVG) ---
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default function Home() {
  const [data, setData] = useState([]);
  const [mapMode, setMapMode] = useState('temp'); 
  
  // Graph starts null (hidden) until clicked
  const [activeGraph, setActiveGraph] = useState(null); 
  
  // Menu States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSensorsSubmenuOpen, setIsSensorsSubmenuOpen] = useState(false);

  // Fetch Data
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

  // Data Processing
  const graphData = [...data].reverse(); 
  const labels = graphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
  const latest = data.length > 0 ? data[0] : { temp: 0, humidity: 0, mq9_val: 0, mq135_val: 0, latitude: 0, longitude: 0 };

  // --- CHART CONFIGURATIONS ---
  
  // 1. Overview (Small Side Graphs)
  const overviewOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }, 
    scales: { x: { display: false }, y: { display: true, ticks: { font: { size: 10 } } } }, 
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
      { label: 'MQ9', data: graphData.map(d => d.mq9_val), borderColor: 'rgb(255, 159, 64)', borderWidth: 2, tension: 0.4 },
      { label: 'MQ135', data: graphData.map(d => d.mq135_val), borderColor: 'rgb(75, 192, 192)', borderWidth: 2, tension: 0.4 },
    ],
  };

  // 2. Detailed (Bottom Graph)
  const detailOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { labels: { font: { size: 14, weight: 'bold' } } } 
    },
    scales: { y: { beginAtZero: false } }
  };

  const datasets = {
    temp: { label: 'Temperatura (°C)', data: graphData.map(d => d.temp), color: 'rgb(255, 99, 132)' },
    hum: { label: 'Umidade (%)', data: graphData.map(d => d.humidity), color: 'rgb(54, 162, 235)' },
    mq9: { label: 'Gás Combustível - MQ9 (PPM)', data: graphData.map(d => d.mq9_val), color: 'rgb(255, 159, 64)' },
    mq135: { label: 'Qualidade do Ar - MQ135', data: graphData.map(d => d.mq135_val), color: 'rgb(75, 192, 192)' }
  };

  const activeChartData = activeGraph ? {
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
  } : null;

  // --- STYLES HELPER ---
  
  // Helper to make background lighter version of the color
  const getCardStyle = (colorRgb) => ({
    backgroundColor: colorRgb.replace('rgb', 'rgba').replace(')', ', 0.15)'), 
    borderRadius: '0px', // SQUARED as requested
    padding: '20px 10px',     
    border: `2px solid ${colorRgb}`,
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '140px',
    transition: 'transform 0.2s',
    cursor: 'default'
  });

  const btnStyle = (key, color) => ({
    padding: '12px 25px',
    border: activeGraph === key ? `2px solid ${color}` : '1px solid #ccc',
    backgroundColor: activeGraph === key ? color : '#fff',
    color: activeGraph === key ? '#fff' : '#555',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    textTransform: 'uppercase'
  });

  return (
    <div className="main-container">
      <style jsx global>{`
        body { margin: 0; background-color: #f2efeb; font-family: 'Cerebri Sans', 'Arial', sans-serif; color: #333; }
        
        /* HEADER STRIP */
        .top-header {
          position: fixed; top: 0; left: 0; right: 0; height: 50px;
          background: #fff; border-bottom: 1px solid #ddd;
          display: flex; align-items: center; padding: 0 20px;
          z-index: 2000; font-size: 0.85rem; font-weight: 700; color: #555;
        }

        .menu-btn { cursor: pointer; margin-right: 15px; display: flex; align-items: center; }
        .menu-btn:hover { color: #000; }

        /* SIDEBAR */
        .sidebar {
          position: fixed; top: 50px; left: 0; bottom: 0; width: 260px;
          background: #fff; box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          transform: translateX(${isMenuOpen ? '0' : '-100%'});
          transition: transform 0.3s ease; z-index: 1999;
          padding: 20px 0;
        }
        .nav-item { padding: 15px 25px; border-bottom: 1px solid #f0f0f0; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #333; display: flex; justify-content: space-between; }
        .nav-item:hover { background: #f9f9f9; }
        .sub-nav { background: #fbfbfb; }
        .sub-item { padding: 12px 40px; border-bottom: 1px solid #f5f5f5; font-size: 0.85rem; color: #666; display: block; text-decoration: none; }
        .sub-item:hover { color: #000; background: #f0f0f0; }

        /* MAIN CONTENT */
        .content-wrapper { padding: 90px 8% 60px 8%; max-width: 1400px; margin: 0 auto; }
        
        .main-title { 
          text-align: center; font-size: 2.5rem; font-weight: 900; 
          margin-bottom: 40px; letter-spacing: -1px; color: #111; 
        }

        .cards-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px; margin-bottom: 40px;
        }
        
        .bold-separator {
          border: 0; border-top: 3px solid #000; 
          margin: 50px 0; opacity: 1;
        }

        .reading-val { font-size: 2.5em; font-weight: 800; line-height: 1.1; margin: 5px 0; }
        .reading-label { font-size: 0.9em; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        /* MIDDLE SECTION */
        .dashboard-mid { display: flex; gap: 30px; height: 500px; }
        .map-box { flex: 3; background: #fff; padding: 10px; border: 2px solid #ddd; position: relative; }
        .graphs-box { flex: 2; display: flex; flexDirection: column; gap: 15px; }
        .mini-graph { flex: 1; background: #fff; padding: 15px; border: 2px solid #ddd; }

        @media (max-width: 900px) {
          .dashboard-mid { flex-direction: column; height: auto; }
          .map-box { height: 400px; }
        }
      `}</style>
      
      {/* 1. HEADER (Top Strip) */}
      <div className="top-header">
        <div className="menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <MenuIcon />
        </div>
        <span>MONITORAMENTO DA QUALIDADE DO AR - LAB. VI - IFUSP - 2025</span>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <div className="sidebar">
        <div className="nav-item">O PROJETO</div>
        
        <div className="nav-item" onClick={() => setIsSensorsSubmenuOpen(!isSensorsSubmenuOpen)}>
          OS SENSORES <ChevronDown />
        </div>
        {isSensorsSubmenuOpen && (
          <div className="sub-nav">
            <a href="#" className="sub-item">DHT11 (Temp/Umid)</a>
            <a href="#" className="sub-item">MQ135 (Qualidade Ar)</a>
            <a href="#" className="sub-item">MQ9 (Gás Combustível)</a>
          </div>
        )}
      </div>

      {/* CONTENT OVERLAY (Closes menu when clicking outside) */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{position:'fixed', top:50, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.3)', zIndex:1998}} />}

      <div className="content-wrapper">
        
        {/* TITLE */}
        <h1 className="main-title">MONITORAMENTO DA QUALIDADE DO AR</h1>

        {/* 2. SQUARED ICONS (Cards) */}
        <div className="cards-grid">
          <div style={getCardStyle('rgb(255, 99, 132)')}>
            <div className="reading-label" style={{color: 'rgb(255, 99, 132)'}}>🌡️ Temperatura</div>
            <div className="reading-val" style={{color: 'rgb(255, 99, 132)'}}>{latest.temp.toFixed(2)}°C</div>
          </div>

          <div style={getCardStyle('rgb(54, 162, 235)')}>
            <div className="reading-label" style={{color: 'rgb(54, 162, 235)'}}>💧 Umidade</div>
            <div className="reading-val" style={{color: 'rgb(54, 162, 235)'}}>{latest.humidity.toFixed(2)}%</div>
          </div>

          <div style={getCardStyle('rgb(255, 159, 64)')}>
            <div className="reading-label" style={{color: 'rgb(255, 159, 64)'}}>🔥 Gás (MQ9)</div>
            <div className="reading-val" style={{color: 'rgb(255, 159, 64)'}}>{latest.mq9_val.toFixed(2)}</div>
          </div>

          <div style={getCardStyle('rgb(75, 192, 192)')}>
            <div className="reading-label" style={{color: 'rgb(75, 192, 192)'}}>💨 Ar (MQ135)</div>
            <div className="reading-val" style={{color: 'rgb(75, 192, 192)'}}>{latest.mq135_val.toFixed(2)}</div>
          </div>
        </div>

        {/* BOLD SEPARATOR 1 */}
        <hr className="bold-separator" />

        {/* 3. MIDDLE SECTION: MAP (Left) & GRAPHS (Right) */}
        <div className="dashboard-mid">
          
          {/* MAP */}
          <div className="map-box">
             {/* Simple Map Controls inside the map box */}
             <div style={{position: 'absolute', top: 15, right: 15, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '5px', borderRadius: '5px'}}>
               <select onChange={(e) => setMapMode(e.target.value)} value={mapMode} style={{padding: '5px', border: '1px solid #ccc'}}>
                 <option value="temp">🌡️ Temperatura</option>
                 <option value="hum">💧 Umidade</option>
                 <option value="mq9">🔥 MQ9</option>
                 <option value="mq135">💨 MQ135</option>
               </select>
             </div>
             <Map data={data} mode={mapMode} />
          </div>

          {/* STACKED GRAPHS */}
          <div className="graphs-box">
            <div className="mini-graph">
              <h4 style={{margin: '0 0 10px 0', fontSize:'0.9rem', color: '#666'}}>CLIMA (TEMP / UMID)</h4>
              <div style={{height: '180px'}}>
                <Line data={climateChart} options={overviewOptions} />
              </div>
            </div>
            <div className="mini-graph">
              <h4 style={{margin: '0 0 10px 0', fontSize:'0.9rem', color: '#666'}}>GASES (MQ9 / MQ135)</h4>
              <div style={{height: '180px'}}>
                <Line data={gasChart} options={overviewOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* BOLD SEPARATOR 2 */}
        <hr className="bold-separator" />

        {/* 4. LEITURA POR SENSOR (Click to Open) */}
        <div style={{textAlign: 'center', minHeight: '400px'}}>
          <h2 style={{fontSize: '1.8rem', fontWeight: '900', marginBottom: '30px', textTransform: 'uppercase'}}>LEITURA POR SENSOR</h2>
          
          <div style={{display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '30px'}}>
            <button style={btnStyle('temp', 'rgb(255, 99, 132)')} onClick={() => setActiveGraph(activeGraph === 'temp' ? null : 'temp')}>Temperatura</button>
            <button style={btnStyle('hum', 'rgb(54, 162, 235)')} onClick={() => setActiveGraph(activeGraph === 'hum' ? null : 'hum')}>Umidade</button>
            <button style={btnStyle('mq9', 'rgb(255, 159, 64)')} onClick={() => setActiveGraph(activeGraph === 'mq9' ? null : 'mq9')}>Gás (MQ9)</button>
            <button style={btnStyle('mq135', 'rgb(75, 192, 192)')} onClick={() => setActiveGraph(activeGraph === 'mq135' ? null : 'mq135')}>Ar (MQ135)</button>
          </div>

          {/* GRAPH CONTAINER - Only shows if activeGraph is not null */}
          <div style={{
            background: '#fff', 
            padding: '20px', 
            border: '2px solid #ddd', 
            height: '400px', 
            display: activeGraph ? 'block' : 'none', // Logic: Only open if clicked
            animation: 'fadeIn 0.5s'
          }}>
            {activeGraph && <Line data={activeChartData} options={detailOptions} />}
          </div>

          {!activeGraph && (
            <div style={{color: '#999', marginTop: '50px', fontStyle: 'italic'}}>
              Selecione um botão acima para visualizar o gráfico histórico detalhado.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
