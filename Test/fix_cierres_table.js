// fix_cierres_table.js - Renombrar cierres_new a cierres
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n🔧 CORRIGIENDO TABLA CIERRES...\n');

// Simplemente renombrar
db.run('ALTER TABLE cierres_new RENAME TO cierres', (err) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }
  
  console.log('✅ Tabla renombrada exitosamente');
  
  // Verificar
  db.get("SELECT COUNT(*) as total FROM cierres", [], (err, row) => {
    if (err) {
      console.error('❌ Error al verificar:', err.message);
    } else {
      console.log(`✅ ${row.total} cierres disponibles`);
    }
    
    // Mostrar nueva estructura
    db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='cierres'", [], (err, schema) => {
      console.log('\n📋 NUEVA ESTRUCTURA:\n');
      console.log(schema.sql);
      console.log('\n✅ Campo "fondo" eliminado correctamente\n');
      db.close();
    });
  });
});
