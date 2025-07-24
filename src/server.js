const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const moment = require('moment'); // Importar moment

app.use(express.json());

// Middleware global para forzar headers CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Configura la conexión a la DB
// Usar la base de datos de la raíz del proyecto para asegurar que se lee la correcta
const dbPath = path.resolve(__dirname, '../db.js.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar a la DB:", err.message);
  } else {
    console.log("Conectado a la DB SQLite.");
  }
});

// ── MODIFICADO: Crear la tabla 'cierres' con las nuevas columnas ──
const createTableQuery = [
  'CREATE TABLE IF NOT EXISTS cierres (',
  '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
  '  fecha TEXT,',
  '  tienda TEXT,',
  '  usuario TEXT,',
  '  total_billetes REAL,',
  '  final_balance REAL,',
  '  brinks_total REAL,',
  '  grand_difference_total REAL,',
  '  medios_pago TEXT,',
  '  balance_sin_justificar REAL,',
  '  responsable TEXT,',
  '  comentarios TEXT,',
  '  fondo REAL,',
  '  validado INTEGER DEFAULT 0,',
  '  usuario_validacion TEXT,',
  '  fecha_validacion TEXT,',
  '  revisar INTEGER DEFAULT 0', // <-- Asegura que la columna existe
  ')'
].join('\n');

