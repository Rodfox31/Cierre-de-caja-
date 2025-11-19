/**
 * Script para crear la tabla cierres_diarios en la base de datos
 * Ejecutar con: node create_cierres_diarios_table.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'db.js.db');
const db = new sqlite3.Database(dbPath);

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS cierres_diarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    usuario TEXT NOT NULL,
    tienda TEXT,
    medios_pago TEXT NOT NULL,
    comentarios TEXT,
    fecha_creacion TEXT DEFAULT (datetime('now', 'localtime'))
  )
`;

db.run(createTableQuery, (err) => {
  if (err) {
    console.error('❌ Error al crear la tabla cierres_diarios:', err.message);
  } else {
    console.log('✅ Tabla cierres_diarios creada exitosamente');
    console.log('\nEstructura de la tabla:');
    console.log('- id: INTEGER PRIMARY KEY AUTOINCREMENT');
    console.log('- fecha: TEXT NOT NULL (formato DD/MM/YYYY)');
    console.log('- usuario: TEXT NOT NULL (username del usuario logueado)');
    console.log('- tienda: TEXT (nombre de la boutique/tienda)');
    console.log('- medios_pago: TEXT NOT NULL (JSON con array de medios de pago)');
    console.log('- comentarios: TEXT (comentarios del cierre diario)');
    console.log('- fecha_creacion: TEXT (timestamp automático)');
    console.log('\nEstructura de medios_pago JSON:');
    console.log('[');
    console.log('  {');
    console.log('    "medio": "Efectivo",');
    console.log('    "cobrado": 50000.00,');
    console.log('    "facturado": 49000.00,');
    console.log('    "diferencia": 1000.00');
    console.log('  }');
    console.log(']');
  }
  
  db.close();
});
