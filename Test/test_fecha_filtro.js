const moment = require('moment');

// Simular lo que hace el frontend
const selectedYear = 2025;
const selectedMonth = 9; // Octubre (0-indexed)
const selectedDay = 7;

console.log('=== CONFIGURACIÓN SELECCIONADA ===');
console.log('Año:', selectedYear);
console.log('Mes (0-11):', selectedMonth, '→', moment().month(selectedMonth).format('MMMM'));
console.log('Día:', selectedDay);
console.log('');

// Simular fechas de la BD
const fechasBD = [
  '2025-10-07',
  '2025-11-07',
  '2025-09-07'
];

console.log('=== PRUEBA DE FILTRADO ===');
fechasBD.forEach(fecha => {
  const cierreFecha = moment(fecha, 'YYYY-MM-DD');
  const coincideAño = cierreFecha.year() === selectedYear;
  const coincideMes = cierreFecha.month() === selectedMonth;
  const coincideDia = cierreFecha.date() === selectedDay;
  
  console.log(`Fecha BD: ${fecha}`);
  console.log(`  Año: ${cierreFecha.year()} (coincide: ${coincideAño})`);
  console.log(`  Mes: ${cierreFecha.month()} (coincide: ${coincideMes})`);
  console.log(`  Día: ${cierreFecha.date()} (coincide: ${coincideDia})`);
  console.log(`  ✓ Pasa filtro: ${coincideAño && coincideMes && coincideDia}`);
  console.log('');
});
