"use client";
import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic'; 
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Map = dynamic(() => import('./components/Map'), { 
  ssr: false, 
  loading: () => <div style={{height:'100%', width:'100%', background:'#ddd', borderRadius:'15px', display:'flex', alignItems:'center', justifyContent:'center'}}>Carregando Mapa...</div>
});

const MenuIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#54504a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;

const getValue = (obj, keys) => {
  if (!obj) return 0;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return Number(obj[key]);
    }
  }
  return 0;
};

export default function Home() {
  const [rawData, setRawData] = useState([]);
  const [currentView, setCurrentView] = useState('home'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSensorsSubmenuOpen, setIsSensorsSubmenuOpen] = useState(false);
  const [mapMode, setMapMode] = useState('temp'); 
  const [activeGraph, setActiveGraph] = useState(null); 
  const [selectedDate, setSelectedDate] = useState('');
  const [dhtMode, setDhtMode] = useState('temp'); 
  const [dhtColorActive, setDhtColorActive] = useState(false); 

  const sectionMedidas = useRef(null);
  const sectionMapas = useRef(null);
  const sectionLeitura = useRef(null);

  async function fetchData() {
    try {
      const res = await fetch('/api/sensors', { cache: 'no-store' });
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setRawData(json.data);
        if (!selectedDate && json.data.length > 0) {
           const sorted = [...json.data].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
           setSelectedDate(new Date(sorted[0].created_at).toLocaleDateString('pt-BR'));
        }
      } 
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (ref) => {
    if (ref.current) {
      const y = ref.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDhtChange = (mode) => { setDhtMode(mode); setDhtColorActive(true); };
  const navigate = (view) => { setCurrentView(view); setIsMenuOpen(false); setDhtColorActive(false); };

  const cleanData = rawData.map(d => ({
    created_at: d.created_at,
    latitude: getValue(d, ['latitude', 'lat']),
    longitude: getValue(d, ['longitude', 'lng']),
    temp: getValue(d, ['temp', 'temperature']),
    hum: getValue(d, ['humidity', 'hum', 'umid']), 
    mq9: getValue(d, ['mq9_val', 'mq9']),       
    mq135: getValue(d, ['mq135_val', 'mq135', 'mq135_co2']) 
  }));

  cleanData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latest = cleanData.length > 0 ? cleanData[0] : { temp: 0, hum: 0, mq9: 0, mq135: 0, latitude: 0, longitude: 0 };
  const graphData = [...cleanData].reverse(); 
  
  const availableDates = [...new Set(cleanData.map(d => new Date(d.created_at).toLocaleDateString('pt-BR')))];
  const getFilteredData = () => graphData.filter(d => new Date(d.created_at).toLocaleDateString('pt-BR') === selectedDate);
  const filteredGraphData = getFilteredData();
  const filteredLabels = filteredGraphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
  const allLabels = graphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));

  const colors = {
    temp: 'rgb(255, 99, 132)', hum: 'rgb(54, 162, 235)', mq9: 'rgb(255, 159, 64)', mq135: 'rgb(75, 192, 192)',
    text: '#54504a', bg: '#f2efeb', cardBg: '#faf7f2'
  };

  const getPageBackground = () => {
    if (currentView === 'dht11' && dhtColorActive) return dhtMode === 'temp' ? 'rgba(255, 99, 132, 0.12)' : 'rgba(54, 162, 235, 0.12)';
    if (currentView === 'mq9') return 'rgba(255, 159, 64, 0.12)';
    if (currentView === 'mq135') return 'rgba(75, 192, 192, 0.12)';
    return colors.bg;
  };

  const getThemeColor = () => {
    if (currentView === 'home') return colors.bg; 
    if (currentView === 'dht11' && dhtColorActive) return dhtMode === 'temp' ? 'rgb(255, 230, 235)' : 'rgb(230, 240, 255)';
    if (currentView === 'mq9') return 'rgb(255, 240, 220)';
    if (currentView === 'mq135') return 'rgb(220, 250, 250)';
    return '#fff';
  };

  const overviewOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' }, color: '#54504a' } } }, scales: { x: { display: false }, y: { display: true } } };
  const detailOptions = { responsive: true, maintainAspectRatio: false, scales: { x: { display: true }, y: { display: true } }, plugins: { legend: { display: true, labels: { font: { size: 14 } } } } };

  const renderMapScale = (modeOverride = null) => {
    const currentMode = modeOverride || mapMode;
    let gradient = '', minLabel = '0', maxLabel = '100', unit = '';
    if (currentMode === 'temp') { gradient = 'linear-gradient(90deg, rgba(255, 99, 132, 0.1), rgba(255, 99, 132, 1))'; minLabel = '0°C'; maxLabel = '40°C'; unit = 'Temp'; }
    else if (currentMode === 'hum') { gradient = 'linear-gradient(90deg, rgba(54, 162, 235, 0.1), rgba(54, 162, 235, 1))'; minLabel = '0%'; maxLabel = '100%'; unit = 'Umid'; }
    else if (currentMode === 'mq9') { gradient = 'linear-gradient(90deg, rgba(255, 159, 64, 0.1), rgba(255, 159, 64, 1))'; minLabel = '0'; maxLabel = '500'; unit = 'MQ9'; }
    else if (currentMode === 'mq135') { gradient = 'linear-gradient(90deg, rgba(75, 192, 192, 0.1), rgba(75, 192, 192, 1))'; minLabel = '0'; maxLabel = '500'; unit = 'MQ135'; }
    return (
      <div style={{position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '200px'}}>
        <div style={{fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '5px', textAlign:'center', color: '#000'}}>{unit}</div>
        <div style={{height: '10px', width: '100%', background: gradient, borderRadius: '5px'}}></div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '3px', color: '#000'}}><span>{minLabel}</span><span>{maxLabel}</span></div>
      </div>
    );
  };

  const getCardStyle = (color) => ({ backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.15)'), borderRadius: '15px', padding: '10px 15px', border: `2px solid ${color}`, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100px', color: colors.text, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' });
  const btnStyle = (key, color, activeKey) => ({ padding: '10px 20px', border: 'none', backgroundColor: activeKey === key ? color : '#e0e0e0', color: activeKey === key ? '#fff' : '#54504a', fontWeight: '900', cursor: 'pointer', borderRadius: '15px', fontSize: '0.9rem', transition: 'all 0.2s', margin: '5px', boxShadow: activeKey === key ? `0 4px 10px ${color}66` : 'none' });

  return (
    <div className="main-container">
      <style jsx global>{`
        body { margin: 0; background-color: ${getPageBackground()}; font-family: 'Cerebri Sans', 'Arial', sans-serif; color: ${colors.text}; transition: background-color 0.5s; }
        .top-header { position: fixed; top: 0; left: 0; right: 0; height: 60px; background: ${getThemeColor()}; border-bottom: 2px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 30px; z-index: 2000; transition: background 0.5s; }
        .header-title { font-weight: 900; font-size: 1.1em; text-align: center; position: absolute; left: 0; right: 0; pointer-events: none; }
        .header-right { font-weight: 800; font-size: 0.9em; z-index: 2001; }
        .sidebar { position: fixed; top: 60px; left: 0; bottom: 0; width: 280px; background: ${getThemeColor()}; box-shadow: 4px 0 15px rgba(0,0,0,0.05); transform: translateX(${isMenuOpen ? '0' : '-100%'}); transition: transform 0.3s ease, background 0.5s; z-index: 1999; padding: 30px 0; }
        .nav-item { padding: 15px 30px; font-weight: 800; color: ${colors.text}; cursor: pointer; display: flex; justify-content: space-between; }
        .nav-item:hover { background: rgba(255,255,255,0.5); }
        .sub-item { padding: 12px 50px; font-size: 0.9rem; font-weight: 600; color: #777; cursor: pointer; display: block; }
        .sub-item:hover { color: #000; background: rgba(255,255,255,0.5); }
        .content-wrapper { padding: 100px 5% 60px 5%; max-width: 1400px; margin: 0 auto; min-height: 100vh; }
        .sub-nav-links { text-align: center; font-size: 0.85em; color: ${colors.text}; font-weight: bold; position: sticky; top: 60px; z-index: 1000; background: ${colors.bg}; padding: 15px 0; margin-bottom: 20px; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .sub-nav-item { cursor: pointer; transition: opacity 0.2s; padding: 5px; }
        .sub-nav-item:hover { opacity: 0.6; }
        .top-section-container { min-height: 80vh; display: flex; flex-direction: column; justify-content: flex-start; padding-top: 30px; padding-bottom: 40px; }
        .full-screen-section { min-height: 90vh; display: flex; flex-direction: column; justify-content: center; padding: 40px 0; }
        .main-title { text-align: center; font-size: 2.5rem; font-weight: 900; margin-bottom: 50px; line-height: 1.2; }
        .cards-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 0; }
        .soft-line { height: 2px; border: 0; background: linear-gradient(90deg, rgba(84,80,74,0), rgba(84,80,74,0.4), rgba(84,80,74,0)); margin: 50px 0; }
        .rounded-box { background-color: #fff; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 15px rgba(0,0,0,0.03); padding: 20px; }
        .bold-text { font-weight: 900 !important; }
        .flex-columns { display: flex; gap: 30px; flex-wrap: wrap; height: 100%; width: 100%; }
        .map-column { flex: 1 1 500px; display: flex; flex-direction: column; }
        .side-graphs-col { flex: 1 1 400px; display: flex; flex-direction: column; gap: 30px; }
        .sensor-title-container { text-align: center; margin-bottom: 40px; margin-top: 40px; }
        .sensor-divider { width: 100px; height: 3px; background: #000; margin: 15px auto 0 auto; opacity: 0.3; }
        .sensor-desc-box { background: #fff; border-radius: 20px; padding: 30px; border: 2px solid #fff; max-width: 800px; margin: 0 auto 20px auto; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.02); }
        .sensor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
        @media (max-width: 900px) { .content-wrapper { padding: 90px 4% 40px 4%; } .header-title { display: block; font-size: 0.9em; position: static; pointer-events: auto; } .header-right { display: none; } .main-title br { display: block; } .main-title { font-size: 1.8rem; margin-bottom: 30px; } .cards-container { grid-template-columns: 1fr 1fr; gap: 15px; row-gap: 50px; } .cards-container > div { min-height: 110px; padding: 10px; } .cards-container .reading-val { font-size: 1.4em; } .full-screen-section, .top-section-container { min-height: auto; display: block; padding: 20px 0; } .rounded-box-map { height: 500px !important; min-height: 500px !important; display: block !important; width: 100% !important; } .flex-columns { flex-direction: column; align-items: center; width: 100%; } .map-column { width: 100%; flex: auto; max-width: 100%; } .side-graphs-col { flex-direction: row; width: 100%; margin-top: 30px; } .side-graphs-col > div { flex: 1; min-height: 250px; } .sensor-layout { grid-template-columns: 1fr; } }
        @media (min-width: 901px) { .main-title br { display: none; } }
        @media (max-width: 500px) { .side-graphs-col { flex-direction: column; } }
      `}</style>
      
      <div className="top-header">
        <div style={{cursor: 'pointer', zIndex: 2001}} onClick={() => setIsMenuOpen(!isMenuOpen)}><MenuIcon /></div>
        <div className="header-title">MONITORAMENTO DA QUALIDADE DO AR</div>
        <div className="header-right">LAB. VI | IFUSP</div>
      </div>
      <div className="sidebar">
        <div className="nav-item" onClick={() => navigate('home')}>HOME</div>
        <div className="nav-item" onClick={() => navigate('project')}>O PROJETO</div>
        <div className="nav-item" onClick={() => navigate('iqar')}>IQAR</div>
        <div className="nav-item" onClick={() => setIsSensorsSubmenuOpen(!isSensorsSubmenuOpen)}>OS SENSORES <ChevronDown /></div>
        {isSensorsSubmenuOpen && (<div style={{background: 'rgba(255,255,255,0.4)'}}><span className="sub-item" onClick={() => navigate('dht11')}>DHT11</span><span className="sub-item" onClick={() => navigate('mq9')}>MQ9</span><span className="sub-item" onClick={() => navigate('mq135')}>MQ135</span></div>)}
      </div>
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} style={{position:'fixed', top:60, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.2)', zIndex:1998}} />}
      
      <div className="content-wrapper">
        {currentView === 'home' && (
          <>
            <div className="sub-nav-links">
              <span className="sub-nav-item" onClick={() => scrollTo(sectionMedidas)}>MEDIDAS</span><span style={{margin:'0 10px'}}>|</span>
              <span className="sub-nav-item" onClick={() => scrollTo(sectionMapas)}>MAPAS</span><span style={{margin:'0 10px'}}>|</span>
              <span className="sub-nav-item" onClick={() => scrollTo(sectionLeitura)}>LEITURA POR SENSOR</span>
            </div>

            {/* SELETOR DE DATA MOVIDO PARA CÁ (TOPO) */}
            <div style={{margin: '0 auto 20px auto', textAlign:'center'}}>
              <label className="bold-text" style={{marginRight: '10px'}}>DATA:</label>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                style={{
                  padding: '8px 12px', 
                  borderRadius: '10px', 
                  border: '1px solid #ccc', 
                  fontSize: '0.9rem', 
                  fontWeight: 'bold', 
                  color: colors.text, 
                  backgroundColor: '#fff', 
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
              >
                {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
              </select>
            </div>

            <div ref={sectionMedidas} className="top-section-container">
                <h1 className="main-title">MONITORAMENTO <br/> DA QUALIDADE DO AR</h1>
                <div className="cards-container">
                  <div style={getCardStyle(colors.temp)}><div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Temperatura</div><div className="reading-val" style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.temp?.toFixed(2)}°C</div></div>
                  <div style={getCardStyle(colors.hum)}><div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Umidade</div><div className="reading-val" style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.hum?.toFixed(2)}%</div></div>
                  <div style={getCardStyle(colors.mq9)}><div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Gás (MQ9)</div><div className="reading-val" style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.mq9?.toFixed(2)}</div></div>
                  <div style={getCardStyle(colors.mq135)}><div style={{fontWeight: '900', fontSize: '0.9em', textTransform: 'uppercase', marginBottom: '5px'}}>Ar (MQ135)</div><div className="reading-val" style={{fontWeight: '900', fontSize: '2.2em'}}>{latest.mq135?.toFixed(2)}</div></div>
                </div>
            </div>
            <hr className="soft-line" />
            <div ref={sectionMapas} className="full-screen-section" style={{background: 'rgba(255,255,255,0.5)', borderRadius:'30px', padding:'30px'}}>
                <div className="flex-columns">
                  <div className="map-column">
                    <h3 style={{margin: '0 0 15px 0', fontSize: '1.4em', color: colors.text}}><span className="bold-text">LOCAL:</span> <span>SÃO PAULO - SP (IFUSP)</span></h3>
                    <div className="rounded-box rounded-box-map" style={{flex: 1, padding: '5px', background: '#fff', border: '3px solid #fff', position: 'relative', minHeight: '400px'}}><Map data={cleanData} mode={mapMode} />{renderMapScale()}</div>
                    <div style={{marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap:'wrap'}}><button style={btnStyle('temp', colors.temp, mapMode)} onClick={() => setMapMode('temp')}>Temp</button><button style={btnStyle('hum', colors.hum, mapMode)} onClick={() => setMapMode('hum')}>Umid</button><button style={btnStyle('mq9', colors.mq9, mapMode)} onClick={() => setMapMode('mq9')}>MQ9</button><button style={btnStyle('mq135', colors.mq135, mapMode)} onClick={() => setMapMode('mq135')}>MQ135</button></div>
                  </div>
                  <div className="side-graphs-col">
                    <div className="rounded-box" style={{flex: 1}}><h3 className="bold-text" style={{margin: '0 0 15px 0'}}>🌦️ CLIMA</h3><div style={{height: '200px'}}><Line data={{labels: allLabels, datasets: [{ label: 'Temp 🌡️ (°C)', data: graphData.map(d => d.temp), borderColor: colors.temp, borderWidth: 2.5, pointRadius: 0 }, { label: 'Umid 💧 (%)', data: graphData.map(d => d.hum), borderColor: colors.hum, borderWidth: 2.5, pointRadius: 0 }]}} options={overviewOptions} /></div></div>
                    <div className="rounded-box" style={{flex: 1}}><h3 className="bold-text" style={{margin: '0 0 15px 0'}}>⚠️ GASES</h3><div style={{height: '200px'}}><Line data={{labels: allLabels, datasets: [{ label: 'MQ9 🔥 (PPM)', data: graphData.map(d => d.mq9), borderColor: colors.mq9, borderWidth: 2.5, pointRadius: 0 }, { label: 'MQ135 💨 (PPM)', data: graphData.map(d => d.mq135), borderColor: colors.mq135, borderWidth: 2.5, pointRadius: 0 }]}} options={overviewOptions} /></div></div>
                  </div>
                </div>
            </div>
            <hr className="soft-line" />
            <div ref={sectionLeitura} className="full-screen-section" style={{textAlign: 'center'}}>
              <h2 className="bold-text" style={{fontSize: '2em', textTransform: 'uppercase', marginBottom: '30px'}}>LEITURA POR SENSOR</h2>
              <div style={{marginBottom: '30px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}><button style={btnStyle('temp', colors.temp, activeGraph)} onClick={() => setActiveGraph(activeGraph === 'temp' ? null : 'temp')}>TEMPERATURA</button><button style={btnStyle('hum', colors.hum, activeGraph)} onClick={() => setActiveGraph(activeGraph === 'hum' ? null : 'hum')}>UMIDADE</button><button style={btnStyle('mq9', colors.mq9, activeGraph)} onClick={() => setActiveGraph(activeGraph === 'mq9' ? null : 'mq9')}>GÁS (MQ9)</button><button style={btnStyle('mq135', colors.mq135, activeGraph)} onClick={() => setActiveGraph(activeGraph === 'mq135' ? null : 'mq135')}>AR (MQ135)</button></div>
              {activeGraph && (<div className="rounded-box" style={{background: '#fff', height: '400px'}}><Line data={{labels: filteredLabels, datasets: [{ label: activeGraph === 'temp' ? 'Temperatura 🌡️ (°C)' : activeGraph === 'hum' ? 'Umidade 💧 (%)' : activeGraph === 'mq9' ? 'Gás MQ9 🔥 (PPM)' : 'Ar MQ135 💨 (PPM)', data: activeGraph === 'temp' ? filteredGraphData.map(d => d.temp) : activeGraph === 'hum' ? filteredGraphData.map(d => d.hum) : activeGraph === 'mq9' ? filteredGraphData.map(d => d.mq9) : activeGraph === 'mq135' ? filteredGraphData.map(d => d.mq135) : [], borderColor: activeGraph === 'temp' ? colors.temp : activeGraph === 'hum' ? colors.hum : activeGraph === 'mq9' ? colors.mq9 : colors.mq135, backgroundColor: (activeGraph === 'temp' ? colors.temp : activeGraph === 'hum' ? colors.hum : activeGraph === 'mq9' ? colors.mq9 : colors.mq135).replace('rgb','rgba').replace(')', ',0.2)'), fill: true, tension: 0.3 }]}} options={detailOptions} /></div>)}
            </div>
          </>
        )}
        
        {(currentView === 'project' || currentView === 'iqar') && (
          <div className="rounded-box" style={{background: '#fff', minHeight: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <h2 className="bold-text">EM BREVE</h2>
          </div>
        )}

        {(currentView === 'dht11' || currentView === 'mq9' || currentView === 'mq135') && (
          <div>
            <div className="sensor-title-container"><h1 className="bold-text" style={{fontSize: '2.5em', textTransform: 'uppercase', margin: 0}}>{currentView === 'dht11' ? 'DHT11' : currentView.toUpperCase()}</h1><div className="sensor-divider"></div></div>
            <div className="sensor-desc-box"><h3 className="bold-text">SOBRE O SENSOR</h3><p style={{lineHeight: '1.6', margin: 0}}>Descrição técnica em breve.</p></div>
            
            {currentView === 'dht11' && (
                <div style={{marginTop: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'center'}}>
                    <button style={btnStyle('temp', colors.temp, dhtColorActive ? dhtMode : null)} onClick={() => handleDhtChange('temp')}>TEMPERATURA</button>
                    <button style={btnStyle('hum', colors.hum, dhtColorActive ? dhtMode : null)} onClick={() => handleDhtChange('hum')}>UMIDADE</button>
                </div>
            )}
            
            <div style={{margin: '0 auto 30px auto', textAlign:'center'}}>
              <label className="bold-text" style={{marginRight: '10px'}}>SELECIONAR DATA:</label>
              <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{padding: '10px', borderRadius: '10px', border: '2px solid #ddd', fontSize: '1rem', fontWeight: 'bold', color: colors.text}}>
                {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
              </select>
            </div>

            {currentView === 'dht11' ? (
                dhtColorActive ? (
                    <div className="sensor-layout">
                        <div className="rounded-box"><div style={{display:'flex', justifyContent:'space-between'}}><h3 className="bold-text">{dhtMode === 'temp' ? 'TEMPERATURA (°C)' : 'UMIDADE (%)'}</h3><h3 className="bold-text" style={{color: dhtMode === 'temp' ? colors.temp : colors.hum}}>Última: {dhtMode === 'temp' ? (latest.temp?.toFixed(2) || '0') + '°C' : (latest.hum?.toFixed(2) || '0') + '%'}</h3></div><div style={{height: '250px'}}><Line data={{labels: filteredLabels, datasets: [{ label: dhtMode === 'temp' ? 'Temperatura' : 'Umidade', data: dhtMode === 'temp' ? filteredGraphData.map(d => d.temp) : filteredGraphData.map(d => d.hum), borderColor: dhtMode === 'temp' ? colors.temp : colors.hum, tension: 0.3 }]}} options={detailOptions} /></div></div>
                        <div className="rounded-box rounded-box-map" style={{minHeight: '400px', position: 'relative'}}><h3 className="bold-text" style={{marginBottom: '10px'}}>MAPA ({dhtMode === 'temp' ? 'TEMPERATURA' : 'UMIDADE'})</h3><Map data={filteredGraphData} mode={dhtMode} />{renderMapScale(dhtMode)}</div>
                    </div>
                ) : ( <p style={{textAlign:'center', color:'#999', marginTop:'30px', fontStyle:'italic'}}>Selecione uma leitura acima para visualizar.</p> )
            ) : (
                <div className="sensor-layout">
                    <div className="rounded-box"><div style={{display:'flex', justifyContent:'space-between'}}><h3 className="bold-text">{currentView === 'mq9' ? 'GÁS COMBUSTÍVEL (PPM)' : 'QUALIDADE DO AR'}</h3><h3 className="bold-text" style={{color: currentView === 'mq9' ? colors.mq9 : colors.mq135}}>Última: {currentView === 'mq9' ? (latest.mq9?.toFixed(2) || '0') : (latest.mq135?.toFixed(2) || '0')}</h3></div><div style={{height: '250px'}}><Line data={{labels: filteredLabels, datasets: [{ label: currentView === 'mq9' ? 'MQ9' : 'MQ135', data: currentView === 'mq9' ? filteredGraphData.map(d => d.mq9) : filteredGraphData.map(d => d.mq135), borderColor: currentView === 'mq9' ? colors.mq9 : colors.mq135, fill: true, backgroundColor: currentView === 'mq9' ? 'rgba(255, 159, 64, 0.2)' : 'rgba(75, 192, 192, 0.2)', tension: 0.3 }]}} options={detailOptions} /></div></div>
                    <div className="rounded-box rounded-box-map" style={{minHeight: '400px', position: 'relative'}}><h3 className="bold-text" style={{marginBottom: '10px'}}>MAPA ({currentView === 'mq9' ? 'MQ9' : 'MQ135'})</h3><Map data={filteredGraphData} mode={currentView} />{renderMapScale(currentView)}</div>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
