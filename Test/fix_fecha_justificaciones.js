const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('🔧 Corrigiendo formato de fechas en justificaciones...\n');

// Convertir fechas de DD/MM/YYYY a YYYY-MM-DD
db.all('SELECT id, fecha FROM justificaciones', [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`📋 Encontradas ${rows.length} justificaciones para corregir\n`);
  
  let updates = 0;
  let errores = 0;
  
  rows.forEach((row, idx) => {
    const fechaOriginal = row.fecha;
    
    // Convertir DD/MM/YYYY a YYYY-MM-DD
    const partes = fechaOriginal.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const año = partes[2];
      const fechaCorregida = `${año}-${mes}-${dia}`;
      
      db.run(
        'UPDATE justificaciones SET fecha = ? WHERE id = ?',
        [fechaCorregida, row.id],
        function(err) {
          if (err) {
            console.error(`❌ Error en ID ${row.id}:`, err);
            errores++;
          } else {
            console.log(`✅ ID ${row.id}: ${fechaOriginal} → ${fechaCorregida}`);
            updates++;
          }
          
          // Si es el último, mostrar resumen
          if (idx === rows.length - 1) {
            setTimeout(() => {
              console.log(`\n✨ Proceso completado:`);
              console.log(`   - ${updates} fechas corregidas`);
              console.log(`   - ${errores} errores`);
              db.close();
            }, 100);
          }
        }
      );
    }
  });
});
