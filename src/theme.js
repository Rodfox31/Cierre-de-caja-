import React from 'react';
import { createTheme } from '@mui/material/styles';

// Contexto para alternar Dark/Light desde cualquier parte de la app
export const ColorModeContext = React.createContext({
  mode: 'dark',
  toggleColorMode: () => {},
});

// Tokens de color y configuración por modo
const getPaletteByMode = (mode) => {
  if (mode === 'light') {
    return {
      mode: 'light',
      background: {
        default: '#f5f7fb',
        paper: '#ffffff',
      },
      primary: { main: '#1f2bcc', contrastText: '#ffffff' },
      secondary: { main: '#2196f3', contrastText: '#ffffff' },
      error: { main: '#d32f2f', contrastText: '#ffffff' },
      warning: { main: '#ed6c02', contrastText: '#ffffff' },
      success: { main: '#2e7d32', contrastText: '#ffffff' },
      info: { main: '#0288d1', contrastText: '#ffffff' },
      positive: { main: '#2e7d32', contrastText: '#ffffff' },
      negative: { main: '#c62828', contrastText: '#ffffff' },
      text: {
        primary: '#1a1a1a',
        secondary: '#475569',
        disabled: '#9aa4b2',
      },
      custom: {
        appBarGradient: 'linear-gradient(90deg, #e3f2fd, #e8eaf6)',
        sidebarHover: 'rgba(0, 0, 0, 0.04)',
        accent: '#8d6e63',
        tableBorder: '#e5e7eb',
        tableRowHover: '#f3f4f6',
        tableRow: '#ffffff',
      },
    };
  }

  // Dark por defecto
  return {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    primary: { main: '#705cdf', contrastText: '#ffffff' },
    secondary: { main: '#2196f3', contrastText: '#ffffff' },
    error: { main: '#f44336', contrastText: '#ffffff' },
    warning: { main: '#ff9800', contrastText: '#ffffff' },
    success: { main: '#A3BE8C', contrastText: '#ffffff' },
    info: { main: '#88C0D0', contrastText: '#ffffff' },
    positive: { main: '#A3BE8C', contrastText: '#ffffff' },
    negative: { main: '#BF616A', contrastText: '#ffffff' },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#888888',
    },
    custom: {
      appBarGradient: 'linear-gradient(90deg, #0F2027, #203A43, #2C5364)',
      sidebarHover: 'rgba(255, 255, 255, 0.06)',
      accent: '#EBCB8B',
      tableBorder: '#444',
      tableRowHover: '#3a3a3a',
      tableRow: '#2a2a2a',
    },
  };
};

export const getAppTheme = (mode = 'dark') =>
  createTheme({
    palette: getPaletteByMode(mode),
    typography: {
      fontFamily: `'Inter', 'IBM Plex Sans', 'Segoe UI', 'Roboto', Arial, sans-serif`,
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.95rem' },
      body2: { fontSize: '0.85rem' },
      subtitle1: { fontWeight: 500, fontSize: '1rem' },
      caption: { fontSize: '0.8rem' },
    },
    components: {
      MuiButton: {
        styleOverrides: { root: { borderRadius: 8, textTransform: 'none', fontWeight: 500 } },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: mode === 'light' ? '#e5e7eb' : '#444' },
          head: {
            fontWeight: 700,
            color: mode === 'light' ? '#1f2937' : '#ffffff',
            backgroundColor: mode === 'light' ? '#f3f4f6' : '#3a3a3a',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.85rem',
            backgroundColor: mode === 'light' ? '#111827' : '#232323',
            color: mode === 'light' ? '#f9fafb' : '#fff',
          },
        },
      },
    },
  });

// Export por defecto mantiene compatibilidad (dark)
const defaultTheme = getAppTheme('dark');
export default defaultTheme;
