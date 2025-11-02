// analyze_fondo.js - Analizar uso del campo fondo
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n=== ANÁLISIS DEL CAMPO fondo ===\n');

// 1. Verificar estructura de la tabla cierres
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='cierres'", [], (err, row) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  
  console.log('📋 ESTRUCTURA DE LA TABLA cierres:\n');
  console.log(row.sql);
  console.log('\n' + '='.repeat(60) + '\n');
  
  // 2. Verificar datos en la tabla
  db.all('SELECT id, usuario, fecha, fondo FROM cierres LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('Error:', err.message);
      return;
    }
    
    console.log('📊 MUESTRA DE DATOS (primeros 10 registros):\n');
    rows.forEach(row => {
      console.log(`Cierre ${row.id} (${row.usuario} - ${row.fecha}): fondo = ${row.fondo} (${typeof row.fondo})`);
    });
    
    // 3. Estadísticas de uso
    db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN fondo IS NULL THEN 1 ELSE 0 END) as nulls,
        SUM(CASE WHEN fondo = 0 THEN 1 ELSE 0 END) as ceros,
        SUM(CASE WHEN fondo IS NOT NULL AND fondo != 0 THEN 1 ELSE 0 END) as con_valor,
        MIN(fondo) as min_valor,
        MAX(fondo) as max_valor,
        AVG(fondo) as promedio
      FROM cierres
    `, [], (err, stats) => {
      if (err) {
        console.error('Error:', err.message);
        db.close();
        return;
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('📈 ESTADÍSTICAS DE USO:\n');
      console.log(`Total de cierres: ${stats.total}`);
      console.log(`  - fondo es NULL: ${stats.nulls} (${((stats.nulls/stats.total)*100).toFixed(1)}%)`);
      console.log(`  - fondo = 0: ${stats.ceros} (${((stats.ceros/stats.total)*100).toFixed(1)}%)`);
      console.log(`  - fondo con valor: ${stats.con_valor} (${((stats.con_valor/stats.total)*100).toFixed(1)}%)`);
      if (stats.con_valor > 0) {
        console.log(`  - Valor mínimo: ${stats.min_valor}`);
        console.log(`  - Valor máximo: ${stats.max_valor}`);
        console.log(`  - Promedio: ${stats.promedio?.toFixed(2)}`);
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('\n💡 CONCLUSIÓN:\n');
      
      const sinUso = (stats.nulls + stats.ceros) / stats.total;
      if (sinUso >= 0.95) {
        console.log('✅ fondo es un campo SIN USO REAL (>95% null/0)');
        console.log('   Recomendación: ELIMINAR el campo fondo');
      } else {
        console.log('⚠️  fondo tiene datos activos');
        console.log('   Recomendación: VERIFICAR antes de eliminar');
      }
      
      db.close();
    });
  });
});
