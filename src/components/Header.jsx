import React from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InsightsIcon from '@mui/icons-material/Insights';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function Header({ onMenuToggle }) {
  const theme = useTheme();

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
              Online v3.2
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Usuario con nombre a la izquierda */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mr: 2 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
            }}
          >
            Admin
          </Typography>
          <AccountCircleIcon sx={{ fontSize: 30, color: theme.palette.text.primary }} />
        </Box>

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
