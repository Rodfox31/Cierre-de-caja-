const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment');

const dbPath = path.resolve(__dirname, '../db.js.db');
const db = new sqlite3.Database(dbPath);

// Función para normalizar números (igual que en el frontend)
function normalizeNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Simular lo que hace fetchCalendarioData
const selectedYear = 2025;
const selectedMonth = 9; // Octubre (0-indexed)
const selectedTienda = 'Recoleta';

console.log('\n🔍 SIMULANDO CALENDARIO DE CIERRE DIARIO');
console.log('='.repeat(80));
console.log(`📅 Mes/Año: ${selectedMonth + 1}/${selectedYear}`);
console.log(`🏪 Tienda: ${selectedTienda}\n`);

db.all('SELECT fecha, tienda, usuario, medios_pago FROM cierres', (err, allCierres) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log(`📊 Total cierres en DB: ${allCierres.length}\n`);

  // Filtrar por mes y año
  let cierresFiltrados = allCierres.filter(cierre => {
    if (!cierre.fecha) return false;
    const cierreFecha = moment(cierre.fecha, 'YYYY-MM-DD');
    return cierreFecha.year() === selectedYear && 
           cierreFecha.month() === selectedMonth;
  });

  console.log(`📅 Cierres en ${selectedMonth + 1}/${selectedYear}: ${cierresFiltrados.length}`);

  // Filtrar por tienda
  if (selectedTienda) {
    cierresFiltrados = cierresFiltrados.filter(cierre => cierre.tienda === selectedTienda);
    console.log(`🏪 Cierres de ${selectedTienda}: ${cierresFiltrados.length}\n`);
  }

  // Agrupar por día
  const datosPorDia = {};
  cierresFiltrados.forEach(cierre => {
    const dia = moment(cierre.fecha, 'YYYY-MM-DD').date();
    
    if (!datosPorDia[dia]) {
      datosPorDia[dia] = {
        fecha: cierre.fecha,
        totalCobrado: 0,
        totalFacturado: 0,
        diferencia: 0,
        cierresCount: 0,
        usuarios: []
      };
    }

    // Procesar medios de pago
    if (cierre.medios_pago) {
      try {
        const medios = JSON.parse(cierre.medios_pago);
        if (Array.isArray(medios)) {
          medios.forEach(medio => {
            const cobrado = normalizeNumber(medio.cobrado);
            const facturado = normalizeNumber(medio.facturado);
            datosPorDia[dia].totalCobrado += cobrado;
            datosPorDia[dia].totalFacturado += facturado;
          });
        }
      } catch (e) {
        console.error(`Error parseando medios_pago: ${e.message}`);
      }
    }

    datosPorDia[dia].cierresCount++;
    datosPorDia[dia].usuarios.push(cierre.usuario);
  });

  // Calcular diferencias
  Object.keys(datosPorDia).forEach(dia => {
    datosPorDia[dia].diferencia = 
      datosPorDia[dia].totalCobrado - datosPorDia[dia].totalFacturado;
  });

  // Mostrar resultados
  console.log('📅 DATOS DEL CALENDARIO:\n');
  console.log('='.repeat(80));

  const dias = Object.keys(datosPorDia).sort((a, b) => parseInt(a) - parseInt(b));
  
  if (dias.length === 0) {
    console.log('\n⚠️  NO HAY DATOS PARA MOSTRAR EN EL CALENDARIO');
    console.log('\nPosibles causas:');
    console.log('  1. No hay cierres para el mes/año seleccionado');
    console.log('  2. La tienda seleccionada no tiene datos');
    console.log('  3. El formato de fecha en DB es incorrecto\n');
  } else {
    dias.forEach(dia => {
      const datos = datosPorDia[dia];
      console.log(`\n📆 Día ${dia} (${datos.fecha}):`);
      console.log(`   Cierres: ${datos.cierresCount}`);
      console.log(`   Usuarios: ${datos.usuarios.join(', ')}`);
      console.log(`   Total Cobrado:    $ ${datos.totalCobrado.toLocaleString('es-AR', {minimumFractionDigits: 2})}`);
      console.log(`   Total Facturado:  $ ${datos.totalFacturado.toLocaleString('es-AR', {minimumFractionDigits: 2})}`);
      console.log(`   Diferencia:       $ ${datos.diferencia.toLocaleString('es-AR', {minimumFractionDigits: 2})} ${
        Math.abs(datos.diferencia) < 0.01 ? '⚪' :
        datos.diferencia > 0 ? '🟢⬆️' : '🔴⬇️'
      }`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Simulación completa\n');
  
  db.close();
});
