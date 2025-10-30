const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('Agregando campos para revisar_boutique...');

db.serialize(() => {
  // Agregar campo revisar_boutique
  db.run('ALTER TABLE cierres ADD COLUMN revisar_boutique INTEGER DEFAULT 0', (err) => {
    if (err) {
      console.error('Error agregando revisar_boutique:', err.message);
    } else {
      console.log('✓ Campo revisar_boutique agregado exitosamente');
    }
  });

  // Agregar campo usuario_revision
  db.run('ALTER TABLE cierres ADD COLUMN usuario_revision TEXT', (err) => {
    if (err) {
      console.error('Error agregando usuario_revision:', err.message);
    } else {
      console.log('✓ Campo usuario_revision agregado exitosamente');
    }
  });

  // Agregar campo fecha_revision
  db.run('ALTER TABLE cierres ADD COLUMN fecha_revision TEXT', (err) => {
    if (err) {
      console.error('Error agregando fecha_revision:', err.message);
    } else {
      console.log('✓ Campo fecha_revision agregado exitosamente');
    }
    
    // Verificar la estructura final
    db.all('PRAGMA table_info(cierres)', (err, rows) => {
      if (err) {
        console.error('Error verificando estructura:', err.message);
      } else {
        console.log('\n=== Estructura actualizada de la tabla cierres ===');
        rows.forEach(r => {
          console.log(`${r.name.padEnd(25)} | ${r.type.padEnd(10)} | Default: ${r.dflt_value || 'NULL'}`);
        });
      }
      db.close();
      console.log('\n✓ Base de datos actualizada y cerrada correctamente');
    });
  });
});
