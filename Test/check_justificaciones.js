const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

db.all('SELECT id, cierre_id, fecha, usuario, orden, cliente, medio_pago, motivo, ajuste FROM justificaciones ORDER BY cierre_id, id', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Justificaciones en la DB:');
    rows.forEach(r => {
      console.log(`ID: ${r.id}, Cierre: ${r.cierre_id}, Fecha: ${r.fecha || 'N/A'}, Usuario: ${r.usuario || 'N/A'}, Orden: ${r.orden || 'N/A'}, Cliente: ${r.cliente || 'N/A'}, Medio: ${r.medio_pago || 'N/A'}, Motivo: ${r.motivo || 'N/A'}, Ajuste: ${r.ajuste || 0}`);
    });
    console.log(`Total justificaciones: ${rows.length}`);
  }
  db.close();
});
