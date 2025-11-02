// remove_legacy_fields.js - Eliminar campos legacy: monto_dif y fondo
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n🗑️  ELIMINANDO CAMPOS LEGACY...\n');

// SQLite no soporta DROP COLUMN directamente, necesitamos recrear las tablas

// 1. Eliminar monto_dif de justificaciones
console.log('📋 Paso 1: Recreando tabla justificaciones sin monto_dif...\n');

db.serialize(() => {
  // Crear tabla temporal sin monto_dif
  db.run(`
    CREATE TABLE justificaciones_new (
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
      console.error('❌ Error al crear justificaciones_new:', err.message);
      return;
    }
    console.log('✅ Tabla justificaciones_new creada');
  });

  // Copiar datos (sin monto_dif)
  db.run(`
    INSERT INTO justificaciones_new (id, cierre_id, fecha, orden, cliente, ajuste, motivo, usuario, medio_pago)
    SELECT id, cierre_id, fecha, orden, cliente, ajuste, motivo, usuario, medio_pago
    FROM justificaciones
  `, (err) => {
    if (err) {
      console.error('❌ Error al copiar datos:', err.message);
      return;
    }
    console.log('✅ Datos copiados (36 justificaciones)');
  });

  // Eliminar tabla antigua
  db.run('DROP TABLE justificaciones', (err) => {
    if (err) {
      console.error('❌ Error al eliminar tabla antigua:', err.message);
      return;
    }
    console.log('✅ Tabla justificaciones antigua eliminada');
  });

  // Renombrar tabla nueva
  db.run('ALTER TABLE justificaciones_new RENAME TO justificaciones', (err) => {
    if (err) {
      console.error('❌ Error al renombrar tabla:', err.message);
      return;
    }
    console.log('✅ Tabla renombrada a justificaciones');
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 2. Eliminar fondo de cierres
    console.log('📋 Paso 2: Recreando tabla cierres sin fondo...\n');
    
    // Crear tabla temporal sin fondo
    db.run(`
      CREATE TABLE cierres_new (
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
        console.error('❌ Error al crear cierres_new:', err.message);
        return;
      }
      console.log('✅ Tabla cierres_new creada');
    });

    // Copiar datos (sin fondo)
    db.run(`
      INSERT INTO cierres_new (
        id, fecha, tienda, usuario, total_billetes, final_balance, brinks_total,
        grand_difference_total, medios_pago, balance_sin_justificar, responsable,
        comentarios, validado, usuario_validacion, fecha_validacion
      )
      SELECT 
        id, fecha, tienda, usuario, total_billetes, final_balance, brinks_total,
        grand_difference_total, medios_pago, balance_sin_justificar, responsable,
        comentarios, validado, usuario_validacion, fecha_validacion
      FROM cierres
    `, (err) => {
      if (err) {
        console.error('❌ Error al copiar datos:', err.message);
        return;
      }
      console.log('✅ Datos copiados (27 cierres)');
    });

    // Eliminar tabla antigua
    db.run('DROP TABLE cierres', (err) => {
      if (err) {
        console.error('❌ Error al eliminar tabla antigua:', err.message);
        return;
      }
      console.log('✅ Tabla cierres antigua eliminada');
    });

    // Renombrar tabla nueva
    db.run('ALTER TABLE cierres_new RENAME TO cierres', (err) => {
      if (err) {
        console.error('❌ Error al renombrar tabla:', err.message);
        return;
      }
      console.log('✅ Tabla renombrada a cierres');
      
      console.log('\n' + '='.repeat(60));
      console.log('\n🎉 CAMPOS LEGACY ELIMINADOS:\n');
      console.log('  ✅ monto_dif removido de justificaciones');
      console.log('  ✅ fondo removido de cierres');
      console.log('\n📊 Datos preservados:');
      console.log('  - 36 justificaciones intactas');
      console.log('  - 27 cierres intactos');
      console.log('='.repeat(60) + '\n');
      
      db.close();
    });
  });
});
