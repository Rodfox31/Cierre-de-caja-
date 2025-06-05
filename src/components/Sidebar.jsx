import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import BalanceIcon from '@mui/icons-material/Balance';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SettingsIcon from '@mui/icons-material/Settings';

function Sidebar({ activePage, setActivePage }) {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hovered, setHovered] = useState(null);

  const pages = [
    { name: "Home", icon: <HomeIcon fontSize="small" /> },
    { name: "Cerrar caja", icon: <PointOfSaleIcon fontSize="small" /> },
    { name: "Control de cajas", icon: <BalanceIcon fontSize="small" /> },
    { name: "Exportar", icon: <FileDownloadIcon fontSize="small" /> },
    { name: "Ajustes", icon: <SettingsIcon fontSize="small" /> },
  ];

  return (
    <Box
      sx={{
        width: isExpanded ? '240px' : '80px',
        backgroundColor: theme.palette.background.paper,
        p: '12px 14px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        height: '100vh',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHovered(null);
      }}
    >
      {pages.map((page) => {
        const isActive = activePage === page.name;
        return (
          <Button
            key={page.name}
            onClick={() => setActivePage(page.name)}
            onMouseEnter={() => setHovered(page.name)}
            onMouseLeave={() => setHovered(null)}
            sx={{
              backgroundColor: isActive
                ? 'rgba(0, 198, 255, 0.12)'
                : hovered === page.name
                ? theme.palette.custom?.sidebarHover || 'rgba(255, 255, 255, 0.04)'
                : 'transparent',
              color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
              borderRadius: '10px',
              textAlign: 'left',
              fontSize: '16px',
              fontWeight: isActive ? 600 : 400,
              mb: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              gap: isExpanded ? '14px' : 0,
              px: isExpanded ? '20px' : '10px', // 🛠 más aire colapsado
              py: '12px',
              minWidth: 0, // ✅ bonus
              width: '100%', // ✅ bonus
              textTransform: 'none',
              fontFamily: theme.typography.fontFamily,
              transition: 'all 0.25s ease',
              '&:hover': {
                backgroundColor: theme.palette.custom?.sidebarHover || 'rgba(255, 255, 255, 0.06)',
                transform: 'scale(1.02)',
              },
            }}
          >
            {page.icon}
            {isExpanded && (
              <Typography
                variant="body1"
                sx={{
                  fontSize: '15.5px',
                  fontWeight: 500,
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
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
