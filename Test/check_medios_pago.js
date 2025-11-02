const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../db.js.db');
console.log('Usando base de datos:', dbPath);
const db = new sqlite3.Database(dbPath);

// Obtener los últimos 3 cierres para inspeccionar medios_pago
db.all("SELECT id, fecha, tienda, usuario, medios_pago FROM cierres ORDER BY id DESC LIMIT 3", [], (err, cierres) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }
  
  console.log('\n=== ANÁLISIS DE MEDIOS DE PAGO ===\n');
  
  cierres.forEach(cierre => {
    console.log(`\n--- Cierre ID: ${cierre.id} ---`);
    console.log(`Fecha: ${cierre.fecha}`);
    console.log(`Tienda: ${cierre.tienda}`);
    console.log(`Usuario: ${cierre.usuario}`);
    console.log(`\nmedios_pago (raw):`);
    console.log(cierre.medios_pago);
    console.log(`\nTipo: ${typeof cierre.medios_pago}`);
    
    if (cierre.medios_pago) {
      try {
        const parsed = JSON.parse(cierre.medios_pago);
        console.log('\nmedios_pago (parseado):');
        console.log(JSON.stringify(parsed, null, 2));
        
        // Verificar si es array u objeto
        if (Array.isArray(parsed)) {
          console.log('\n✓ Es un ARRAY con', parsed.length, 'elementos');
          parsed.forEach((medio, idx) => {
            console.log(`\n  [${idx}] ${medio.medio || 'sin nombre'}:`);
            console.log(`    - facturado: ${medio.facturado} (tipo: ${typeof medio.facturado})`);
            console.log(`    - cobrado: ${medio.cobrado} (tipo: ${typeof medio.cobrado})`);
            console.log(`    - differenceVal: ${medio.differenceVal} (tipo: ${typeof medio.differenceVal})`);
          });
        } else if (typeof parsed === 'object') {
          console.log('\n✓ Es un OBJETO');
          Object.entries(parsed).forEach(([key, value]) => {
            console.log(`\n  "${key}":`);
            console.log(`    - facturado: ${value.facturado} (tipo: ${typeof value.facturado})`);
            console.log(`    - cobrado: ${value.cobrado} (tipo: ${typeof value.cobrado})`);
            console.log(`    - differenceVal: ${value.differenceVal} (tipo: ${typeof value.differenceVal})`);
          });
        }
      } catch (parseError) {
        console.error('\n✗ Error al parsear:', parseError.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
  });
  
  db.close();
});
