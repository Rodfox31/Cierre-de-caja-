import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

const colors = {
  mainBg: "#1E1E1E",
  textPrimary: "#FFFFFF"
};

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [activePage, setActivePage] = useState('Home');
  const [cierres, setCierres] = useState([]); // Estado para guardar datos de la DB

  // Llamada al backend para obtener los cierres (DB)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/cierres`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al cargar datos de cierres");
        }
        return response.json();
      })
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
