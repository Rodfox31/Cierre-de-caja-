import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ColorModeContext, getAppTheme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import './global.css'; // Estilos globales para fontSize dinámico

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  const Root = () => {
    const [mode, setMode] = useState(() => {
      const saved = window.localStorage.getItem('themeMode');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    });
    
    // Estado para el tamaño de fuente
    const [fontSize, setFontSize] = useState(() => {
      try {
        const savedSettings = window.localStorage.getItem('appSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          return settings.config_font_size || 14;
        }
      } catch (e) {
        console.error('Error al cargar configuración de fuente:', e);
      }
      return 14;
    });

    // Aplicar tamaño de fuente al montar y cuando cambie
    useEffect(() => {
      document.documentElement.style.fontSize = `${fontSize}px`;
    }, [fontSize]);

    // Escuchar cambios en localStorage (cuando se guarda desde Ajustes)
    useEffect(() => {
      const handleStorageChange = () => {
        try {
          const savedSettings = window.localStorage.getItem('appSettings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.config_font_size) {
              setFontSize(settings.config_font_size);
            }
          }
        } catch (e) {
          console.error('Error al actualizar fuente:', e);
        }
      };

      // Escuchar evento personalizado
      window.addEventListener('fontSizeChanged', handleStorageChange);
      
      return () => {
        window.removeEventListener('fontSizeChanged', handleStorageChange);
      };
    }, []);

    useEffect(() => {
      try { window.localStorage.setItem('themeMode', mode); } catch {}
    }, [mode]);
    const colorMode = useMemo(() => ({
      mode,
      toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }), [mode]);
    const appTheme = useMemo(() => getAppTheme(mode), [mode]);

    return (
      <AuthProvider>
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={appTheme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </ColorModeContext.Provider>
      </AuthProvider>
    );
  };

  root.render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
} else {
  console.error('No se encontró el elemento #root en index.html');
}
