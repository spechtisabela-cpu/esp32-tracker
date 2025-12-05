"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Map Import
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div style={{height: '100%', width: '100%', background: '#ddd', borderRadius: '15px', display:'flex', alignItems:'center', justifyContent:'center'}}>Carregando Mapa...</div>
});

// --- ICONS ---
const MenuIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#54504a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  const [currentView, setCurrentView] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSensorsSubmenuOpen, setIsSensorsSubmenuOpen] = useState(false);
  const [mapMode, setMapMode] = useState('temp'); 
  const [activeGraph, setActiveGraph] = useState(null); 
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch Data
  async function fetchData() {
    try {
      const res = await fetch('/api/sensors');
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        if (!selectedDate && json.data.length > 0) {
           const latestDate = new Date(json.data[0].created_at).toLocaleDateString('pt-BR');
           setSelectedDate(latestDate);
        }
      } 
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- DATA PROCESSING ---
  const latest = data.length > 0 ? data[0] : { temp: 0, humidity: 0, mq9_val: 0, mq135_val: 0, latitude: 0, longitude: 0 };
  const graphData = [...data].reverse(); 
  const availableDates = [...new Set(data.map(d => new Date(d.created_at).toLocaleDateString('pt-BR')))];
  
  const getFilteredData = () => graphData.filter(d => new Date(d.created_at).toLocaleDateString('pt-BR') === selectedDate);
  
  const filteredGraphData = getFilteredData();
  const filteredLabels = filteredGraphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
  const allLabels = graphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));

  // --- CHART OPTIONS (UPDATED FOR LEGENDS) ---
  const overviewOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true, // SHOW LEGEND
        position: 'top',
        align: 'end',
        labels: { boxWidth: 10, font: { size: 10, weight: 'bold' }, color: '#54504a' } 
      } 
    },
    scales: { 
      x: { display: false }, 
      y: { display: true, ticks: { font: { weight: 'bold', size: 10 }, color: '#54504a' } } 
    }
  };

  const detailOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      x: { display: true, ticks: { color: '#54504a' } }, 
      y: { display: true, ticks: { color: '#54504a', font: { weight: 'bold' } } } 
    },
    plugins: { legend: { display: true, labels: { color: '#54504a', font: { weight: 'bold', size: 14 } } } }
  };

  const colors = {
    temp: 'rgb(255, 99, 132)',
    hum: 'rgb(54, 162, 235)',
    mq9: 'rgb(255, 159, 64)',
    mq135: 'rgb(75, 192, 192)',
    text: '#54504a',
    bg: '#f2efeb',
    cardBg: '#faf7f2'
  };

  // --- HELPER: MAP LEGEND RENDERER ---
  const renderMapScale = () => {
    let gradient = '';
    let minLabel = '0';
    let maxLabel = '100';
    let unit = '';

    if (mapMode === 'temp') {
      // Blue (240deg) to Red (0deg)
      gradient = 'linear-gradient(90deg, hsl(240,100%,50%), hsl(0,100%,50%))';
      minLabel = '0°C'; maxLabel = '40°C'; unit = 'Temperatura';
    } else if (mapMode === 'hum') {
      // Transparent Blue to Solid Blue
      gradient = 'linear-gradient(90deg, rgba(0,0,255,0.3), rgba(0,0,255,1))';
      minLabel = '0%'; maxLabel = '100%'; unit = 'Umidade';
    } else if (mapMode === 'mq9' || mapMode === 'mq135') {
      // Green (120deg) to Red (0deg)
      gradient = 'linear-gradient(90deg, hsl(120,100%,40%), hsl(0,100%,40%))';
      minLabel = '0'; maxLabel = '500'; unit = 'PPM';
    }

    return (
      <div style={{
        position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000,
        background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px',
        border: '1px solid #ccc', width: '200px'
      }}>
        <div style={{fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px', textAlign:'center'}}>{unit}</div>
        <div style={{height: '10px', width: '100%', background: gradient, borderRadius: '5px'}}></div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '3px'}}>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    );
  };

  // --- STYLE HELPERS ---
  const getCardStyle = (color) => ({
    backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.15)'), 
    borderRadius: '15px', 
    padding: '15px 10px',     
    border: `2px solid ${color}`,
    textAlign: 'center',
    height: '100%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    minHeight: '100px', 
    color: colors.text,
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
  });

  const btnStyle = (key, color) => ({
    padding: '10px 20px',
    border: 'none',
    backgroundColor: activeGraph === key ? color : '#e0e0e0',
    color: activeGraph === key ? '#fff' : '#54504a',
    fontWeight: '900',
    cursor: 'pointer',
    borderRadius: '15px', 
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    margin: '0 5px',
    boxShadow: activeGraph === key ? `0 4px 10px ${color}66` : 'none',
  });

  const navigate = (view) => {
    setCurrentView(view);
    setIsMenuOpen(false);
  };

  return (
    <div className="main-container">
      <style jsx global>{`
        body { margin: 0; background-color: ${colors.bg}; font-family: 'Cerebri Sans', 'Arial', sans-serif; color: ${colors.text}; }
        .top-header {
          position: fixed; top: 0; left: 0; right: 0; height: 60px;
          background: ${colors.bg}; border-bottom: 2px solid rgba(0,0,0,0.1);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 30px; z-index: 2000;
        }
        .header-title { font-weight: 900; font-size: 1.1em; text-align: center; position: absolute; left: 0; right: 0; pointer-events: none; }
        .header-right { font-weight: 800; font-size: 0.9em; z-index: 2001; }
        .sidebar {
          position: fixed; top: 60px; left: 0; bottom: 0; width: 280px;
          background: #fff; box-shadow: 4px 0 15px rgba(0,0,0,0.05);
          transform: translateX(${isMenuOpen ? '0' : '-100%'});
          transition: transform 0.3s ease; z-index: 1999; padding: 30px 0;
        }
        .nav-item { padding: 15px 30px; font-weight: 800; color: ${colors.text}; cursor: pointer; display: flex; justify-content: space-between; }
        .nav-item:hover { background: #f5f5f5; }
        .sub-item { padding: 12px 50px; font-size: 0.9rem; font-weight: 600; color: #777; cursor: pointer; display: block; }
        .sub-item:hover { color: #000; background: #fafafa; }
        .content-wrapper { padding: 90px 8% 60px 8%; max-width: 1400px; margin: 0 auto; }
        .soft-line { height: 2px; border: 0; background: linear-gradient(90deg, rgba(84,80,74,0), rgba(84,80,74,0.4), rgba(84,80,74,0)); margin: 60px 0; }
        .rounded-box { background-color: ${colors.cardBg}; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 15px rgba(0,0,0,0.03); padding: 20px; }
        .bold-text { font-weight: 900 !important; }
        
        /* SENSOR PAGE GRID */
        .sensor-page-grid { display: flex; gap: 40px; margin-top: 30px; }
        .sensor-left-desc { flex: 1; background: #fff; border-radius: 20px; padding: 30px; border: 2px solid #eee; height: fit-content; }
        .sensor-right-graphs { flex: 2; }
        @media (max-width: 900px) { .sensor-page-grid { flex-direction: column; } }
      `}</style>
      
      <div className="top-header">
        <div style={{cursor: 'pointer', zIndex: 2001}} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <MenuIcon />
        </div>
        <div className="header-title">MONITORAMENTO DA QUALIDADE DO AR</div>
        <div className="header-right">LAB. VI | IFUSP</div>
      </div>

      <div className="sidebar">
        <div className="nav-item" onClick={() => navigate('home')}>HOME</div>
        <div className="nav-item" onClick={() => navigate('project')}>O PROJETO</div>
        <div className="nav-item" onClick={() => setIsSensorsSubmenuOpen(!isSensorsSubmenuOpen)}>
          OS SENSORES <ChevronDown />
        </div>
        {isSensorsSubmenuOpen && (
          <div style={{background: '#fcfcfc'}}>
            <span className="sub-item" onClick={() => navigate('dht11')}>DHT11 (Temp/Umid)</span>
            <span className="sub-item" onClick={() => navigate('mq9')}>MQ9 (Gás)</span>
            <span className="sub-item" onClick={() => navigate('mq135')}>MQ135 (Ar)</span>
          </div>
        )}
      </div>

      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{position:'fixed', top:60, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.2)', zIndex:1998}} />}

      <div className="content-wrapper">
        
        {currentView === 'home' && (
          <>
            <h1 style={{textAlign: 'center', fontSize: '2.5rem', fontWeight: '900', marginBottom: '40px'}}>
              MONITORAMENTO DA QUALIDADE DO AR
            </h1>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px'}}>
              <div style={getCardStyle(colors.temp)}>
                <div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Temperatura</div>
                <div style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.temp?.toFixed(2) || '0.00'}°C</div>
              </div>
              <div style={getCardStyle(colors.hum)}>
                <div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Umidade</div>
                <div style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.humidity?.toFixed(2) || '0.00'}%</div>
              </div>
              <div style={getCardStyle(colors.mq9)}>
                <div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Gás (MQ9)</div>
                <div style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.mq9_val?.toFixed(2) || '0.00'}</div>
              </div>
              <div style={getCardStyle(colors.mq135)}>
                <div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Ar (MQ135)</div>
                <div style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.mq135_val?.toFixed(2) || '0.00'}</div>
              </div>
            </div>

            <hr className="soft-line" />

            <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
              
              {/* MAP BOX */}
              <div style={{flex: '1 1 500px', minHeight: '550px', display: 'flex', flexDirection: 'column'}}>
                {/* Fixed Title Styling: Bold LOCAL, Normal City */}
                <h3 style={{margin: '0 0 15px 0', fontSize: '1.4em', color: colors.text}}>
                  <span className="bold-text">LOCAL:</span> <span>SÃO PAULO - SP (IFUSP)</span>
                </h3>
                
                <div className="rounded-box" style={{flex: 1, padding: '5px', background: '#fff', border: '3px solid #fff', position: 'relative'}}>
                  <Map data={data} mode={mapMode} />
                  
                  {/* MAP SCALE LEGEND (Visual Bar) */}
                  {renderMapScale()}
                </div>

                <div style={{marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                  <button style={{padding:'5px 10px', fontWeight:'bold', borderRadius:'10px', border:'1px solid #ccc', background: mapMode === 'temp' ? colors.temp : '#fff', color: mapMode === 'temp' ? '#fff' : '#555'}} onClick={() => setMapMode('temp')}>Temp</button>
                  <button style={{padding:'5px 10px', fontWeight:'bold', borderRadius:'10px', border:'1px solid #ccc', background: mapMode === 'hum' ? colors.hum : '#fff', color: mapMode === 'hum' ? '#fff' : '#555'}} onClick={() => setMapMode('hum')}>Umid</button>
                  <button style={{padding:'5px 10px', fontWeight:'bold', borderRadius:'10px', border:'1px solid #ccc', background: mapMode === 'mq9' ? colors.mq9 : '#fff', color: mapMode === 'mq9' ? '#fff' : '#555'}} onClick={() => setMapMode('mq9')}>Gás</button>
                </div>
              </div>

              {/* OVERVIEW GRAPHS */}
              <div style={{flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '30px'}}>
                <div className="rounded-box" style={{flex: 1}}>
                  <h3 className="bold-text" style={{margin: '0 0 15px 0'}}>CLIMA</h3>
                  <div style={{height: '200px'}}>
                    <Line data={{
                      labels: allLabels,
                      datasets: [
                        { label: 'Temp (°C)', data: graphData.map(d => d.temp), borderColor: colors.temp, borderWidth: 2.5, pointRadius: 0 },
                        { label: 'Umid (%)', data: graphData.map(d => d.humidity), borderColor: colors.hum, borderWidth: 2.5, pointRadius: 0 }
                      ]
                    }} options={overviewOptions} />
                  </div>
                </div>

                <div className="rounded-box" style={{flex: 1}}>
                  <h3 className="bold-text" style={{margin: '0 0 15px 0'}}>GASES</h3>
                  <div style={{height: '200px'}}>
                    <Line data={{
                      labels: allLabels,
                      datasets: [
                        { label: 'MQ9 (PPM)', data: graphData.map(d => d.mq9_val), borderColor: colors.mq9, borderWidth: 2.5, pointRadius: 0 },
                        { label: 'MQ135 (PPM)', data: graphData.map(d => d.mq135_val), borderColor: colors.mq135, borderWidth: 2.5, pointRadius: 0 }
                      ]
                    }} options={overviewOptions} />
                  </div>
                </div>
              </div>
            </div>

            <hr className="soft-line" />

            <div style={{textAlign: 'center'}}>
              <h2 className="bold-text" style={{fontSize: '2em', textTransform: 'uppercase', marginBottom: '30px'}}>LEITURA POR SENSOR</h2>
              <div style={{marginBottom: '30px'}}>
                <button style={btnStyle('temp', colors.temp)} onClick={() => setActiveGraph(activeGraph === 'temp' ? null : 'temp')}>TEMPERATURA</button>
                <button style={btnStyle('hum', colors.hum)} onClick={() => setActiveGraph(activeGraph === 'hum' ? null : 'hum')}>UMIDADE</button>
                <button style={btnStyle('mq9', colors.mq9)} onClick={() => setActiveGraph(activeGraph === 'mq9' ? null : 'mq9')}>GÁS (MQ9)</button>
                <button style={btnStyle('mq135', colors.mq135)} onClick={() => setActiveGraph(activeGraph === 'mq135' ? null : 'mq135')}>AR (MQ135)</button>
              </div>

              {activeGraph && (
                 <div className="rounded-box" style={{background: '#fff', height: '400px'}}>
                    <Line data={{
                      labels: allLabels,
                      datasets: [{
                        // Explicit Legend Logic for Bottom Graph
                        label: activeGraph === 'temp' ? 'Temperatura (°C)' : 
                               activeGraph === 'hum' ? 'Umidade (%)' : 
                               activeGraph === 'mq9' ? 'Gás MQ9 (PPM)' : 'Ar MQ135 (PPM)',
                        data: activeGraph === 'temp' ? graphData.map(d => d.temp) : activeGraph === 'hum' ? graphData.map(d => d.humidity) : activeGraph === 'mq9' ? graphData.map(d => d.mq9_val) : graphData.map(d => d.mq135_val),
                        borderColor: activeGraph === 'temp' ? colors.temp : activeGraph === 'hum' ? colors.hum : activeGraph === 'mq9' ? colors.mq9 : colors.mq135,
                        backgroundColor: (activeGraph === 'temp' ? colors.temp : activeGraph === 'hum' ? colors.hum : activeGraph === 'mq9' ? colors.mq9 : colors.mq135).replace('rgb','rgba').replace(')', ',0.2)'),
                        fill: true, tension: 0.3
                      }]
                    }} options={detailOptions} />
                 </div>
              )}
            </div>
          </>
        )}

        {currentView === 'project' && (
          <div className="rounded-box" style={{background: '#fff', minHeight: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <h2 className="bold-text">EM BREVE</h2>
          </div>
        )}

        {/* SENSOR PAGES */}
        {(currentView === 'dht11' || currentView === 'mq9' || currentView === 'mq135') && (
          <div>
            <h1 className="bold-text" style={{fontSize: '2.5em', textTransform: 'uppercase'}}>
              SENSOR: {currentView === 'dht11' ? 'DHT11' : currentView.toUpperCase()}
            </h1>
            
            <div style={{margin: '20px 0'}}>
              <label className="bold-text" style={{marginRight: '10px'}}>SELECIONAR DATA:</label>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{padding: '10px', borderRadius: '10px', border: '2px solid #ddd', fontSize: '1rem', fontWeight: 'bold', color: colors.text}}
              >
                {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
              </select>
            </div>

            <div className="sensor-page-grid">
              
              {/* 1. LEFT: DESCRIPTION (Swapped as requested) */}
              <div className="sensor-left-desc">
                <h3 className="bold-text">SOBRE O SENSOR</h3>
                <p style={{lineHeight: '1.6'}}>Descrição do sensor em breve.</p>
              </div>

              {/* 2. RIGHT: GRAPHS */}
              <div className="sensor-right-graphs">
                {currentView === 'dht11' && (
                  <>
                     <div className="rounded-box" style={{marginBottom: '20px', background: '#fff'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                          <h3 className="bold-text">TEMPERATURA (°C)</h3>
                          <h3 className="bold-text" style={{color: colors.temp}}>Última: {latest.temp?.toFixed(2) || '0'}°C</h3>
                        </div>
                        <div style={{height: '250px'}}>
                          <Line data={{
                             labels: filteredLabels,
                             datasets: [{ label: 'Temperatura (°C)', data: filteredGraphData.map(d => d.temp), borderColor: colors.temp, tension: 0.3 }]
                          }} options={detailOptions} />
                        </div>
                     </div>
                     <div className="rounded-box" style={{background: '#fff'}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                          <h3 className="bold-text">UMIDADE (%)</h3>
                          <h3 className="bold-text" style={{color: colors.hum}}>Última: {latest.humidity?.toFixed(2) || '0'}%</h3>
                        </div>
                        <div style={{height: '250px'}}>
                          <Line data={{
                             labels: filteredLabels,
                             datasets: [{ label: 'Umidade (%)', data: filteredGraphData.map(d => d.humidity), borderColor: colors.hum, tension: 0.3 }]
                          }} options={detailOptions} />
                        </div>
                     </div>
                  </>
                )}
                
                {currentView === 'mq9' && (
                   <div className="rounded-box" style={{background: '#fff'}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                        <h3 className="bold-text">GÁS COMBUSTÍVEL (PPM)</h3>
                        <h3 className="bold-text" style={{color: colors.mq9}}>Última: {latest.mq9_val?.toFixed(2) || '0'}</h3>
                      </div>
                      <div style={{height: '300px'}}>
                        <Line data={{
                           labels: filteredLabels,
                           datasets: [{ label: 'MQ9 (PPM)', data: filteredGraphData.map(d => d.mq9_val), borderColor: colors.mq9, fill: true, backgroundColor: 'rgba(255, 159, 64, 0.2)', tension: 0.3 }]
                        }} options={detailOptions} />
                      </div>
                   </div>
                )}

                {currentView === 'mq135' && (
                   <div className="rounded-box" style={{background: '#fff'}}>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                        <h3 className="bold-text">QUALIDADE DO AR</h3>
                        <h3 className="bold-text" style={{color: colors.mq135}}>Última: {latest.mq135_val?.toFixed(2) || '0'}</h3>
                      </div>
                      <div style={{height: '300px'}}>
                        <Line data={{
                           labels: filteredLabels,
                           datasets: [{ label: 'MQ135 (PPM)', data: filteredGraphData.map(d => d.mq135_val), borderColor: colors.mq135, fill: true, backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.3 }]
                        }} options={detailOptions} />
                      </div>
                   </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