db.run(createTableQuery, (err) => {
  if (err) {
    console.error('Error creando tabla cierres:', err.message);
  } else {
    console.log("Tabla 'cierres' lista.");
    
    // Verificar y agregar las columnas de validación si no existen
    db.all('PRAGMA table_info(cierres)', [], (err, columns) => {
      if (err) {
        console.error("Error verificando columnas:", err.message);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      
      // Agregar columna 'validado' si no existe
      if (!columnNames.includes('validado')) {
        db.run('ALTER TABLE cierres ADD COLUMN validado INTEGER DEFAULT 0', (err) => {
          if (err) {
            console.error("Error agregando columna 'validado':", err.message);
          } else {
            console.log("Columna 'validado' agregada exitosamente.");
          }
        });
      }
      
      // Agregar columna 'usuario_validacion' si no existe
      if (!columnNames.includes('usuario_validacion')) {
        db.run('ALTER TABLE cierres ADD COLUMN usuario_validacion TEXT', (err) => {
          if (err) {
            console.error("Error agregando columna 'usuario_validacion':", err.message);
          } else {
            console.log("Columna 'usuario_validacion' agregada exitosamente.");
          }
        });
      }
      
      // Agregar columna 'fecha_validacion' si no existe
      if (!columnNames.includes('fecha_validacion')) {
        db.run('ALTER TABLE cierres ADD COLUMN fecha_validacion TEXT', (err) => {
          if (err) {
            console.error("Error agregando columna 'fecha_validacion':", err.message);
          } else {
            console.log("Columna 'fecha_validacion' agregada exitosamente.");
          }
        });
      }
    });
  }
});

// Crear la tabla 'justificaciones' si no existe
const createJustificacionesTable = `
  CREATE TABLE IF NOT EXISTS justificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cierre_id INTEGER,
    fecha TEXT,
    usuario TEXT,
    orden TEXT,
    cliente TEXT,
    medio_pago TEXT,
    motivo TEXT,
    ajuste REAL,
    FOREIGN KEY (cierre_id) REFERENCES cierres(id)
  )
`;
db.run(createJustificacionesTable, (err) => {
  if(err) {
    console.error("Error al crear la tabla justificaciones:", err.message);
  } else {
    console.log("Tabla 'justificaciones' lista.");
    
    // Verificar y modificar las columnas en justificaciones si es necesario
    db.all('PRAGMA table_info(justificaciones)', [], (err, columns) => {
      if (err) {
        console.error("Error verificando columnas de justificaciones:", err.message);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      
      // Agregar columna 'usuario' si no existe
      if (!columnNames.includes('usuario')) {
        db.run('ALTER TABLE justificaciones ADD COLUMN usuario TEXT', (err) => {
          if (err) {
            console.error("Error agregando columna 'usuario' a justificaciones:", err.message);
          } else {
            console.log("Columna 'usuario' agregada exitosamente a justificaciones.");
          }
        });
      }
      
      // Agregar columna 'medio_pago' si no existe
      if (!columnNames.includes('medio_pago')) {
        db.run('ALTER TABLE justificaciones ADD COLUMN medio_pago TEXT', (err) => {
          if (err) {
            console.error("Error agregando columna 'medio_pago' a justificaciones:", err.message);
          } else {
            console.log("Columna 'medio_pago' agregada exitosamente a justificaciones.");
          }
        });
      }
    });
  }
});

// Ruta raíz para mostrar datos aleatorios
app.get('/', (req, res) => {
  // Obtener un cierre aleatorio de la base de datos
  db.get('SELECT * FROM cierres ORDER BY RANDOM() LIMIT 1', [], (err, randomCierre) => {
    if (err) {
      console.error('Error obteniendo cierre aleatorio:', err.message);
      return res.status(500).send('<h2>Error obteniendo cierre aleatorio</h2>');
    }
    // Leer el archivo localStorage.json
    fs.readFile(localStoragePath, 'utf8', (err2, data) => {
      let localData = {};
      if (err2) {
        localData = defaultConfig;
      } else {
        try {
          localData = JSON.parse(data);
        } catch (e) {
          localData = defaultConfig;
        }
      }
      const localKeys = Object.keys(localData);
      const randomKey = localKeys[Math.floor(Math.random() * localKeys.length)];
      const randomLocalValue = localData[randomKey];
      res.send(`
        <h2>Ejemplo de datos aleatorios</h2>
        <h3>De la base de datos:</h3>
        <pre>${JSON.stringify(randomCierre, null, 2)}</pre>
        <h3>Del localStorage.json:</h3>
        <b>Clave:</b> ${randomKey}<br/>
        <b>Valor:</b> <pre>${JSON.stringify(randomLocalValue, null, 2)}</pre>
      `);
    });
  });
});

// -------------------------------
// Endpoints SQL
// -------------------------------

// ── GET /api/cierres-completo ──
app.get('/api/cierres-completo', (req, res) => {
  const { fechaDesde, fechaHasta, tienda, usuario } = req.query;
  console.log('API cierres-completo - recibido:', { fechaDesde, fechaHasta, tienda, usuario });
  // Construir la consulta con filtros opcionales
  let cierresQuery = `
    SELECT 
      id,
      fecha,
      tienda,
      usuario,
      total_billetes,
      final_balance,
      brinks_total,
      grand_difference_total,
      medios_pago,
      balance_sin_justificar,
      responsable,
      comentarios,
      validado,
      usuario_validacion,
      fecha_validacion
    FROM cierres WHERE 1=1
  `;
  
  const queryParams = [];
  
  // Agregar filtros de fecha si se proporcionan (convertir DD/MM/YYYY a YYYY-MM-DD)
  if (fechaDesde) {
    const fechaDesdeFormatted = moment(fechaDesde, 'DD/MM/YYYY').format('YYYY-MM-DD');
    console.log('API cierres-completo - fechaDesde convertido:', fechaDesdeFormatted);
    cierresQuery += ` AND fecha >= ?`;
    queryParams.push(fechaDesdeFormatted);
  }
  if (fechaHasta) {
    const fechaHastaFormatted = moment(fechaHasta, 'DD/MM/YYYY').format('YYYY-MM-DD');
    console.log('API cierres-completo - fechaHasta convertido:', fechaHastaFormatted);
    cierresQuery += ` AND fecha <= ?`;
    queryParams.push(fechaHastaFormatted);
  }
  
  if (tienda) {
    cierresQuery += ` AND tienda = ?`;
    queryParams.push(tienda);
  }
  
  if (usuario) {
    cierresQuery += ` AND usuario = ?`;
    queryParams.push(usuario);
  }

  const justificacionesQuery = `
    SELECT 
      id,
      cierre_id,
      fecha,
      usuario,
      orden,
      cliente,
      medio_pago,
      monto_dif,
      ajuste,
      motivo
    FROM justificaciones
  `;

  console.log('API cierres-completo - SQL:', cierresQuery);
  console.log('API cierres-completo - params:', queryParams);
  db.all(cierresQuery, queryParams, (err, cierres) => {
    if (err) {
      console.error("Error al obtener cierres:", err.message);
      return res.status(500).json({ error: err.message });
    }

    db.all(justificacionesQuery, [], (err2, justificaciones) => {
      if (err2) {
        console.error("Error al obtener justificaciones:", err2.message);
        return res.status(500).json({ error: err2.message });
      }

      const cierresCompletos = cierres.map(cierre => {
        let mediosPagoParsed = {};
        try {
          mediosPagoParsed = JSON.parse(cierre.medios_pago || '{}');
        } catch (e) {
          console.warn(`Error parseando medios_pago en cierre ID ${cierre.id}:`, e.message);
        }

        // Convertir la fecha de vuelta a DD/MM/YYYY para el frontend
        const fechaFormateada = moment(cierre.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY');

        return {
          ...cierre,
          fecha: fechaFormateada,
          medios_pago: mediosPagoParsed,
          justificaciones: justificaciones.filter(j => j.cierre_id === cierre.id)
        };
      });

      res.json(cierresCompletos);
    });
  });
});

// Endpoint para verificar la existencia de un cierre
app.get('/api/cierres/existe', (req, res) => {
  const { fecha, tienda, usuario } = req.query;
  if (!fecha || !tienda || !usuario) {
    return res.status(400).json({ error: 'Faltan parámetros necesarios' });
  }
  
  // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para comparar con la DB
  const fechaFormatted = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');
  
  const query = `SELECT COUNT(*) as count FROM cierres WHERE fecha = ? AND tienda = ? AND usuario = ?`;
  db.get(query, [fechaFormatted, tienda, usuario], (err, row) => {
    if (err) {
      console.error("Error al consultar existencia:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ existe: row.count > 0 });
  });
});

// ── GET /api/cierres-completo/:id ──
app.get('/api/cierres-completo/:id', (req, res) => {
  const cierreId = req.params.id;
  
  const cierreQuery = `
    SELECT 
      id,
      fecha,
      tienda,
      usuario,
      fondo,
      total_billetes,
      final_balance,
      brinks_total,
      grand_difference_total,
      medios_pago,
      balance_sin_justificar,
      responsable,
      comentarios,
      validado,
      usuario_validacion,
      fecha_validacion
    FROM cierres 
    WHERE id = ?
  `;

  db.get(cierreQuery, [cierreId], (err, cierre) => {
    if (err) {
      console.error('Error obteniendo cierre:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    
    if (!cierre) {
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }

    // Obtener justificaciones asociadas
    const justificacionesQuery = `
      SELECT id, cierre_id, fecha, usuario, orden, cliente, medio_pago, motivo, ajuste
      FROM justificaciones 
      WHERE cierre_id = ?
      ORDER BY fecha DESC
    `;

    db.all(justificacionesQuery, [cierreId], (justErr, justificaciones) => {
      if (justErr) {
        console.error('Error obteniendo justificaciones:', justErr.message);
        return res.status(500).json({ error: 'Error obteniendo justificaciones' });
      }

      // Procesar medios_pago si es un string JSON
      let mediosPago = [];
      if (cierre.medios_pago) {
        try {
          const mp = typeof cierre.medios_pago === 'string' 
            ? JSON.parse(cierre.medios_pago) 
            : cierre.medios_pago;
          
          if (Array.isArray(mp)) {
            mediosPago = mp;
          } else if (typeof mp === 'object') {
            mediosPago = Object.keys(mp).map(key => ({
              medio: key,
              facturado: mp[key].facturado || 0,
              cobrado: mp[key].cobrado || 0,
              differenceVal: mp[key].differenceVal || 0
            }));
          }
        } catch (parseErr) {
          console.error('Error parseando medios de pago:', parseErr.message);
          mediosPago = [];
        }
      }

      // Retornar el cierre completo
      res.json({
        ...cierre,
        medios_pago: mediosPago,
        justificaciones: justificaciones || []
      });
    });
  });
});

// ── POST /api/cierres ──
app.post('/api/cierres', (req, res) => {
  const {
    fecha,
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    grand_difference_total,
    medios_pago,         // Llega como string (JSON.stringify) desde el frontend
    justificaciones,     // Llega como array
    balance_sin_justificar,  // NUEVO CAMPO
    responsable,             // NUEVO CAMPO
    comentarios              // NUEVO CAMPO
  } = req.body;

  // Formatear la fecha a YYYY-MM-DD antes de guardarla
  const fechaFormateada = moment(fecha).format('YYYY-MM-DD');

  // Consulta para insertar en la tabla 'cierres' con las nuevas columnas
  const insertCierreSql = `
    INSERT INTO cierres (
      fecha,
      tienda,
      usuario,
      total_billetes,
      final_balance,
      brinks_total,
      grand_difference_total,
      medios_pago,
      balance_sin_justificar,
      responsable,
      comentarios
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insertCierreSql,
    [
      fechaFormateada, // Usar la fecha formateada
      tienda,
      usuario,
      total_billetes,
      final_balance,
      brinks_total,
      grand_difference_total,
      medios_pago,
      balance_sin_justificar,
      responsable,
      comentarios
    ],
    function (err) {
      if (err) {
        console.error("Error insertando en cierres:", err.message);
        return res.status(500).json({ error: "Error insertando en cierres" });
      }

      // Obtenemos el ID del cierre recién insertado
      const cierreId = this.lastID;

      // Si existen justificaciones, las insertamos en su tabla
      if (justificaciones && justificaciones.length > 0) {
        const insertJustSql = `
          INSERT INTO justificaciones (
            cierre_id,
            fecha,
            orden,
            cliente,
            monto_dif,
            ajuste,
            motivo
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        // Preparamos el statement para insertar en 'justificaciones'
        const stmt = db.prepare(insertJustSql);

        // Insertamos cada justificación
        justificaciones.forEach((j) => {
          stmt.run(
            [
              cierreId,
              j.fecha || fecha,   // Si la justificación no trae fecha, se usa la del cierre
              j.orden,
              j.cliente,
              j.monto_dif,
              j.ajuste,
              j.motivo
            ],
            (err2) => {
              if (err2) {
                console.error("Error insertando justificación:", err2.message);
                // Se podría implementar un rollback si es necesario.
              }
            }
          );
        });

        // Cerramos el statement
        stmt.finalize((finalErr) => {
          if (finalErr) {
            console.error("Error finalizando inserción de justificaciones:", finalErr.message);
            return res.status(500).json({ error: "Error finalizando justificaciones" });
          }
          res.json({
            message: "Cierre y justificaciones guardados correctamente",
            cierreId
          });
        });
      } else {
        res.json({ message: "Cierre guardado correctamente", cierreId });
      }
    }
  );
});

// ── POST /api/cierres-completo ──
app.post('/api/cierres-completo', (req, res) => {
  const {
    fecha,
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    medios_pago,
    justificaciones,
    grand_difference_total,
    balance_sin_justificar,
    responsable,
    comentarios
  } = req.body;

  // Formatear la fecha recibida en DD/MM/YYYY a YYYY-MM-DD antes de guardarla
  const fechaFormateada = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');

  const insertCierre = `
    INSERT INTO cierres (
      fecha, tienda, usuario, total_billetes, final_balance, brinks_total, medios_pago, grand_difference_total, balance_sin_justificar, responsable, comentarios
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insertCierre, [
    fechaFormateada, // Usar la fecha formateada
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    medios_pago,
    grand_difference_total,
    balance_sin_justificar,
    responsable,
    comentarios
  ], function(err) {
    if (err) {
      console.error('Error insertando cierre:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const cierreId = this.lastID;
    // Insertar justificaciones si existen
    if (Array.isArray(justificaciones) && justificaciones.length > 0) {
      const insertJust = `INSERT INTO justificaciones (cierre_id, fecha, usuario, orden, cliente, medio_pago, motivo, ajuste) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const stmt = db.prepare(insertJust);
      justificaciones.forEach(j => {
        stmt.run([
          cierreId,
          j.fecha,
          j.usuario || '',
          j.orden || '',
          j.cliente || '',
          j.medio_pago || '',
          j.motivo || '',
          j.ajuste || 0
        ]);
      });
      stmt.finalize();
    }
    res.json({ ok: true, id: cierreId });
  });
});

// ── DELETE /api/cierres/:id ──
app.delete('/api/cierres/:id', (req, res) => {
  const cierreId = req.params.id;
  if (!cierreId) {
    return res.status(400).json({ error: 'Falta el parámetro id' });
  }
  // Eliminar justificaciones asociadas primero
  db.run('DELETE FROM justificaciones WHERE cierre_id = ?', [cierreId], (err) => {
    if (err) {
      console.error('Error eliminando justificaciones:', err.message);
      return res.status(500).json({ error: 'Error eliminando justificaciones' });
    }
    // Luego eliminar el cierre
    db.run('DELETE FROM cierres WHERE id = ?', [cierreId], function (err2) {
      if (err2) {
        console.error('Error eliminando cierre:', err2.message);
        return res.status(500).json({ error: 'Error eliminando cierre' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cierre no encontrado' });
      }
      res.json({ message: 'Cierre y justificaciones eliminados correctamente' });
    });
  });
});

// ── PUT /api/cierres/:id ──
app.put('/api/cierres/:id', (req, res) => {
  const cierreId = req.params.id;
  const {
    fecha,
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    grand_difference_total,
    medios_pago,
    balance_sin_justificar,
    responsable,
    comentarios
  } = req.body;

  // Formatear la fecha a YYYY-MM-DD antes de guardarla
  const fechaFormateada = moment(fecha).format('YYYY-MM-DD');

  const updateSql = `
    UPDATE cierres SET
      fecha = ?,
      tienda = ?,
      usuario = ?,
      total_billetes = ?,
      final_balance = ?,
      brinks_total = ?,
      grand_difference_total = ?,
      medios_pago = ?,
      balance_sin_justificar = ?,
      responsable = ?,
      comentarios = ?
    WHERE id = ?
  `;

  db.run(updateSql, [
    fechaFormateada, // Usar la fecha formateada
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    grand_difference_total,
    medios_pago,
    balance_sin_justificar,
    responsable,
    comentarios,
    cierreId
  ], function (err) {
    if (err) {
      console.error('Error actualizando cierre:', err.message);
      return res.status(500).json({ error: 'Error actualizando cierre' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }
    res.json({ message: 'Cierre actualizado correctamente' });
  });
});

// ── DELETE /api/cierres-completo/:id ──
app.delete('/api/cierres-completo/:id', (req, res) => {
  const cierreId = req.params.id;
  if (!cierreId) {
    return res.status(400).json({ error: 'Falta el parámetro id' });
  }
  // Eliminar justificaciones asociadas primero
  db.run('DELETE FROM justificaciones WHERE cierre_id = ?', [cierreId], (err) => {
    if (err) {
      console.error('Error eliminando justificaciones:', err.message);
      return res.status(500).json({ error: 'Error eliminando justificaciones' });
    }
    // Luego eliminar el cierre
    db.run('DELETE FROM cierres WHERE id = ?', [cierreId], function (err2) {
      if (err2) {
        console.error('Error eliminando cierre:', err2.message);
        return res.status(500).json({ error: 'Error eliminando cierre' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Cierre no encontrado' });
      }
      res.json({ message: 'Cierre y justificaciones eliminados correctamente' });
    });
  });
});

// ── PUT /api/cierres-completo/:id ──
app.put('/api/cierres-completo/:id', (req, res) => {
  const cierreId = req.params.id;
  const {
    fecha,
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    medios_pago,
    justificaciones,
    grand_difference_total,
    balance_sin_justificar,
    responsable,
    comentarios
  } = req.body;
  console.log(`PUT /api/cierres-completo/${cierreId} - Iniciando actualización...`);
  console.log('📋 Datos recibidos:', {
    cierreId,
    fecha,
    tienda,
    usuario,
    justificaciones: justificaciones?.length || 0,
    justificacionesPresentes: justificaciones !== undefined,
    comentarios: comentarios?.substring(0, 50) + (comentarios?.length > 50 ? '...' : '')
  });
  
  // Log detallado de justificaciones si están presentes
  if (justificaciones !== undefined) {
    console.log('📝 Detalles de justificaciones recibidas:');
    if (Array.isArray(justificaciones)) {
      justificaciones.forEach((j, index) => {
        console.log(`   ${index + 1}. ID:${j.id || 'NUEVO'} - Motivo:${j.motivo || 'Sin motivo'} - Ajuste:${j.ajuste || 0}`);
      });
    } else {
      console.log('   ⚠️ justificaciones no es un array:', typeof justificaciones);
    }
  } else {
    console.log('📝 No se enviaron justificaciones en el request (se mantendrán las existentes)');
  }

  // Validar parámetros requeridos
  if (!cierreId) {
    console.error('ID de cierre faltante');
    return res.status(400).json({ error: 'ID de cierre requerido' });
  }

  // Validar que la fecha sea válida
  if (!fecha || !moment(fecha, 'DD/MM/YYYY').isValid()) {
    console.error('Fecha inválida recibida:', fecha);
    return res.status(400).json({ error: 'Fecha inválida: ' + fecha });
  }

  // Formatear la fecha a YYYY-MM-DD antes de guardarla
  const fechaFormateada = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');
  console.log(`Fecha formateada: ${fecha} -> ${fechaFormateada}`);

  const updateCierre = `
    UPDATE cierres SET
      fecha = ?,
      tienda = ?,
      usuario = ?,
      total_billetes = ?,
      final_balance = ?,
      brinks_total = ?,
      medios_pago = ?,
      grand_difference_total = ?,
      balance_sin_justificar = ?,
      responsable = ?,
      comentarios = ?
    WHERE id = ?
  `;

  db.run(updateCierre, [
    fechaFormateada,
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    medios_pago,
    grand_difference_total,
    balance_sin_justificar,
    responsable,
    comentarios,
    cierreId
  ], function (err) {
    if (err) {
      console.error('Error actualizando cierre:', err.message);
      return res.status(500).json({ error: 'Error actualizando cierre' });
    }
    if (this.changes === 0) {
      console.error(`Cierre ${cierreId} no encontrado`);
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }
      console.log(`Cierre ${cierreId} actualizado correctamente`);
      // Solo actualizar justificaciones si se envían explícitamente en el request
    if (justificaciones !== undefined) {
      console.log(`Actualizando justificaciones para cierre ${cierreId}...`);
      
      // Validación de seguridad: verificar si tenemos justificaciones existentes
      db.get('SELECT COUNT(*) as count FROM justificaciones WHERE cierre_id = ?', [cierreId], (errCount, countResult) => {
        if (errCount) {
          console.error('Error contando justificaciones existentes:', errCount.message);
          return res.status(500).json({ error: 'Error verificando justificaciones existentes' });
        }
        
        const justificacionesExistentes = countResult.count;
        const justificacionesNuevas = Array.isArray(justificaciones) ? justificaciones.length : 0;
        
        console.log(`📊 Justificaciones existentes: ${justificacionesExistentes}, nuevas: ${justificacionesNuevas}`);
        
        // Advertencia si se están eliminando justificaciones sin reemplazo
        if (justificacionesExistentes > 0 && justificacionesNuevas === 0) {
          console.log('⚠️ ATENCIÓN: Se eliminarán todas las justificaciones sin reemplazo');
        }
        
        // Proceder con la actualización
        db.run('DELETE FROM justificaciones WHERE cierre_id = ?', [cierreId], (err2) => {
          if (err2) {
            console.error('Error eliminando justificaciones:', err2.message);
            return res.status(500).json({ error: 'Error actualizando justificaciones' });
          }
          
          console.log(`✅ ${justificacionesExistentes} justificaciones eliminadas para cierre ${cierreId}`);
          
          if (Array.isArray(justificaciones) && justificaciones.length > 0) {
            console.log(`📝 Insertando ${justificaciones.length} nuevas justificaciones`);
            const insertJust = `INSERT INTO justificaciones (cierre_id, fecha, usuario, orden, cliente, medio_pago, motivo, ajuste) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const stmt = db.prepare(insertJust);
            
            let insertedCount = 0;
            justificaciones.forEach((j, index) => {
              console.log(`   ${index + 1}. Insertando: Usuario:${j.usuario || 'N/A'} - Orden:${j.orden || 'N/A'} - Cliente:${j.cliente || 'N/A'} - Medio:${j.medio_pago || 'N/A'} - Motivo:${j.motivo || 'N/A'} - Ajuste:${j.ajuste || 0}`);
              
              stmt.run([
                cierreId,
                j.fecha,
                j.usuario || '',
                j.orden || '',
                j.cliente || '',
                j.medio_pago || '',
                j.motivo || '',
                j.ajuste || 0
              ], function(insertErr) {
                if (insertErr) {
                  console.error(`Error insertando justificación ${index + 1}:`, insertErr.message);
                } else {
                  insertedCount++;
                  console.log(`   ✅ Justificación ${index + 1} insertada con ID ${this.lastID}`);
                }
              });
            });
            
            stmt.finalize((finalErr) => {
              if (finalErr) {
                console.error('Error finalizando inserción de justificaciones:', finalErr.message);
                return res.status(500).json({ error: 'Error insertando justificaciones' });
              }
              console.log(`🎉 Cierre ${cierreId} y ${insertedCount} justificaciones actualizados correctamente`);
              res.json({ 
                message: 'Cierre y justificaciones actualizados correctamente',
                justificacionesInsertadas: insertedCount,
                justificacionesEliminadas: justificacionesExistentes
              });
            });
          } else {
            console.log(`📭 Array de justificaciones vacío para cierre ${cierreId} (${justificacionesExistentes} eliminadas)`);
            res.json({ 
              message: 'Cierre actualizado correctamente (justificaciones eliminadas)',
              justificacionesEliminadas: justificacionesExistentes
            });
          }
        });
      });
    } else {
      console.log(`🔒 No se enviaron justificaciones en el request, manteniendo las existentes para cierre ${cierreId}`);
      res.json({ message: 'Cierre actualizado correctamente (justificaciones sin cambios)' });
    }
  });
});

// ── PUT /api/cierres-completo/:id/revisar ──
app.put('/api/cierres-completo/:id/revisar', (req, res) => {
  const cierreId = req.params.id;
  if (!cierreId) {
    return res.status(400).json({ error: 'Falta el parámetro id' });
  }
  
  console.log(`Intentando marcar cierre ${cierreId} para revisión...`);
  
  // Marcar el cierre como "revisar" reemplazando la validación
  const updateQuery = 'UPDATE cierres SET validado = ?, usuario_validacion = ?, fecha_validacion = ? WHERE id = ?';
  const params = [0, null, null, cierreId];
  
  db.run(updateQuery, params, function (err) {
    if (err) {
      console.error('Error actualizando estado revisar:', err.message);
      return res.status(500).json({ error: 'Error actualizando estado revisar', details: err.message });
    }
    if (this.changes === 0) {
      console.log(`No se encontró cierre con ID ${cierreId}`);
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }
    console.log(`Cierre ${cierreId} marcado para revisión exitosamente. Filas afectadas: ${this.changes}`);
    res.json({ message: 'Cierre marcado para revisión correctamente' });
  });
});

// -------------------------------
// Endpoints para manejo del archivo localStorage.json (JSON de ajustes)
// -------------------------------

// Configuración por defecto (sin información de legado)
const defaultConfig = {
  tiendas: ["Recoleta", "Alto Palermo", "Unicenter", "Solar", "Cordoba", "Rosario"],
  motivos_error_pago: ["Cobro doble", "Cobro de Mas", "Cobro de Menos", "Inversion de medio de pago", "Diferencia Generada por Anulación"],
  medios_pago: ["Efectivo", "MPoint", "Mp - Qr", "MPoint - Contingencia", "Payway", "AppaGift"],
  asignaciones: {
    "Recoleta": [],
    "Alto Palermo": [],
    "Unicenter": [],
    "Solar": [],
    "Cordoba": [],
    "Rosario": []
  },
  config_font_size: 14,
  config_theme: "Oscuro",
  config_language: "Español",
  config_debug: false,
  config_logging: false
};

// Ruta absoluta al archivo localStorage.json
const localStoragePath = path.resolve(__dirname, '../localStorage.json');

// Endpoint para obtener el contenido del JSON (lectura)
app.get('/localStorage', (req, res) => {
  fs.readFile(localStoragePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error leyendo el archivo localStorage.json:", err);
      return res.status(500).json({ error: "Error leyendo el archivo JSON" });
    }
    // Si el archivo está vacío, retornar la configuración por defecto
    if (!data || data.trim() === "") {
      console.log("El archivo localStorage.json está vacío. Retornando configuración por defecto.");
      return res.json(defaultConfig);
    }
    try {
      let parsedData = JSON.parse(data);
      // Si la estructura está anidada en la clave "ajustes_data", parsearla nuevamente
      if (parsedData.ajustes_data && typeof parsedData.ajustes_data === "string") {
        parsedData = JSON.parse(parsedData.ajustes_data);
      }
      // Eliminar datos de legado si existen
      delete parsedData.usuarios;
      delete parsedData.cajas;
      delete parsedData.usuario_legacy;
      // Fusionar con la configuración por defecto para asegurar todas las claves
      const mergedData = {
        ...defaultConfig,
        ...parsedData,
        tiendas: parsedData.tiendas || defaultConfig.tiendas,
        asignaciones: parsedData.asignaciones || defaultConfig.asignaciones,
        motivos_error_pago: parsedData.motivos_error_pago || defaultConfig.motivos_error_pago,
        medios_pago: parsedData.medios_pago || defaultConfig.medios_pago,
        config_font_size: parsedData.config_font_size !== undefined ? parsedData.config_font_size : defaultConfig.config_font_size,
        config_theme: parsedData.config_theme || defaultConfig.config_theme,
        config_language: parsedData.config_language || defaultConfig.config_language,
        config_debug: parsedData.config_debug !== undefined ? parsedData.config_debug : defaultConfig.config_debug,
        config_logging: parsedData.config_logging !== undefined ? parsedData.config_logging : defaultConfig.config_logging
      };
      return res.json(mergedData);
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError);
      return res.status(500).json({ error: "Error parseando el JSON" });
    }
  });
});

// Endpoint para actualizar o escribir el JSON (escritura)
app.post('/localStorage', (req, res) => {
  let newData = req.body;
  // Eliminar información de legado
  delete newData.usuarios;
  delete newData.cajas;
  delete newData.usuario_legacy;
  fs.writeFile(localStoragePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error("Error escribiendo el archivo localStorage.json:", err);
      return res.status(500).json({ error: "Error escribiendo el archivo JSON" });
    }
    res.json({ message: "Archivo actualizado correctamente" });
  });
});

// Endpoint para mostrar valores al azar de la base de datos y del localStorage.json
app.get('/api/random', async (req, res) => {
  // Obtener un cierre aleatorio de la base de datos
  db.get('SELECT * FROM cierres ORDER BY RANDOM() LIMIT 1', [], (err, randomCierre) => {
    if (err) {
      console.error('Error obteniendo cierre aleatorio:', err.message);
      return res.status(500).json({ error: 'Error obteniendo cierre aleatorio' });
    }
    // Leer el archivo localStorage.json
    fs.readFile(localStoragePath, 'utf8', (err2, data) => {
      if (err2) {
        console.error('Error leyendo localStorage.json:', err2);
        return res.status(500).json({ error: 'Error leyendo localStorage.json' });
      }
      let localData = {};
      try {
        localData = JSON.parse(data);
      } catch (e) {
        localData = defaultConfig;
      }
      // Tomar una clave al azar del localStorage
      const localKeys = Object.keys(localData);
      const randomKey = localKeys[Math.floor(Math.random() * localKeys.length)];
      const randomLocalValue = localData[randomKey];
      res.json({
        randomCierre,
        randomLocalKey: randomKey,
        randomLocalValue
      });
    });
  });
});

// ██████████████████████████████████████████████████████████████████████████████
// ENDPOINTS PARA JUSTIFICACIONES
// ██████████████████████████████████████████████████████████████████████████████

// ── GET /api/justificaciones/:cierreId ──
app.get('/api/justificaciones/:cierreId', (req, res) => {
  const cierreId = req.params.cierreId;
  
  const query = `
    SELECT id, cierre_id, fecha, usuario, orden, cliente, medio_pago, motivo, ajuste 
    FROM justificaciones 
    WHERE cierre_id = ? 
    ORDER BY fecha DESC
  `;
  
  db.all(query, [cierreId], (err, rows) => {
    if (err) {
      console.error('Error obteniendo justificaciones:', err.message);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(rows);
  });
});

// ── POST /api/justificaciones ──
app.post('/api/justificaciones', (req, res) => {
  const {
    cierre_id,
    fecha,
    orden,
    cliente,
    monto_dif,
    ajuste,
    motivo
  } = req.body;

  // Formatear la fecha a YYYY-MM-DD antes de guardarla
  // La fecha viene en formato DD/MM/YYYY desde el frontend
  const fechaFormateada = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');

  // Obtener el usuario actual desde la base de datos o desde la sesión
  const usuario = req.body.usuario || '';
  const medio_pago = req.body.medio_pago || '';

  const insertQuery = `
    INSERT INTO justificaciones (cierre_id, fecha, usuario, orden, cliente, medio_pago, motivo, ajuste)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insertQuery, 
    [cierre_id, fechaFormateada, usuario, orden, cliente, medio_pago, motivo, ajuste],
    function(err) {
      if (err) {
        console.error('Error insertando justificación:', err.message);
        return res.status(500).json({ error: 'Error al crear la justificación' });
      }
      res.json({ 
        id: this.lastID, 
        message: 'Justificación creada correctamente',
        cierre_id,
        fecha: fechaFormateada,
        orden,
        cliente,
        monto_dif,
        ajuste,
        motivo
      });
    }
  );
});

// ── PUT /api/justificaciones/:id ──
app.put('/api/justificaciones/:id', (req, res) => {
  const justId = req.params.id;
  const {
    fecha,
    orden,
    cliente,
    monto_dif,
    ajuste,
    motivo
  } = req.body;

  // Formatear la fecha a YYYY-MM-DD antes de guardarla
  // La fecha viene en formato DD/MM/YYYY desde el frontend
  const fechaFormateada = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');

  const updateQuery = `
    UPDATE justificaciones SET
      fecha = ?,
      orden = ?,
      cliente = ?,
      monto_dif = ?,
      ajuste = ?,
      motivo = ?
    WHERE id = ?
  `;

  db.run(updateQuery, 
    [fechaFormateada, orden, cliente, monto_dif, ajuste, motivo, justId],
    function(err) {
      if (err) {
        console.error('Error actualizando justificación:', err.message);
        return res.status(500).json({ error: 'Error al actualizar la justificación' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Justificación no encontrada' });
      }
      
      res.json({ message: 'Justificación actualizada correctamente' });
    }
  );
});

// ── DELETE /api/justificaciones/:id ──
app.delete('/api/justificaciones/:id', (req, res) => {
  const justId = req.params.id;

  const deleteQuery = 'DELETE FROM justificaciones WHERE id = ?';

  db.run(deleteQuery, [justId], function(err) {
    if (err) {
      console.error('Error eliminando justificación:', err.message);
      return res.status(500).json({ error: 'Error al eliminar la justificación' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Justificación no encontrada' });
    }
    
    res.json({ message: 'Justificación eliminada correctamente' });
  });
});

// ── PUT /api/cierres-validar ──
app.put('/api/cierres-validar', (req, res) => {
  const { ids, usuario_validacion } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Faltan IDs para validar' });
  }
  const fecha_validacion = moment().format('YYYY-MM-DD HH:mm:ss');
  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE cierres SET validado = 1, usuario_validacion = ?, fecha_validacion = ? WHERE id IN (${placeholders})`;
  db.run(sql, [usuario_validacion, fecha_validacion, ...ids], function (err) {
    if (err) {
      console.error('Error validando cierres:', err.message);
      return res.status(500).json({ error: 'Error validando cierres' });
    }
    res.json({ message: 'Cierres validados correctamente', count: this.changes });
  });
});

// -------------------------------
// Inicia el servidor en el puerto 3001 (o el definido en process.env.PORT)
// -------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
