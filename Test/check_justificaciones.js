const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

db.all('SELECT id, cierre_id, orden, cliente, motivo, ajuste FROM justificaciones ORDER BY cierre_id, id', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Justificaciones en la DB:');
    rows.forEach(r => {
      console.log(`ID: ${r.id}, Cierre: ${r.cierre_id}, Orden: ${r.orden}, Cliente: ${r.cliente}, Motivo: ${r.motivo}, Ajuste: ${r.ajuste}`);
    });
    console.log(`Total justificaciones: ${rows.length}`);
  }
  db.close();
});
