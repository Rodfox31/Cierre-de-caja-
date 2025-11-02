// fix_medios_pago_format.js - Corregir formato inconsistente de facturado/cobrado
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

// Función para normalizar números desde formato argentino
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

// Obtener todos los cierres
db.all('SELECT id, usuario, fecha, medios_pago FROM cierres', [], (err, rows) => {
  if (err) {
    console.error('Error al consultar cierres:', err.message);
    db.close();
    return;
  }
  
  console.log(`\n📋 Total de registros a procesar: ${rows.length}\n`);
  
  let processed = 0;
  let updated = 0;
  let errors = 0;
  
  rows.forEach((row, index) => {
    try {
      const medios = JSON.parse(row.medios_pago);
      let needsUpdate = false;
      
      // Verificar si algún medio tiene formato inconsistente
      medios.forEach(medio => {
        const facturadoIsString = typeof medio.facturado === 'string';
        const cobradoIsString = typeof medio.cobrado === 'string' && medio.cobrado !== '';
        
        if (facturadoIsString || cobradoIsString) {
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        // Normalizar todos los campos
        const mediosNormalized = medios.map(medio => ({
          ...medio,
          facturado: normalizeNumber(medio.facturado),
          cobrado: normalizeNumber(medio.cobrado),
          differenceVal: normalizeNumber(medio.cobrado) - normalizeNumber(medio.facturado)
        }));
        
        // Actualizar en la base de datos
        const stmt = db.prepare('UPDATE cierres SET medios_pago = ? WHERE id = ?');
        stmt.run(JSON.stringify(mediosNormalized), row.id, function(updateErr) {
          if (updateErr) {
            console.error(`❌ Error al actualizar cierre ${row.id}:`, updateErr.message);
            errors++;
          } else {
            console.log(`✅ Cierre ${row.id} (${row.usuario} - ${row.fecha}) actualizado`);
            updated++;
          }
          
          processed++;
          
          // Si terminamos de procesar todos
          if (processed === rows.length) {
            console.log(`\n=== RESUMEN ===`);
            console.log(`Total registros: ${rows.length}`);
            console.log(`✅ Actualizados: ${updated}`);
            console.log(`⏭️  Sin cambios: ${rows.length - updated - errors}`);
            console.log(`❌ Errores: ${errors}`);
            db.close();
          }
        });
        stmt.finalize();
      } else {
        console.log(`⏭️  Cierre ${row.id} - Ya está en formato correcto`);
        processed++;
        
        if (processed === rows.length) {
          console.log(`\n=== RESUMEN ===`);
          console.log(`Total registros: ${rows.length}`);
          console.log(`✅ Actualizados: ${updated}`);
          console.log(`⏭️  Sin cambios: ${rows.length - updated - errors}`);
          console.log(`❌ Errores: ${errors}`);
          db.close();
        }
      }
    } catch (e) {
      console.error(`❌ Error al procesar cierre ${row.id}:`, e.message);
      errors++;
      processed++;
      
      if (processed === rows.length) {
        console.log(`\n=== RESUMEN ===`);
        console.log(`Total registros: ${rows.length}`);
        console.log(`✅ Actualizados: ${updated}`);
        console.log(`⏭️  Sin cambios: ${rows.length - updated - errors}`);
        console.log(`❌ Errores: ${errors}`);
        db.close();
      }
    }
  });
});
