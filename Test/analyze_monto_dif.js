// analyze_monto_dif.js - Analizar uso del campo monto_dif
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n=== ANÁLISIS DEL CAMPO monto_dif ===\n');

// 1. Verificar estructura de la tabla
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='justificaciones'", [], (err, row) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  
  console.log('📋 ESTRUCTURA DE LA TABLA:\n');
  console.log(row.sql);
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 2. Verificar datos en la tabla
  db.all('SELECT id, cierre_id, ajuste, monto_dif FROM justificaciones LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
      return;
    }
    
    console.log('📊 MUESTRA DE DATOS (primeros 10 registros):\n');
    rows.forEach(row => {
      console.log(`ID ${row.id} (cierre ${row.cierre_id}):`);
      console.log(`  ajuste: ${row.ajuste} (${typeof row.ajuste})`);
      console.log(`  monto_dif: ${row.monto_dif} (${typeof row.monto_dif})`);
      console.log(`  ¿Son iguales?: ${row.ajuste === row.monto_dif ? '✅' : '❌'}`);
      console.log('');
    });
    
    // 3. Estadísticas de uso
    db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN monto_dif IS NULL THEN 1 ELSE 0 END) as nulls,
        SUM(CASE WHEN monto_dif IS NOT NULL AND monto_dif != 0 THEN 1 ELSE 0 END) as con_valor,
        SUM(CASE WHEN ajuste = monto_dif THEN 1 ELSE 0 END) as iguales,
        SUM(CASE WHEN ajuste != monto_dif THEN 1 ELSE 0 END) as diferentes
      FROM justificaciones
    `, [], (err, stats) => {
      if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('📈 ESTADÍSTICAS DE USO:\n');
      console.log(`Total de justificaciones: ${stats.total}`);
      console.log(`  - monto_dif es NULL: ${stats.nulls} (${((stats.nulls/stats.total)*100).toFixed(1)}%)`);
      console.log(`  - monto_dif con valor: ${stats.con_valor} (${((stats.con_valor/stats.total)*100).toFixed(1)}%)`);
      console.log(`  - ajuste = monto_dif: ${stats.iguales} (${((stats.iguales/stats.total)*100).toFixed(1)}%)`);
      console.log(`  - ajuste ≠ monto_dif: ${stats.diferentes} (${((stats.diferentes/stats.total)*100).toFixed(1)}%)`);
      
      console.log('\n' + '='.repeat(60));
      console.log('\n💡 CONCLUSIÓN:\n');
      
      if (stats.diferentes === 0 || stats.diferentes / stats.total < 0.01) {
        console.log('✅ monto_dif es un campo REDUNDANTE (duplica ajuste)');
        console.log('   Recomendación: ELIMINAR el campo monto_dif');
      } else {
        console.log('⚠️  monto_dif contiene datos diferentes a ajuste');
        console.log('   Recomendación: MIGRAR datos antes de eliminar');
      }
      
      db.close();
    });
  });
});
