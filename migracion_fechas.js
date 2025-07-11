const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.js.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
    return;
  }
  console.log('Conectado a la base de datos SQLite.');
});

db.serialize(() => {
  db.all("SELECT id, fecha FROM cierres", [], (err, rows) => {
    if (err) {
      console.error('Error al leer los cierres:', err.message);
      db.close();
      return;
    }

    let updates = 0;
    const totalRows = rows.length;
    if (totalRows === 0) {
      console.log('No hay registros para migrar.');
      db.close();
      return;
    }

    rows.forEach((row) => {
      // Verificar si la fecha ya está en el formato correcto (YYYY-MM-DD)
      if (moment(row.fecha, 'YYYY-MM-DD', true).isValid()) {
        console.log(`ID ${row.id}: La fecha '${row.fecha}' ya está en el formato correcto. Saltando.`);
        return;
      }
      
      // Intentar convertir desde DD-MM-YYYY
      const fechaOriginal = row.fecha;
      const fechaMoment = moment(fechaOriginal, 'DD-MM-YYYY', true);

      if (fechaMoment.isValid()) {
        const nuevaFecha = fechaMoment.format('YYYY-MM-DD');
        db.run(`UPDATE cierres SET fecha = ? WHERE id = ?`, [nuevaFecha, row.id], function(err) {
          if (err) {
            console.error(`Error al actualizar el ID ${row.id}:`, err.message);
          } else {
            console.log(`ID ${row.id}: '${fechaOriginal}' -> '${nuevaFecha}'`);
            updates++;
          }
        });
      } else {
        console.warn(`ID ${row.id}: La fecha '${fechaOriginal}' tiene un formato no reconocido. Saltando.`);
      }
    });

    // Cerrar la base de datos después de que todas las operaciones de actualización se completen
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar la base de datos:', err.message);
      } else {
        console.log('Migración completada.');
        console.log(`${updates} de ${totalRows} registros fueron actualizados.`);
        console.log('La base de datos se ha cerrado correctamente.');
      }
    });
  });
});
