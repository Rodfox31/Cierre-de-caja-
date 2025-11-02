const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const moment = require('moment');

const dbPath = path.resolve(__dirname, '../db.js.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 DEBUG: Verificando datos del calendario CierreDiario\n');
console.log('='.repeat(80));

// Verificar qué hay en la DB
db.all('SELECT COUNT(*) as total FROM cierres', (err, rows) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log(`\n📊 Total registros en DB: ${rows[0].total}`);
  
  if (rows[0].total === 0) {
    console.log('\n⚠️  LA BASE DE DATOS ESTÁ VACÍA');
    console.log('   No hay datos para mostrar en el calendario.');
    console.log('   Necesitas cargar cierres primero.\n');
    db.close();
    return;
  }

  // Obtener una muestra de registros
  db.all('SELECT fecha, tienda, usuario, medios_pago FROM cierres LIMIT 5', (err2, cierres) => {
    if (err2) {
      console.error('Error:', err2);
      db.close();
      return;
    }

    console.log('\n📋 Muestra de registros:\n');
    cierres.forEach((cierre, idx) => {
      console.log(`${idx + 1}. Fecha: ${cierre.fecha}, Tienda: ${cierre.tienda}, Usuario: ${cierre.usuario}`);
      
      // Parsear medios_pago
      try {
        const medios = JSON.parse(cierre.medios_pago);
        if (Array.isArray(medios) && medios.length > 0) {
          console.log(`   Medios de pago: ${medios.length} medios`);
          console.log(`   Ejemplo: ${medios[0].medio} - Cobrado: ${medios[0].cobrado}, Facturado: ${medios[0].facturado}`);
        }
      } catch (e) {
        console.log('   ⚠️  Error parseando medios_pago');
      }
      console.log('');
    });

    // Obtener distribución por fecha
    db.all(`
      SELECT 
        DATE(fecha) as fecha_agrupada,
        COUNT(*) as cantidad
      FROM cierres 
      GROUP BY DATE(fecha)
      ORDER BY fecha_agrupada DESC
      LIMIT 10
    `, (err3, distribucion) => {
      if (err3) {
        console.error('Error:', err3);
        db.close();
        return;
      }

      console.log('\n📅 Distribución de cierres por fecha (últimos 10 días):\n');
      distribucion.forEach(d => {
        console.log(`   ${d.fecha_agrupada}: ${d.cantidad} cierres`);
      });

      // Obtener tiendas disponibles
      db.all('SELECT DISTINCT tienda FROM cierres', (err4, tiendas) => {
        if (err4) {
          console.error('Error:', err4);
          db.close();
          return;
        }

        console.log('\n🏪 Tiendas disponibles:\n');
        tiendas.forEach(t => {
          console.log(`   - ${t.tienda}`);
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Diagnóstico completo\n');
        
        db.close();
      });
    });
  });
});
