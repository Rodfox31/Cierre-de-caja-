// src/utils/numberFormat.js
// Utilidades consistentes para formatear y parsear montos en toda la app

// Formatea un número como moneda ARS con 2 decimales por defecto
export function formatCurrency(value, opts = {}) {
  const num = normalizeNumber(value);
  const {
    locale = 'es-AR',
    currency = 'ARS',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = opts;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num || 0);
}

// Intenta convertir distintos formatos ingresados ("1.234,56", "$ 1.234,56", "1234.56") a Number
export function parseLocaleNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  let s = value.trim();
  // remover símbolo de moneda y espacios
  s = s.replace(/\s+/g, '');
  s = s.replace(/[^0-9,.-]/g, ''); // deja dígitos, coma, punto, signo

  if (!s) return 0;

  // Detectar si el formato es tipo es-AR: miles con punto y decimales con coma
  // Caso 1: tiene tanto punto como coma => asume formato es: "1.234,56"
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, ''); // quita separadores de miles
    s = s.replace(/,/g, '.'); // cambia coma decimal por punto
  } else if (s.includes(',')) {
    // Solo coma: puede ser decimal latino "1234,56"
    s = s.replace(/,/g, '.');
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// Normaliza a número aplicando parseLocaleNumber cuando sea string
export function normalizeNumber(value) {
  if (typeof value === 'number') return value;
  return parseLocaleNumber(value);
}
