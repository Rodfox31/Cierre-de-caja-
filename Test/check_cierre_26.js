// check_cierre_26.js - Verificar formato de facturado/cobrado en cierre #26
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

db.get('SELECT id, usuario, fecha, medios_pago FROM cierres WHERE id = 26', [], (err, row) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('No se encontró el cierre #26');
    db.close();
    return;
  }
  
  console.log('\n=== CIERRE #26 ===');
  console.log('ID:', row.id);
  console.log('Usuario:', row.usuario);
  console.log('Fecha:', row.fecha);
  console.log('\n=== MEDIOS DE PAGO (RAW) ===');
  console.log(row.medios_pago);
  
  try {
    const medios = JSON.parse(row.medios_pago);
    console.log('\n=== MEDIOS DE PAGO (PARSED) ===');
    console.log(JSON.stringify(medios, null, 2));
    
    console.log('\n=== ANÁLISIS DE FORMATO ===');
    medios.forEach((medio, index) => {
      console.log(`\n[${index}] ${medio.medio}:`);
      console.log(`  facturado: "${medio.facturado}" (tipo: ${typeof medio.facturado})`);
      console.log(`  cobrado: "${medio.cobrado}" (tipo: ${typeof medio.cobrado})`);
      
      // Detectar formato
      if (typeof medio.facturado === 'string') {
        if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(medio.facturado)) {
          console.log(`  ⚠️ facturado tiene formato argentino (punto como miles, coma decimal)`);
        } else if (/^\d+(\.\d+)?$/.test(medio.facturado)) {
          console.log(`  ✓ facturado tiene formato estándar (punto decimal)`);
        }
      }
      
      if (typeof medio.cobrado === 'string') {
        if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(medio.cobrado)) {
          console.log(`  ✓ cobrado tiene formato argentino (punto como miles, coma decimal)`);
        } else if (/^\d+(\.\d+)?$/.test(medio.cobrado)) {
          console.log(`  ⚠️ cobrado tiene formato estándar (punto decimal)`);
        }
      }
    });
    
  } catch (e) {
    console.error('Error al parsear JSON:', e.message);
  }
  
  db.close();
});
