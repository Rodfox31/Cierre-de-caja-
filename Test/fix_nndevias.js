const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('🔧 Corrigiendo datos corruptos de NNdeviaslu...\n');

db.get(`
  SELECT id, usuario, fecha, medios_pago 
  FROM cierres 
  WHERE usuario = 'NNdeviaslu'
`, [], (err, row) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('📋 Registro ANTES:');
  console.log('ID:', row.id);
  console.log('Usuario:', row.usuario);
  console.log('Fecha:', row.fecha);
  
  const medios = JSON.parse(row.medios_pago);
  console.log('\nMedios de pago:');
  medios.forEach(m => {
    console.log(`  ${m.medio}: Facturado=${m.facturado}, Cobrado=${m.cobrado}`);
  });
  
  // Corregir el valor - usar el facturado como referencia
  const mediosCorregidos = medios.map(m => {
    if (m.medio === 'Mp - Qr' && m.cobrado > 1000000) {
      console.log(`\n⚠️ Corrigiendo ${m.medio}: ${m.cobrado} → ${m.facturado}`);
      return { ...m, cobrado: m.facturado };
    }
    return m;
  });
  
  db.run(`
    UPDATE cierres 
    SET medios_pago = ? 
    WHERE id = ?
  `, [JSON.stringify(mediosCorregidos), row.id], (err) => {
    if (err) {
      console.error('Error al actualizar:', err);
      db.close();
      return;
    }
    
    console.log('\n✅ Registro corregido');
    
    db.get(`SELECT medios_pago FROM cierres WHERE id = ?`, [row.id], (err, updated) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }
      
      console.log('\n📋 Registro DESPUÉS:');
      const mediosNuevos = JSON.parse(updated.medios_pago);
      mediosNuevos.forEach(m => {
        console.log(`  ${m.medio}: Facturado=${m.facturado}, Cobrado=${m.cobrado}`);
      });
      
      db.close();
      console.log('\n🎉 ¡Datos corregidos exitosamente!');
    });
  });
});
