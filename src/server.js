const express = require('express');
const app = express();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

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
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS cierres (
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
    comentarios TEXT
  )
`;
db.run(createTableQuery, (err) => {
  if (err) {
    console.error("Error al crear la tabla cierres:", err.message);
  } else {
    console.log("Tabla 'cierres' lista.");
  }
});

// Crear la tabla 'justificaciones' si no existe
const createJustificacionesTable = `
  CREATE TABLE IF NOT EXISTS justificaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cierre_id INTEGER,
    fecha TEXT,
    orden TEXT,
    cliente TEXT,
    monto_dif REAL,
    ajuste REAL,
    motivo TEXT,
    FOREIGN KEY (cierre_id) REFERENCES cierres(id)
  )
`;
db.run(createJustificacionesTable, (err) => {
  if(err) {
    console.error("Error al crear la tabla justificaciones:", err.message);
  } else {
    console.log("Tabla 'justificaciones' lista.");
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
  const cierresQuery = `
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
      comentarios
    FROM cierres
  `;

  const justificacionesQuery = `
    SELECT 
      id,
      cierre_id,
      fecha,
      orden,
      cliente,
      monto_dif,
      ajuste,
      motivo
    FROM justificaciones
  `;

  db.all(cierresQuery, [], (err, cierres) => {
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

        return {
          ...cierre,
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
  const query = `SELECT COUNT(*) as count FROM cierres WHERE fecha = ? AND tienda = ? AND usuario = ?`;
  db.get(query, [fecha, tienda, usuario], (err, row) => {
    if (err) {
      console.error("Error al consultar existencia:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ existe: row.count > 0 });
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

  const insertCierre = `
    INSERT INTO cierres (
      fecha, tienda, usuario, total_billetes, final_balance, brinks_total, medios_pago, grand_difference_total, balance_sin_justificar, responsable, comentarios
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insertCierre, [
    fecha,
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
      const insertJust = `INSERT INTO justificaciones (cierre_id, fecha, orden, cliente, monto_dif, ajuste, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const stmt = db.prepare(insertJust);
      justificaciones.forEach(j => {
        stmt.run([
          cierreId,
          j.fecha,
          j.orden,
          j.cliente,
          j.monto_dif,
          j.ajuste,
          j.motivo
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

  const updateSql = `
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

  db.run(updateSql, [
    fecha,
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
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }
    // Actualizar justificaciones: eliminar las existentes y agregar las nuevas
    db.run('DELETE FROM justificaciones WHERE cierre_id = ?', [cierreId], (err2) => {
      if (err2) {
        console.error('Error eliminando justificaciones:', err2.message);
        return res.status(500).json({ error: 'Error actualizando justificaciones' });
      }
      if (Array.isArray(justificaciones) && justificaciones.length > 0) {
        const insertJust = `INSERT INTO justificaciones (cierre_id, fecha, orden, cliente, monto_dif, ajuste, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const stmt = db.prepare(insertJust);
        justificaciones.forEach(j => {
          stmt.run([
            cierreId,
            j.fecha,
            j.orden,
            j.cliente,
            j.monto_dif,
            j.ajuste,
            j.motivo
          ]);
        });
        stmt.finalize((finalErr) => {
          if (finalErr) {
            console.error('Error insertando justificaciones:', finalErr.message);
            return res.status(500).json({ error: 'Error insertando justificaciones' });
          }
          res.json({ message: 'Cierre y justificaciones actualizados correctamente' });
        });
      } else {
        res.json({ message: 'Cierre actualizado correctamente (sin justificaciones)' });
      }
    });
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

// Inicia el servidor en el puerto 3001 (o el definido en process.env.PORT)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
