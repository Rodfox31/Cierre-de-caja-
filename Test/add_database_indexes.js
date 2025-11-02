// add_database_indexes.js - Agregar índices para optimizar queries
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.js.db');

console.log('\n🚀 AGREGANDO ÍNDICES A LA BASE DE DATOS...\n');
console.log('='.repeat(60) + '\n');

const indexes = [
  // Índices para tabla 'cierres'
  {
    name: 'idx_cierres_fecha',
    table: 'cierres',
    columns: 'fecha',
    description: 'Optimiza búsquedas por fecha'
  },
  {
    name: 'idx_cierres_tienda',
    table: 'cierres',
    columns: 'tienda',
    description: 'Optimiza filtros por tienda/sucursal'
  },
  {
    name: 'idx_cierres_usuario',
    table: 'cierres',
    columns: 'usuario',
    description: 'Optimiza filtros por cajero/usuario'
  },
  {
    name: 'idx_cierres_fecha_tienda',
    table: 'cierres',
    columns: 'fecha, tienda',
    description: 'Optimiza búsquedas por fecha Y tienda (compuesto)'
  },
  
  // Índices para tabla 'justificaciones'
  {
    name: 'idx_justificaciones_cierre_id',
    table: 'justificaciones',
    columns: 'cierre_id',
    description: 'Optimiza JOIN con cierres'
  },
  {
    name: 'idx_justificaciones_fecha',
    table: 'justificaciones',
    columns: 'fecha',
    description: 'Optimiza búsquedas por fecha'
  },
  
  // Índices para tabla 'cierres_diarios'
  {
    name: 'idx_cierres_diarios_fecha',
    table: 'cierres_diarios',
    columns: 'fecha',
    description: 'Optimiza búsquedas por fecha'
  },
  {
    name: 'idx_cierres_diarios_tienda',
    table: 'cierres_diarios',
    columns: 'tienda',
    description: 'Optimiza filtros por tienda'
  }
];

let created = 0;
let skipped = 0;
let errors = 0;
let processed = 0;

// Función para verificar si un índice ya existe
function indexExists(indexName, callback) {
  db.get(
    "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
    [indexName],
    (err, row) => {
      if (err) {
        callback(err, false);
      } else {
        callback(null, !!row);
      }
    }
  );
}

// Crear índices uno por uno
function createIndex(index) {
  indexExists(index.name, (err, exists) => {
    if (err) {
      console.error(`❌ Error verificando ${index.name}:`, err.message);
      errors++;
      processed++;
      checkCompletion();
      return;
    }
    
    if (exists) {
      console.log(`⏭️  ${index.name} - Ya existe`);
      skipped++;
      processed++;
      checkCompletion();
      return;
    }
    
    // Crear el índice
    const sql = `CREATE INDEX ${index.name} ON ${index.table}(${index.columns})`;
    
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ Error creando ${index.name}:`, err.message);
        errors++;
      } else {
        console.log(`✅ ${index.name}`);
        console.log(`   Tabla: ${index.table}`);
        console.log(`   Columnas: ${index.columns}`);
        console.log(`   Beneficio: ${index.description}\n`);
        created++;
      }
      
      processed++;
      checkCompletion();
    });
  });
}

function checkCompletion() {
  if (processed === indexes.length) {
    console.log('='.repeat(60));
    console.log('\n📊 RESUMEN:\n');
    console.log(`  Total de índices: ${indexes.length}`);
    console.log(`  ✅ Creados: ${created}`);
    console.log(`  ⏭️  Ya existían: ${skipped}`);
    console.log(`  ❌ Errores: ${errors}`);
    
    if (created > 0) {
      console.log('\n🎉 ÍNDICES AGREGADOS EXITOSAMENTE');
      console.log('   - Queries más rápidas en filtros por fecha, tienda y usuario');
      console.log('   - Mejor performance en JOIN con justificaciones');
      console.log('   - Sistema preparado para escalar');
    }
    
    console.log('\n='.repeat(60) + '\n');
    
    // Mostrar todos los índices en la BD
    db.all(
      "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY tbl_name, name",
      [],
      (err, rows) => {
        if (err) {
          console.error('Error listando índices:', err.message);
        } else {
          console.log('📋 ÍNDICES EN LA BASE DE DATOS:\n');
          let currentTable = '';
          rows.forEach(row => {
            if (row.tbl_name !== currentTable) {
              currentTable = row.tbl_name;
              console.log(`\n  Tabla: ${currentTable}`);
            }
            console.log(`    - ${row.name}`);
          });
          console.log('\n');
        }
        db.close();
      }
    );
  }
}

// Iniciar creación de índices
console.log('📋 Creando índices...\n');
indexes.forEach(createIndex);
