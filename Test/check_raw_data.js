const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

db.get('SELECT medios_pago FROM cierres WHERE usuario = ?', ['NNALEGREWA'], (err, row) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 Datos crudos de medios_pago:\n');
  console.log(row.medios_pago);
  console.log('\n');
  
  try {
    const medios = JSON.parse(row.medios_pago);
    console.log('📊 Medios parseados:\n');
    medios.forEach((medio, idx) => {
      console.log(`${idx + 1}. ${medio.medio}:`);
      console.log(`   cobrado (crudo): "${medio.cobrado}" (tipo: ${typeof medio.cobrado})`);
      console.log(`   facturado (crudo): "${medio.facturado}" (tipo: ${typeof medio.facturado})`);
    });
  } catch (e) {
    console.error('Error parseando:', e.message);
  }
  
  db.close();
});
