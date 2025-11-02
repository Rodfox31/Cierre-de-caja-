import React from 'react';
import { Box, Typography, Fade, Paper, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import Home from '../pages/Home';
import CierreCaja from '../pages/CierreCaja';
import CierreDiario from '../pages/CierreDiario';
import Diferencias from '../pages/Diferencias';
import ControlMensual from '../pages/ControlMensual';
import Exportar from '../pages/Exportar';
import Ajustes from '../pages/Ajustes';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPage } from '../utils/permissions';

function MainContent({ activePage }) {
  const theme = useTheme();
  const { currentUser } = useAuth();
  
  // Mapeo de nombres de página a pageKeys
  const pageKeyMap = {
    'Home': 'home',
    'Cerrar caja': 'cierrecaja',
    'Cierre diario': 'cierrediario',
    'Control de cajas': 'controlmensual',
    'Control de Boutiques': 'diferencias',
    'Filtros y Reportes': 'exportar',
    'Ajustes': 'ajustes',
  };
  
  const pageKey = pageKeyMap[activePage];
  const hasAccess = canAccessPage(currentUser, pageKey);

  const renderPage = () => {
    // Verificar acceso antes de renderizar
    if (!hasAccess) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 3,
          }}
        >
          <LockIcon sx={{ fontSize: 80, color: 'error.main', opacity: 0.6 }} />
          <Typography variant="h4" color="text.secondary" fontWeight={600}>
            Acceso Denegado
          </Typography>
          <Alert severity="warning" sx={{ maxWidth: 500 }}>
            No tienes permisos para acceder a esta sección. Contacta al administrador si crees que esto es un error.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Tu rol actual: <strong>{currentUser?.role || 'Desconocido'}</strong>
          </Typography>
        </Box>
      );
    }
    
    // Renderizar la página correspondiente
    switch (activePage) {
      case 'Home': return <Home />;
      case 'Cerrar caja': return <CierreCaja />;
      case 'Cierre diario': return <CierreDiario />;
      case 'Control de cajas': return <Diferencias />;
  case 'Control de Boutiques': return <ControlMensual />;
  case 'Filtros y Reportes': return <Exportar />;
      case 'Ajustes': return <Ajustes />;
      default: return <Typography>Página no encontrada</Typography>;
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: theme.palette.background.default,
        padding: { xs: '16px', md: '24px' },
        overflowY: 'auto',
        minHeight: '100vh',
        color: theme.palette.text.primary,
        borderRadius: 0,
        position: 'relative',
        transition: 'background-color 0.3s ease, color 0.3s ease',
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
