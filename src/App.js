import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Login from './pages/Login';
import { fetchWithFallback } from './config';
import { useTheme } from '@mui/material/styles';
import { useAuth } from './contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

function App() {
  const theme = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('Home');
  const [cierres, setCierres] = useState([]); // Estado para guardar datos de la DB

  // Llamada al backend para obtener los cierres (DB)

  useEffect(() => {
    // Solo cargar datos si está autenticado
    if (isAuthenticated) {
      fetchWithFallback('/api/cierres-completo')
        .then((response) => response.json())
        .then((data) => {
          setCierres(data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [isAuthenticated]);

  // Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si no está autenticado, mostrar Login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Usuario autenticado - mostrar app normal
  const appStyle = {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  };

  const contentWrapper = {
    flex: 1, // Toma el espacio restante
    display: 'flex',
    padding: '1px',
    backgroundColor: theme.palette.background.default,
    transition: 'background-color 0.3s ease, color 0.3s ease'
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
