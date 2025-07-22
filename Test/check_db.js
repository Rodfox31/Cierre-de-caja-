const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../db.js.db');
console.log('Usando base de datos:', dbPath);
const db = new sqlite3.Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (errTab, tables) => {
  if (errTab) {
    console.error('Error al listar tablas:', errTab.message);
    return;
  }
  const tableNames = tables.map(t => t.name);
  if (!tableNames.includes('cierres')) {
    console.error("\nADVERTENCIA: La tabla 'cierres' NO existe en la base de datos. Tablas encontradas:", tableNames);
    db.close();
    return;
  }

  db.all('PRAGMA table_info(cierres)', [], (err, columns) => {
    if (err) {
      console.error('Error:', err.message);
      db.close();
      return;
    }
    console.log('Columnas actuales en la tabla cierres:');
    columns.forEach(col => console.log(`- ${col.name} (${col.type})`));

    const columnNames = columns.map(col => col.name);
    console.log('\nColumnas de validación necesarias:');
    console.log('- validado:', columnNames.includes('validado') ? '√ Existe' : '? Falta');
    console.log('- usuario_validacion:', columnNames.includes('usuario_validacion') ? '√ Existe' : '? Falta');
    console.log('- fecha_validacion:', columnNames.includes('fecha_validacion') ? '√ Existe' : '? Falta');    // Consultas específicas para investigar problemas
    db.all("SELECT COUNT(*) as cantidad FROM cierres WHERE tienda = 'Solar' AND (strftime('%m', fecha) = '07' OR substr(fecha,4,2) = '07')", [], (err2, rows) => {
      if (err2) {
        console.error('Error en consulta de cierres de Solar en Julio:', err2.message);
      } else {
        console.log(`\nCantidad de cierres de la tienda 'Solar' en Julio: ${rows[0].cantidad}`);
      }
      
      // Consultar cierres con fechas inválidas
      db.all("SELECT id, fecha, tienda FROM cierres WHERE fecha IS NULL OR fecha = '' OR fecha = 'Invalid date' ORDER BY id DESC LIMIT 10", [], (err3, invalidRows) => {
        if (err3) {
          console.error('Error consultando fechas inválidas:', err3.message);
        } else {
          console.log('\nCierres con fechas inválidas:');
          invalidRows.forEach(row => {
            console.log(`- ID: ${row.id}, Fecha: "${row.fecha}", Tienda: ${row.tienda}`);
          });
        }
        
        // Mostrar últimos cierres de Solar para verificar
        db.all("SELECT id, fecha, tienda FROM cierres WHERE tienda = 'Solar' ORDER BY id DESC LIMIT 5", [], (err4, solarRows) => {
          if (err4) {
            console.error('Error consultando cierres de Solar:', err4.message);
          } else {
            console.log('\nÚltimos 5 cierres de Solar:');
            solarRows.forEach(row => {
              console.log(`- ID: ${row.id}, Fecha: "${row.fecha}", Tienda: ${row.tienda}`);
            });
          }
          db.close();
        });
      });
    });
  });
});
