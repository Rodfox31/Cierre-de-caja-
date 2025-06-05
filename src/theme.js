import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1E1E1E', // gris muy oscuro, base de la app
      paper: '#2A2A2A',   // un poco más claro para tarjetas/cajas
    },
    primary: {
      main: '#4169e1',
    },
    secondary: {
      main: '#2F3C47',
    },
    text: {
      primary: '#E0EAF5',
      secondary: '#9BA8B3',
    },
    custom: {
      appBarGradient: 'linear-gradient(90deg, #0F2027, #203A43, #2C5364)',
      sidebarHover: 'rgba(255, 255, 255, 0.06)',
    },
  },
  typography: {
    fontFamily: `'IBM Plex Sans', 'Segoe UI', 'Roboto', sans-serif`,
    h5: {
      fontWeight: 700,
    },
    body1: {
      fontSize: '15.5px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
