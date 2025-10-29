import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BalanceIcon from '@mui/icons-material/Balance';
import StoreIcon from '@mui/icons-material/Store';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPage } from '../utils/permissions';

function Sidebar({ activePage, setActivePage }) {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hovered, setHovered] = useState(null);

  const pages = [
    { name: "Home", icon: <HomeIcon fontSize="small" />, pageKey: "home" },
    { name: "Cerrar caja", icon: <PointOfSaleIcon fontSize="small" />, pageKey: "cierrecaja" },
    { name: "Control de cajas", icon: <BalanceIcon fontSize="small" />, pageKey: "controlmensual" },
    { name: "Control de Boutiques", icon: <StoreIcon fontSize="small" />, pageKey: "diferencias" },
    { name: "Exportar", icon: <FileDownloadIcon fontSize="small" />, pageKey: "exportar" },
    { name: "Ajustes", icon: <SettingsIcon fontSize="small" />, pageKey: "ajustes" },
  ];

  // Filtrar páginas según permisos del usuario
  const accessiblePages = pages.filter(page => 
    canAccessPage(currentUser, page.pageKey)
  );

  return (
    <Box
      sx={{
        width: isExpanded ? '250px' : '75px',
        backgroundColor: theme.palette.background.paper,
        p: '16px 12px',
        borderRight: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
        overflow: 'auto',
        position: 'sticky',
        top: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '2px',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(0, 198, 255, 0.6) 0%, rgba(0, 198, 255, 0.1) 50%, rgba(0, 198, 255, 0.6) 100%)',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        },
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHovered(null);
      }}
    >
      {accessiblePages.map((page) => {
        const isActive = activePage === page.name;
        return (
          <Button
            key={page.name}
            onClick={() => setActivePage(page.name)}
            onMouseEnter={() => setHovered(page.name)}
            onMouseLeave={() => setHovered(null)}
            sx={{
              backgroundColor: isActive
                ? 'rgba(0, 198, 255, 0.15)'
                : hovered === page.name
                ? theme.palette.custom?.sidebarHover || 'rgba(255, 255, 255, 0.06)'
                : 'transparent',
              color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
              borderRadius: '12px',
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: isActive ? 600 : 500,
              mb: 1.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              gap: isExpanded ? '16px' : 0,
              px: isExpanded ? '18px' : '0px',
              py: '14px',
              minWidth: 0,
              width: '100%',
              textTransform: 'none',
              fontFamily: theme.typography.fontFamily,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              border: isActive ? '1px solid rgba(0, 198, 255, 0.3)' : '1px solid transparent',
              boxShadow: isActive ? '0 4px 12px rgba(0, 198, 255, 0.15)' : 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: isActive ? '60%' : '0%',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '0 2px 2px 0',
                transition: 'height 0.3s ease',
                opacity: isActive ? 1 : 0,
              },
              '&:hover': {
                backgroundColor: isActive 
                  ? 'rgba(0, 198, 255, 0.2)' 
                  : theme.palette.custom?.sidebarHover || 'rgba(255, 255, 255, 0.08)',
                transform: 'translateX(4px)',
                boxShadow: isActive 
                  ? '0 6px 16px rgba(0, 198, 255, 0.2)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            {page.icon}
            {isExpanded && (
              <Typography
                variant="body1"
                sx={{
                  fontSize: '15px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  opacity: isExpanded ? 1 : 0,
                  transition: 'opacity 0.3s ease 0.1s',
                  letterSpacing: '0.02em',
                }}
              >
                {page.name}
              </Typography>
            )}
          </Button>
        );
      })}
    </Box>
  );
}

export default Sidebar;
