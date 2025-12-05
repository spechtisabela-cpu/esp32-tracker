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
  loading: () => <div style={{height: '100%', width: '100%', background: '#ddd', borderRadius: '15px', display:'flex', alignItems:'center', justifyContent:'center'}}>Carregando Mapa...</div>
});

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
  
  // Dashboard State
  const [mapMode, setMapMode] = useState('temp'); 
  const [activeGraph, setActiveGraph] = useState(null); 
  
  // Sensor Page State
  const [selectedDate, setSelectedDate] = useState('');
  const [dhtMode, setDhtMode] = useState('temp'); 
  const [dhtColorActive, setDhtColorActive] = useState(false); 

  // Refs for Scrolling
  const sectionMedidas = useRef(null);
  const sectionMapas = useRef(null);
  const sectionLeitura = useRef(null);

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

  const scrollTo = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDhtChange = (mode) => {
    setDhtMode(mode);
    setDhtColorActive(true); 
  };

  const navigate = (view) => {
    setCurrentView(view);
    setIsMenuOpen(false);
    setDhtColorActive(false); 
  };

  const latest = data.length > 0 ? data[0] : { temp: 0, humidity: 0, mq9_val: 0, mq135_val: 0, latitude: 0, longitude: 0 };
  const graphData = [...data].reverse(); 
  const availableDates = [...new Set(data.map(d => new Date(d.created_at).toLocaleDateString('pt-BR')))];
  
  const getFilteredData = () => graphData.filter(d => new Date(d.created_at).toLocaleDateString('pt-BR') === selectedDate);
  const filteredGraphData = getFilteredData();
  const filteredLabels = filteredGraphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
  const allLabels = graphData.map(d => new Date(d.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));

  const colors = {
    temp: 'rgb(255, 99, 132)',
    hum: 'rgb(54, 162, 235)',
    mq9: 'rgb(255, 159, 64)',
    mq135: 'rgb(75, 192, 192)',
    text: '#54504a',
    bg: '#f2efeb',
    cardBg: '#faf7f2'
  };

  const getPageBackground = () => {
    if (currentView === 'dht11' && dhtColorActive) {
        return dhtMode === 'temp' ? 'rgba(255, 99, 132, 0.12)' : 'rgba(54, 162, 235, 0.12)';
    }
    if (currentView === 'mq9') return 'rgba(255, 159, 64, 0.12)';
    if (currentView === 'mq135') return 'rgba(75, 192, 192, 0.12)';
    return colors.bg;
  };

  // Reuse logic for Header/Sidebar
  const getThemeColor = () => {
    if (currentView === 'dht11' && dhtColorActive) {
        return dhtMode === 'temp' ? 'rgba(255, 99, 132, 0.25)' : 'rgba(54, 162, 235, 0.25)';
    }
    if (currentView === 'mq9') return 'rgba(255, 159, 64, 0.25)';
    if (currentView === 'mq135') return 'rgba(75, 192, 192, 0.25)';
    return '#fff';
  };
