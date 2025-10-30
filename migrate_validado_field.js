const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('Migrando estructura de validación a un solo campo...\n');

db.serialize(() => {
  // SQLite no soporta DROP COLUMN directamente, así que hay que recrear la tabla
  console.log('Paso 1: Creando tabla temporal...');
  
  db.run(`CREATE TABLE cierres_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    tienda TEXT,
    usuario TEXT,
    fondo REAL,
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
  )`, (err) => {
    if (err) {
      console.error('Error creando tabla temporal:', err.message);
      db.close();
      return;
    }
    console.log('✓ Tabla temporal creada');
    
    // Paso 2: Copiar datos, convirtiendo revisar_boutique a validado=2
    console.log('\nPaso 2: Migrando datos...');
    db.run(`INSERT INTO cierres_new 
      SELECT 
        id, fecha, tienda, usuario, fondo, total_billetes, final_balance, 
        brinks_total, grand_difference_total, medios_pago, balance_sin_justificar, 
        responsable, comentarios,
        CASE 
          WHEN revisar_boutique = 1 THEN 2
          ELSE validado
        END as validado,
        CASE
          WHEN revisar_boutique = 1 THEN usuario_revision
          ELSE usuario_validacion
        END as usuario_validacion,
        CASE
          WHEN revisar_boutique = 1 THEN fecha_revision
          ELSE fecha_validacion
        END as fecha_validacion
      FROM cierres`, (err) => {
      if (err) {
        console.error('Error migrando datos:', err.message);
        db.close();
        return;
      }
      console.log('✓ Datos migrados exitosamente');
      
      // Paso 3: Eliminar tabla vieja
      console.log('\nPaso 3: Eliminando tabla antigua...');
      db.run('DROP TABLE cierres', (err) => {
        if (err) {
          console.error('Error eliminando tabla antigua:', err.message);
          db.close();
          return;
        }
        console.log('✓ Tabla antigua eliminada');
        
        // Paso 4: Renombrar tabla nueva
        console.log('\nPaso 4: Renombrando tabla nueva...');
        db.run('ALTER TABLE cierres_new RENAME TO cierres', (err) => {
          if (err) {
            console.error('Error renombrando tabla:', err.message);
            db.close();
            return;
          }
          console.log('✓ Tabla renombrada correctamente');
          
          // Verificar resultado
          console.log('\n=== Verificando migración ===');
          db.all('SELECT validado, COUNT(*) as count FROM cierres GROUP BY validado', (err, rows) => {
            if (err) {
              console.error('Error verificando:', err.message);
            } else {
              console.log('\nDistribución de estados:');
              rows.forEach(r => {
                const estado = r.validado === 0 ? 'Sin validar' : (r.validado === 1 ? 'Validado' : 'Revisar Boutique');
                console.log(`  ${estado} (${r.validado}): ${r.count} cierres`);
              });
            }
            
            // Mostrar estructura final
            db.all('PRAGMA table_info(cierres)', (err, rows) => {
              if (err) {
                console.error('Error obteniendo estructura:', err.message);
              } else {
                console.log('\n=== Estructura final de la tabla ===');
                rows.forEach(r => {
                  console.log(`${r.name.padEnd(25)} | ${r.type.padEnd(10)} | Default: ${r.dflt_value || 'NULL'}`);
                });
              }
              db.close();
              console.log('\n✓ Migración completada exitosamente');
            });
          });
        });
      });
    });
  });
});
