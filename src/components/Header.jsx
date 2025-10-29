import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, IconButton, Typography, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InsightsIcon from '@mui/icons-material/Insights';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { ColorModeContext } from '../theme';
import { useAuth } from '../contexts/AuthContext';

function Header({ onMenuToggle }) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { currentUser, logout } = useAuth();

  // Función para obtener el color del badge según el rol
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'supervisor':
        return 'warning';
      case 'cajero':
        return 'info';
      default:
        return 'default';
    }
  };

  // Función para obtener el label del rol
  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'supervisor':
        return 'Supervisor';
      case 'cajero':
        return 'Cajero';
      default:
        return role;
    }
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: theme.palette.custom?.appBarGradient || theme.palette.primary.main,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Toolbar sx={{ minHeight: '80px', px: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InsightsIcon sx={{ fontSize: 38, color: theme.palette.primary.main }} />

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 700,
                fontSize: '26px',
                color: theme.palette.text.primary,
                letterSpacing: 0.7,
              }}
            >
              Cierre de Caja
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: theme.palette.text.secondary,
                ml: '2px',
              }}
            >
              Online v4.1
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Usuario con nombre y rol */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {currentUser?.username || 'Usuario'}
            </Typography>
            <Chip
              label={getRoleLabel(currentUser?.role)}
              color={getRoleBadgeColor(currentUser?.role)}
              size="small"
              sx={{ 
                height: '18px',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            />
          </Box>
          <AccountCircleIcon sx={{ fontSize: 36, color: theme.palette.text.primary }} />
        </Box>

        {/* Botón de Logout */}
        <IconButton
          aria-label="Cerrar sesión"
          onClick={logout}
          sx={{ 
            mr: 1, 
            color: theme.palette.text.primary,
            '&:hover': {
              color: theme.palette.error.main,
            },
          }}
          title="Cerrar sesión"
        >
          <LogoutIcon />
        </IconButton>

        {/* Toggle Dark/Light */}
        <IconButton
          aria-label="Cambiar tema"
          onClick={colorMode.toggleColorMode}
          sx={{ mr: 1, color: theme.palette.text.primary }}
        >
          {theme.palette.mode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
        </IconButton>

        <IconButton
          sx={{ display: { xs: 'block', md: 'none' }, color: theme.palette.text.primary }}
          aria-label="Menú principal"
          onClick={onMenuToggle}
        >
          <MenuIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  onMenuToggle: PropTypes.func,
};

export default Header;
