import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import Home from '../pages/Home';
import CierreCaja from '../pages/CierreCaja';
import Diferencias from '../pages/Diferencias';
import Exportar from '../pages/Exportar';
import Ajustes from '../pages/Ajustes';

function MainContent({ activePage }) {
  const renderPage = () => {
    switch (activePage) {
      case 'Home': return <Home />;
      case 'Cerrar caja': return <CierreCaja />;
      case 'Control de cajas': return <Diferencias />;
      case 'Exportar': return <Exportar />;
      case 'Ajustes': return <Ajustes />;
      default: return <Typography>Página no encontrada</Typography>;
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: '#161B20',
        padding: '24px',
        overflowY: 'auto',
        height: '100vh',
        color: '#E0EAF5',
        borderRadius: 0,
        position: 'relative',
      }}
    >
      <Fade in key={activePage} timeout={300}>
        <Box>
          {renderPage()}
        </Box>
      </Fade>
    </Box>
  );
}

export default MainContent;
