const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('🔍 Verificando cierre ID 7...\n');

db.get('SELECT * FROM cierres WHERE id = 7', [], (err, cierre) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  if (!cierre) {
    console.log('❌ No se encontró el cierre ID 7');
    db.close();
    return;
  }
  
  console.log('📊 Datos del cierre ID 7:\n');
  console.log(`Usuario: ${cierre.usuario}`);
  console.log(`Fecha: ${cierre.fecha}`);
  console.log(`Tienda: ${cierre.tienda}`);
  console.log(`\n💰 Montos Cobrados:`);
  console.log(`- Efectivo: $${cierre.efectivo_cobrado || 0}`);
  console.log(`- MPoint: $${cierre.mpoint_cobrado || 0}`);
  console.log(`- Mp - Qr: $${cierre.mp_qr_cobrado || 0}`);
  console.log(`- Débito: $${cierre.debito_cobrado || 0}`);
  console.log(`- Crédito: $${cierre.credito_cobrado || 0}`);
  console.log(`\n💵 Montos Facturados:`);
  console.log(`- Efectivo: $${cierre.efectivo_facturado || 0}`);
  console.log(`- MPoint: $${cierre.mpoint_facturado || 0}`);
  console.log(`- Mp - Qr: $${cierre.mp_qr_facturado || 0}`);
  console.log(`- Débito: $${cierre.debito_facturado || 0}`);
  console.log(`- Crédito: $${cierre.credito_facturado || 0}`);
  console.log(`\n📝 Otros datos:`);
  console.log(`- Hora: ${cierre.hora_cierre || 'N/A'}`);
  console.log(`- Created at: ${cierre.created_at || 'N/A'}`);
  
  db.close();
});
