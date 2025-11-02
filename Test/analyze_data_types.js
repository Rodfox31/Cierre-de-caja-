// analyze_data_types.js - Analizar tipos de datos en medios_pago y justificaciones
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n📊 ANÁLISIS DE TIPOS DE DATOS\n');
console.log('='.repeat(60) + '\n');

// 1. Analizar medios_pago en cierres
console.log('1️⃣  TABLA: cierres (campo medios_pago)\n');

db.all('SELECT id, usuario, fecha, medios_pago FROM cierres LIMIT 5', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  
  rows.forEach((row, idx) => {
    console.log(`\nCierre ${row.id} (${row.usuario}):`);
    try {
      const medios = JSON.parse(row.medios_pago);
      medios.slice(0, 2).forEach(medio => {
        console.log(`  ${medio.medio}:`);
        console.log(`    facturado: ${medio.facturado} (${typeof medio.facturado})`);
        console.log(`    cobrado: ${medio.cobrado} (${typeof medio.cobrado})`);
        console.log(`    differenceVal: ${medio.differenceVal} (${typeof medio.differenceVal})`);
      });
    } catch (e) {
      console.log(`  ❌ Error parseando: ${e.message}`);
    }
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('2️⃣  TABLA: justificaciones (campo ajuste)\n');
  
  // 2. Analizar justificaciones
  db.all('SELECT id, cierre_id, ajuste FROM justificaciones LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
      db.close();
      return;
    }
    
    let numberCount = 0;
    let stringCount = 0;
    let nullCount = 0;
    
    rows.forEach(row => {
      const tipo = typeof row.ajuste;
      console.log(`Justificación ${row.id}: ajuste = ${row.ajuste} (${tipo})`);
      
      if (row.ajuste === null) nullCount++;
      else if (tipo === 'number') numberCount++;
      else if (tipo === 'string') stringCount++;
    });
    
    console.log('\n📈 Estadísticas de ajuste:');
    console.log(`  - number: ${numberCount}`);
    console.log(`  - string: ${stringCount}`);
    console.log(`  - null: ${nullCount}`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('3️⃣  CAMPOS NUMÉRICOS EN CIERRES\n');
    
    // 3. Analizar campos numéricos principales
    db.get(`
      SELECT 
        typeof(total_billetes) as tipo_billetes,
        typeof(final_balance) as tipo_balance,
        typeof(brinks_total) as tipo_brinks,
        typeof(grand_difference_total) as tipo_diff,
        typeof(balance_sin_justificar) as tipo_balance_just
      FROM cierres LIMIT 1
    `, [], (err, row) => {
      if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
      }
      
      console.log('Tipos de datos en columnas:');
      console.log(`  total_billetes: ${row.tipo_billetes}`);
      console.log(`  final_balance: ${row.tipo_balance}`);
      console.log(`  brinks_total: ${row.tipo_brinks}`);
      console.log(`  grand_difference_total: ${row.tipo_diff}`);
      console.log(`  balance_sin_justificar: ${row.tipo_balance_just}`);
      
      console.log('\n' + '='.repeat(60));
      console.log('\n💡 RECOMENDACIONES:\n');
      console.log('✅ Estandarización necesaria:');
      console.log('   1. medios_pago: facturado/cobrado/differenceVal → NUMBER');
      console.log('   2. justificaciones: ajuste → NUMBER (ya está)');
      console.log('   3. cierres: campos numéricos → REAL (ya está)');
      console.log('\n   ⚠️  PROBLEMA ACTUAL: Algunos strings persisten en JSON');
      console.log('='.repeat(60) + '\n');
      
      db.close();
    });
  });
});
