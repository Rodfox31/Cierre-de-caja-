const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('🔍 Verificando justificaciones en la base de datos...\n');

// 1. Ver cuántas justificaciones hay en total
db.get('SELECT COUNT(*) as total FROM justificaciones', [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`📊 Total de justificaciones en DB: ${row.total}\n`);
  
  if (row.total === 0) {
    console.log('⚠️  No hay justificaciones en la base de datos.');
    console.log('💡 Las justificaciones se crean cuando hay diferencias en los cierres.\n');
    db.close();
    return;
  }
  
  // 2. Ver todas las justificaciones
  db.all('SELECT * FROM justificaciones ORDER BY fecha DESC LIMIT 10', [], (err, rows) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }
    
    console.log('📋 Últimas 10 justificaciones:\n');
    rows.forEach((j, idx) => {
      console.log(`${idx + 1}. ID: ${j.id}`);
      console.log(`   Cierre ID: ${j.cierre_id}`);
      console.log(`   Fecha: ${j.fecha}`);
      console.log(`   Usuario: ${j.usuario}`);
      console.log(`   Motivo: ${j.motivo}`);
      console.log(`   Ajuste: $${j.ajuste}`);
      console.log(`   Medio: ${j.medio_pago || 'N/A'}`);
      console.log('');
    });
    
    // 3. Ver qué cierres tienen justificaciones
    db.all(`
      SELECT c.id, c.fecha, c.usuario, c.tienda, COUNT(j.id) as num_justificaciones
      FROM cierres c
      LEFT JOIN justificaciones j ON c.id = j.cierre_id
      WHERE c.fecha = '2025-10-07'
      GROUP BY c.id
      ORDER BY c.usuario
    `, [], (err, cierresConJust) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }
      
      console.log('📦 Cierres del 2025-10-07 y sus justificaciones:\n');
      cierresConJust.forEach(c => {
        console.log(`- ${c.usuario} (${c.tienda}): ${c.num_justificaciones} justificaciones`);
      });
      
      db.close();
    });
  });
});
