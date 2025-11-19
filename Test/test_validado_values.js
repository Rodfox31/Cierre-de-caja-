const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('=== Verificando valores de validado en la base de datos ===\n');

// Ver la distribución de valores
db.all('SELECT validado, COUNT(*) as count FROM cierres GROUP BY validado ORDER BY validado', (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    db.close();
    return;
  }
  
  console.log('Distribución de estados de validación:');
  rows.forEach(r => {
    const estado = r.validado === 0 ? 'Sin validar (0)' : 
                   r.validado === 1 ? 'Validado (1)' : 
                   r.validado === 2 ? 'Revisar Boutique (2)' : 
                   `Desconocido (${r.validado})`;
    console.log(`  ${estado}: ${r.count} cierres`);
  });
  
  // Mostrar algunos ejemplos de cada tipo
  console.log('\n=== Ejemplos de cada tipo ===');
  
  db.all(`SELECT id, fecha, tienda, validado, usuario_validacion, fecha_validacion 
          FROM cierres 
          WHERE validado = 0 
          LIMIT 2`, (err, rows) => {
    if (!err && rows.length > 0) {
      console.log('\nEjemplos de Sin validar (0):');
      rows.forEach(r => console.log(`  ID: ${r.id} | Tienda: ${r.tienda} | Fecha: ${r.fecha}`));
    }
    
    db.all(`SELECT id, fecha, tienda, validado, usuario_validacion, fecha_validacion 
            FROM cierres 
            WHERE validado = 1 
            LIMIT 2`, (err, rows) => {
      if (!err && rows.length > 0) {
        console.log('\nEjemplos de Validado (1):');
        rows.forEach(r => console.log(`  ID: ${r.id} | Tienda: ${r.tienda} | Usuario: ${r.usuario_validacion}`));
      }
      
      db.all(`SELECT id, fecha, tienda, validado, usuario_validacion, fecha_validacion 
              FROM cierres 
              WHERE validado = 2 
              LIMIT 2`, (err, rows) => {
        if (!err && rows.length > 0) {
          console.log('\nEjemplos de Revisar Boutique (2):');
          rows.forEach(r => console.log(`  ID: ${r.id} | Tienda: ${r.tienda} | Usuario: ${r.usuario_validacion}`));
        } else {
          console.log('\n⚠️ No hay cierres con validado = 2 (Revisar Boutique)');
        }
        
        console.log('\n=== Fin de la verificación ===');
        db.close();
      });
    });
  });
});
