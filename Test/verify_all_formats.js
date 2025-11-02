// verify_all_formats.js - Verificar que todos los cierres tienen formato consistente
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

db.all('SELECT id, usuario, fecha, medios_pago FROM cierres ORDER BY id', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }
  
  console.log(`\n📊 Verificando ${rows.length} registros...\n`);
  
  let allOk = true;
  let problematicos = [];
  
  rows.forEach(row => {
    try {
      const medios = JSON.parse(row.medios_pago);
      let hasIssue = false;
      let issues = [];
      
      medios.forEach((medio, idx) => {
        if (typeof medio.facturado !== 'number') {
          hasIssue = true;
          issues.push(`  - [${idx}] ${medio.medio}: facturado es ${typeof medio.facturado} (${medio.facturado})`);
        }
        if (medio.cobrado !== '' && typeof medio.cobrado !== 'number') {
          hasIssue = true;
          issues.push(`  - [${idx}] ${medio.medio}: cobrado es ${typeof medio.cobrado} (${medio.cobrado})`);
        }
      });
      
      if (hasIssue) {
        allOk = false;
        problematicos.push({
          id: row.id,
          usuario: row.usuario,
          fecha: row.fecha,
          issues: issues
        });
        console.log(`❌ Cierre ${row.id} (${row.usuario} - ${row.fecha}):`);
        issues.forEach(issue => console.log(issue));
        console.log('');
      } else {
        console.log(`✅ Cierre ${row.id} - OK`);
      }
    } catch (e) {
      console.error(`❌ Error al parsear cierre ${row.id}:`, e.message);
      allOk = false;
    }
  });
  
  console.log(`\n${'='.repeat(60)}`);
  if (allOk) {
    console.log('🎉 ¡TODOS LOS REGISTROS TIENEN FORMATO CONSISTENTE!');
    console.log('   - facturado: number');
    console.log('   - cobrado: number');
  } else {
    console.log(`⚠️  SE ENCONTRARON ${problematicos.length} REGISTROS CON PROBLEMAS`);
    console.log('\nResumen de problemas:');
    problematicos.forEach(p => {
      console.log(`\nCierre ${p.id} (${p.usuario} - ${p.fecha}):`);
      p.issues.forEach(issue => console.log(issue));
    });
  }
  console.log('='.repeat(60));
  
  db.close();
});
