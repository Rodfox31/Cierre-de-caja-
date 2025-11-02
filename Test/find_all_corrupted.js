const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('🔍 Buscando TODOS los datos corruptos...\n');

db.all(`SELECT id, usuario, fecha, medios_pago FROM cierres ORDER BY fecha, usuario`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`📊 Total registros: ${rows.length}\n`);
  
  let corruptos = [];
  
  rows.forEach((row, index) => {
    const medios = JSON.parse(row.medios_pago);
    
    medios.forEach(m => {
      if (m.cobrado > 100000000 || m.facturado > 100000000) {
        corruptos.push({
          id: row.id,
          usuario: row.usuario,
          fecha: row.fecha,
          medio: m.medio,
          cobrado: m.cobrado,
          facturado: m.facturado
        });
      }
    });
  });
  
  if (corruptos.length === 0) {
    console.log('✅ No se encontraron datos corruptos (valores > 100 millones)');
  } else {
    console.log(`⚠️ Se encontraron ${corruptos.length} valores corruptos:\n`);
    corruptos.forEach(c => {
      console.log(`ID: ${c.id} | Usuario: ${c.usuario} | Fecha: ${c.fecha}`);
      console.log(`  Medio: ${c.medio}`);
      console.log(`  Cobrado: ${c.cobrado.toLocaleString()}`);
      console.log(`  Facturado: ${c.facturado.toLocaleString()}`);
      console.log('');
    });
  }
  
  // Ahora verificar los totales del día 7
  console.log('\n📅 Verificando totales del día 7...\n');
  
  const cierresDia7 = rows.filter(r => r.fecha === '2025-10-07');
  let totalCobrado = 0;
  let totalFacturado = 0;
  
  cierresDia7.forEach(row => {
    const medios = JSON.parse(row.medios_pago);
    console.log(`Usuario: ${row.usuario}`);
    medios.forEach(m => {
      console.log(`  ${m.medio}: C=${m.cobrado}, F=${m.facturado}`);
      totalCobrado += m.cobrado || 0;
      totalFacturado += m.facturado || 0;
    });
    console.log('');
  });
  
  console.log(`\n💰 Total Cobrado: ${totalCobrado.toLocaleString()}`);
  console.log(`💰 Total Facturado: ${totalFacturado.toLocaleString()}`);
  console.log(`💰 Diferencia: ${(totalCobrado - totalFacturado).toLocaleString()}`);
  
  db.close();
});
