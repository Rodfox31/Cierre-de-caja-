import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212', // Fondo principal de la app (ControlMensual)
      paper: '#1e1e1e',   // Fondo de tarjetas/cajas
    },
    primary: {
      main: '#705cdfff', // Verde positivo (ControlMensual)
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2196f3', // Azul para acciones secundarias
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336', // Rojo negativo
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff9800', // Naranja advertencia
      contrastText: '#ffffff',
    },
    success: {
      main: '#A3BE8C', // Verde sutil para éxito (ControlMensual)
      contrastText: '#ffffff',
    },
    info: {
      main: '#88C0D0', // Celeste informativo (ControlMensual)
      contrastText: '#ffffff',
    },
    positive: {
      main: '#A3BE8C', // Verde positivo (usado en ControlMensual)
      contrastText: '#ffffff',
    },
    negative: {
      main: '#BF616A', // Rojo sutil negativo (usado en ControlMensual)
      contrastText: '#ffffff',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#888888',
    },
    custom: {
      appBarGradient: 'linear-gradient(90deg, #0F2027, #203A43, #2C5364)',
      sidebarHover: 'rgba(255, 255, 255, 0.06)',
      accent: '#EBCB8B', // Amarillo sutil (ControlMensual)
      tableBorder: '#444',
      tableRowHover: '#3a3a3a',
      tableRow: '#2a2a2a',
    },
  },
  typography: {
    fontFamily: `'Inter', 'IBM Plex Sans', 'Segoe UI', 'Roboto', Arial, sans-serif`, // Inter es la principal en ControlMensual
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.95rem',
    },
    body2: {
      fontSize: '0.85rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    caption: {
      fontSize: '0.8rem',
      color: '#b0b0b0',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#444',
        },
        head: {
          fontWeight: 700,
          color: '#ffffff',
          backgroundColor: '#3a3a3a',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.85rem',
          backgroundColor: '#232323',
          color: '#fff',
        },
      },
    },
  },
});

export default theme;
