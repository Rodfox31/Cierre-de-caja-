// verify_tables.js - Verificar estado de las tablas
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }
  
  console.log('\n📋 TABLAS EN LA BASE DE DATOS:\n');
  tables.forEach(t => console.log(`  - ${t.name}`));
  
  // Verificar estructura de justificaciones
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='justificaciones'", [], (err, row) => {
    if (row) {
      console.log('\n✅ Tabla justificaciones:');
      console.log(row.sql);
    }
    
    // Verificar estructura de cierres
    db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='cierres'", [], (err, row2) => {
      if (row2) {
        console.log('\n✅ Tabla cierres:');
        console.log(row2.sql);
      } else {
        console.log('\n❌ Tabla cierres NO EXISTE');
      }
      
      // Verificar cierres_new
      db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='cierres_new'", [], (err, row3) => {
        if (row3) {
          console.log('\n⚠️  Tabla cierres_new existe:');
          console.log(row3.sql);
        }
        
        db.close();
      });
    });
  });
});
