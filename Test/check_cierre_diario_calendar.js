const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment');

const dbPath = path.resolve(__dirname, '../db.js.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 VERIFICANDO DATOS PARA CALENDARIO DE CIERRE DIARIO\n');
console.log('='.repeat(80));

// Seleccionar octubre 2025 como ejemplo
const selectedYear = 2025;
const selectedMonth = 9; // Octubre (0-indexed en moment)
const selectedTienda = 'Solar';

console.log(`\n📅 Mes seleccionado: ${selectedMonth + 1}/${selectedYear}`);
console.log(`🏪 Tienda: ${selectedTienda}\n`);

// Obtener todos los cierres del mes
const query = `
  SELECT 
    fecha,
    tienda,
    usuario,
    medios_pago
  FROM cierres
  WHERE fecha LIKE ?
    AND tienda = ?
  ORDER BY fecha
`;

const fechaPattern = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-%`;

db.all(query, [fechaPattern, selectedTienda], (err, cierres) => {
  if (err) {
    console.error('❌ Error:', err);
    db.close();
    return;
  }

  console.log(`📊 Total de cierres encontrados: ${cierres.length}\n`);

  // Agrupar por día
  const datosPorDia = {};

  cierres.forEach(cierre => {
    const fecha = moment(cierre.fecha, 'YYYY-MM-DD');
    const dia = fecha.date();

    if (!datosPorDia[dia]) {
      datosPorDia[dia] = {
        fecha: cierre.fecha,
        totalCobrado: 0,
        totalFacturado: 0,
        diferencia: 0,
        cierresCount: 0,
        cierres: []
      };
    }

    // Parsear medios_pago
    let medios = [];
    try {
      medios = typeof cierre.medios_pago === 'string' 
        ? JSON.parse(cierre.medios_pago) 
        : cierre.medios_pago || [];
    } catch (e) {
      console.error(`⚠️  Error parseando medios_pago del cierre:`, cierre);
    }

    if (Array.isArray(medios)) {
      medios.forEach(medio => {
        const cobrado = parseFloat(medio.cobrado) || 0;
        const facturado = parseFloat(medio.facturado) || 0;
        datosPorDia[dia].totalCobrado += cobrado;
        datosPorDia[dia].totalFacturado += facturado;
      });
    }

    datosPorDia[dia].cierresCount++;
    datosPorDia[dia].cierres.push({
      usuario: cierre.usuario,
      medios: medios.length
    });
  });

  // Calcular diferencias
  Object.keys(datosPorDia).forEach(dia => {
    datosPorDia[dia].diferencia = 
      datosPorDia[dia].totalFacturado - datosPorDia[dia].totalCobrado;
  });

  // Mostrar resultados
  console.log('📅 DATOS DEL CALENDARIO POR DÍA:\n');
  console.log('='.repeat(80));

  Object.keys(datosPorDia).sort((a, b) => parseInt(a) - parseInt(b)).forEach(dia => {
    const datos = datosPorDia[dia];
    console.log(`\n📆 Día ${dia} (${datos.fecha}):`);
    console.log(`   Cierres: ${datos.cierresCount}`);
    console.log(`   Usuarios: ${datos.cierres.map(c => c.usuario).join(', ')}`);
    console.log(`   Cobrado (Real):     $ ${datos.totalCobrado.toFixed(2)}`);
    console.log(`   Facturado (Sieben): $ ${datos.totalFacturado.toFixed(2)}`);
    console.log(`   Diferencia:         $ ${datos.diferencia.toFixed(2)} ${
      Math.abs(datos.diferencia) < 0.01 ? '✅' :
      datos.diferencia > 0 ? '⬆️' : '⬇️'
    }`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 RESUMEN:`);
  console.log(`   Días con cierres: ${Object.keys(datosPorDia).length}`);
  
  const totalCierres = Object.values(datosPorDia).reduce((sum, d) => sum + d.cierresCount, 0);
  const totalCobrado = Object.values(datosPorDia).reduce((sum, d) => sum + d.totalCobrado, 0);
  const totalFacturado = Object.values(datosPorDia).reduce((sum, d) => sum + d.totalFacturado, 0);
  const totalDiferencia = totalFacturado - totalCobrado;
  
  console.log(`   Total cierres: ${totalCierres}`);
  console.log(`   Total Cobrado: $ ${totalCobrado.toFixed(2)}`);
  console.log(`   Total Facturado: $ ${totalFacturado.toFixed(2)}`);
  console.log(`   Diferencia total: $ ${totalDiferencia.toFixed(2)}\n`);

  db.close();
});
