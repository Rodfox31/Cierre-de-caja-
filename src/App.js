import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { API_BASE_URL, fetchWithFallback } from './config';

const colors = {
  mainBg: "#1E1E1E",
  textPrimary: "#FFFFFF"
};

function App() {
  const [activePage, setActivePage] = useState('Home');
  const [cierres, setCierres] = useState([]); // Estado para guardar datos de la DB

  // Llamada al backend para obtener los cierres (DB)

  useEffect(() => {
    fetchWithFallback('/api/cierres-completo')
      .then((response) => response.json())
      .then((data) => {
        setCierres(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, []);

  const appStyle = {
    backgroundColor: colors.mainBg,
    color: colors.textPrimary,
    fontFamily: 'Segoe UI, Roboto, sans-serif',
    minHeight: '100vh', // Ocupa el 100% de la altura del viewport
    display: 'flex',
    flexDirection: 'column'
  };

  const contentWrapper = {
    flex: 1, // Toma el espacio restante
    display: 'flex',
    padding: '1px'
  };

  return (
    <div style={appStyle}>
      <Header />
      <div style={contentWrapper}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        {/* Se pasa el estado "cierres" al componente MainContent */}
        <MainContent activePage={activePage} cierres={cierres} />
      </div>
    </div>
  );
}

export default App;
