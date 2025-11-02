// normalize_all_medios_pago.js - Normalizar cobrado a NUMBER en todos los cierres
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

// Función para normalizar números
function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  if (str === '') return 0;
  
  // Eliminar símbolo de moneda y espacios
  let clean = str.replace(/\$/g, '').trim();
  
  // Si tiene formato argentino (punto como miles, coma como decimal)
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(clean)) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  // Si solo tiene coma decimal
  else if (/^\d+(,\d+)?$/.test(clean)) {
    clean = clean.replace(',', '.');
  }
  
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

console.log('\n🔧 NORMALIZANDO TIPOS DE DATOS EN medios_pago...\n');

db.all('SELECT id, usuario, fecha, medios_pago FROM cierres', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }
  
  console.log(`📊 Total de cierres a procesar: ${rows.length}\n`);
  
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  rows.forEach((row) => {
    try {
      const medios = JSON.parse(row.medios_pago);
      let needsUpdate = false;
      
      // Verificar si algún medio tiene cobrado como string
      medios.forEach(medio => {
        if (typeof medio.cobrado === 'string' && medio.cobrado !== '') {
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        // Normalizar TODOS los campos numéricos
        const mediosNormalized = medios.map(medio => {
          const facturadoNum = normalizeNumber(medio.facturado);
          const cobradoNum = normalizeNumber(medio.cobrado);
          
          return {
            ...medio,
            facturado: facturadoNum,
            cobrado: cobradoNum,
            differenceVal: cobradoNum - facturadoNum
          };
        });
        
        // Actualizar en BD
        const stmt = db.prepare('UPDATE cierres SET medios_pago = ? WHERE id = ?');
        stmt.run(JSON.stringify(mediosNormalized), row.id, function(err) {
          if (err) {
            console.error(`❌ Error en cierre ${row.id}:`, err.message);
            errors++;
          } else {
            console.log(`✅ Cierre ${row.id} (${row.usuario} - ${row.fecha})`);
            updated++;
          }
          
          processed++;
          checkCompletion();
        });
        stmt.finalize();
      } else {
        console.log(`⏭️  Cierre ${row.id} - Ya normalizado`);
        skipped++;
        processed++;
        checkCompletion();
      }
    } catch (e) {
      console.error(`❌ Error parseando cierre ${row.id}:`, e.message);
      errors++;
      processed++;
      checkCompletion();
    }
  });
  
  function checkCompletion() {
    if (processed === rows.length) {
      console.log('\n' + '='.repeat(60));
      console.log('\n📈 RESUMEN:\n');
      console.log(`  Total: ${rows.length}`);
      console.log(`  ✅ Actualizados: ${updated}`);
      console.log(`  ⏭️  Sin cambios: ${skipped}`);
      console.log(`  ❌ Errores: ${errors}`);
      console.log('\n🎉 NORMALIZACIÓN COMPLETA');
      console.log('   - Todos los números en medios_pago son NUMBER');
      console.log('   - facturado: NUMBER');
      console.log('   - cobrado: NUMBER');
      console.log('   - differenceVal: NUMBER (recalculado)');
      console.log('='.repeat(60) + '\n');
      
      db.close();
    }
  }
});
