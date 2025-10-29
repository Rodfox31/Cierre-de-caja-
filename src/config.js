import axios from 'axios';

export const API_BASE_URLS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://repulsive-spooky-orb-jj9jr7p69qq4f5x4w-3001.app.github.dev/'
];

export async function fetchWithFallback(path, options = {}) {
  const errors = [];
  for (let i = 0; i < API_BASE_URLS.length; i++) {
    try {
      const url = `${API_BASE_URLS[i]}${path}`;
      console.log(`Intentando conectar a: ${url}`);
      
      // Agregar modo cors explícito
      const fetchOptions = {
        ...options,
        mode: 'cors',
        credentials: 'omit',
      };
      
      const response = await fetch(url, fetchOptions);
      if (response.ok) {
        console.log(`✓ Conectado exitosamente a: ${url}`);
        return response;
      }
      errors.push(`${url}: HTTP ${response.status}`);
    } catch (err) {
      errors.push(`${API_BASE_URLS[i]}: ${err.message}`);
      console.warn(`✗ Error en ${API_BASE_URLS[i]}:`, err.message);
    }
  }
  console.error('Todos los backends fallaron:', errors);
  throw new Error(`No se pudo conectar a ningún servidor backend.\n${errors.join('\n')}`);
}

export async function axiosWithFallback(path, options = {}) {
  const errors = [];
  for (let i = 0; i < API_BASE_URLS.length; i++) {
    try {
      const url = `${API_BASE_URLS[i]}${path}`;
      console.log(`Intentando conectar a: ${url}`);
      
      const response = await axios({ 
        url, 
        ...options,
        withCredentials: false,
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✓ Conectado exitosamente a: ${url}`);
        return response;
      }
      errors.push(`${url}: HTTP ${response.status}`);
    } catch (err) {
      errors.push(`${API_BASE_URLS[i]}: ${err.message}`);
      console.warn(`✗ Error en ${API_BASE_URLS[i]}:`, err.message);
    }
  }
  console.error('Todos los backends fallaron:', errors);
  throw new Error(`No se pudo conectar a ningún servidor backend.\n${errors.join('\n')}`);
}
