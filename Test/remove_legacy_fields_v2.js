// remove_legacy_fields_v2.js - Eliminar campos legacy correctamente
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n🗑️  ELIMINANDO CAMPOS LEGACY (v2 - con verificación)...\n');

db.serialize(() => {
  
  // ==== PARTE 1: justificaciones - eliminar monto_dif ====
  console.log('📋 Paso 1: Eliminar monto_dif de justificaciones\n');
  
  // 1.1 Verificar datos actuales
  db.get('SELECT COUNT(*) as total FROM justificaciones', [], (err, row) => {
    if (err) {
      console.error('❌ Error:', err.message);
      return;
    }
    const totalJust = row.total;
    console.log(`✅ Justificaciones actuales: ${totalJust}`);
    
    // 1.2 Crear nueva tabla
    db.run(`
      CREATE TABLE IF NOT EXISTS justificaciones_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cierre_id INTEGER,
        fecha TEXT,
        orden TEXT,
        cliente TEXT,
        ajuste REAL,
        motivo TEXT,
        usuario TEXT,
        medio_pago TEXT,
        FOREIGN KEY (cierre_id) REFERENCES cierres(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creando temp:', err.message);
        return;
      }
      
      // 1.3 Copiar datos
      db.run(`
        INSERT INTO justificaciones_temp 
        SELECT id, cierre_id, fecha, orden, cliente, ajuste, motivo, usuario, medio_pago
        FROM justificaciones
      `, (err) => {
        if (err) {
          console.error('❌ Error copiando:', err.message);
          return;
        }
        
        // 1.4 Verificar copia
        db.get('SELECT COUNT(*) as total FROM justificaciones_temp', [], (err, row2) => {
          if (err || row2.total !== totalJust) {
            console.error(`❌ Copia falló: esperado ${totalJust}, obtenido ${row2?.total || 0}`);
            return;
          }
          
          console.log(`✅ Datos copiados correctamente: ${row2.total} registros`);
          
          // 1.5 Reemplazar tabla
          db.run('DROP TABLE justificaciones', (err) => {
            if (err) {
              console.error('❌ Error eliminando original:', err.message);
              return;
            }
            
            db.run('ALTER TABLE justificaciones_temp RENAME TO justificaciones', (err) => {
              if (err) {
                console.error('❌ Error renombrando:', err.message);
                return;
              }
              
              console.log('✅ monto_dif eliminado de justificaciones\n');
              console.log('=' .repeat(60) + '\n');
              
              // ==== PARTE 2: cierres - eliminar fondo ====
              console.log('📋 Paso 2: Eliminar fondo de cierres\n');
              
              // 2.1 Verificar datos actuales
              db.get('SELECT COUNT(*) as total FROM cierres', [], (err, row) => {
                if (err) {
                  console.error('❌ Error:', err.message);
                  db.close();
                  return;
                }
                const totalCierres = row.total;
                console.log(`✅ Cierres actuales: ${totalCierres}`);
                
                // 2.2 Crear nueva tabla
                db.run(`
                  CREATE TABLE IF NOT EXISTS cierres_temp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fecha TEXT,
                    tienda TEXT,
                    usuario TEXT,
                    total_billetes REAL,
                    final_balance REAL,
                    brinks_total REAL,
                    grand_difference_total REAL,
                    medios_pago TEXT,
                    balance_sin_justificar REAL,
                    responsable TEXT,
                    comentarios TEXT,
                    validado INTEGER DEFAULT 0,
                    usuario_validacion TEXT,
                    fecha_validacion TEXT
                  )
                `, (err) => {
                  if (err) {
                    console.error('❌ Error creando temp:', err.message);
                    db.close();
                    return;
                  }
                  
                  // 2.3 Copiar datos
                  db.run(`
                    INSERT INTO cierres_temp 
                    SELECT 
                      id, fecha, tienda, usuario, total_billetes, final_balance, brinks_total,
                      grand_difference_total, medios_pago, balance_sin_justificar, responsable,
                      comentarios, validado, usuario_validacion, fecha_validacion
                    FROM cierres
                  `, (err) => {
                    if (err) {
                      console.error('❌ Error copiando:', err.message);
                      db.close();
                      return;
                    }
                    
                    // 2.4 Verificar copia
                    db.get('SELECT COUNT(*) as total FROM cierres_temp', [], (err, row2) => {
                      if (err || row2.total !== totalCierres) {
                        console.error(`❌ Copia falló: esperado ${totalCierres}, obtenido ${row2?.total || 0}`);
                        db.close();
                        return;
                      }
                      
                      console.log(`✅ Datos copiados correctamente: ${row2.total} registros`);
                      
                      // 2.5 Reemplazar tabla
                      db.run('DROP TABLE cierres', (err) => {
                        if (err) {
                          console.error('❌ Error eliminando original:', err.message);
                          db.close();
                          return;
                        }
                        
                        db.run('ALTER TABLE cierres_temp RENAME TO cierres', (err) => {
                          if (err) {
                            console.error('❌ Error renombrando:', err.message);
                            db.close();
                            return;
                          }
                          
                          console.log('✅ fondo eliminado de cierres\n');
                          console.log('=' .repeat(60));
                          console.log('\n🎉 PROCESO COMPLETADO:\n');
                          console.log(`  ✅ ${totalJust} justificaciones (sin monto_dif)`);
                          console.log(`  ✅ ${totalCierres} cierres (sin fondo)`);
                          console.log('\n' + '='.repeat(60) + '\n');
                          
                          db.close();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
