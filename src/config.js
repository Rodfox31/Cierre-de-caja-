import axios from 'axios';

export const API_BASE_URLS = [
  'http://localhost:3001',
  'https://studious-rotary-phone-69w9v5x6wwp6f475x-3001.app.github.dev'
];

export async function fetchWithFallback(path, options) {
  for (let i = 0; i < API_BASE_URLS.length; i++) {
    try {
      const response = await fetch(`${API_BASE_URLS[i]}${path}`, options);
      if (response.ok) return response;
    } catch (err) {
      // Si falla, intenta el siguiente
    }
  }
  throw new Error('No se pudo conectar a ningún servidor backend.');
}

export async function axiosWithFallback(path, options = {}) {
  for (let i = 0; i < API_BASE_URLS.length; i++) {
    try {
      const url = `${API_BASE_URLS[i]}${path}`;
      const response = await axios({ url, ...options });
      if (response.status >= 200 && response.status < 300) return response;
    } catch (err) {
      // Si falla, intenta el siguiente
    }
  }
  throw new Error('No se pudo conectar a ningún servidor backend.');
}
