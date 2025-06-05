const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001;

const dbPath = path.join(__dirname, '..', 'db.js.db');
const db = new Database(dbPath);

app.use(express.json());
app.use(cors());

// --- Helpers ---
const parseDate = (str) => {
  const [d, m, y] = str.split('-');
  return new Date(`${y}-${m}-${d}`);
};

// --- LocalStorage Endpoints ---
app.get('/localStorage', (req, res) => {
  const filePath = path.join(__dirname, '..', 'localStorage.json');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading localStorage.json', err);
      return res.status(500).json({ error: 'Error reading localStorage.json' });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      console.error('Malformed localStorage.json', e);
      res.status(500).json({ error: 'Malformed localStorage.json' });
    }
  });
});

app.post('/localStorage', (req, res) => {
  const filePath = path.join(__dirname, '..', 'localStorage.json');
  fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf-8', (err) => {
    if (err) {
      console.error('Error writing localStorage.json', err);
      return res.status(500).json({ error: 'Error writing localStorage.json' });
    }
    res.json({ message: 'Configuración guardada' });
  });
});

// --- DB Endpoints ---
app.get('/api/cierres', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cierres').all();
    res.json(rows);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/cierres-completo', (req, res) => {
  try {
    let cierres = db.prepare('SELECT * FROM cierres').all();
    const { fechaDesde, fechaHasta, tienda, usuario } = req.query;

    if (fechaDesde) {
      const dDesde = parseDate(fechaDesde);
      cierres = cierres.filter(c => parseDate(c.fecha) >= dDesde);
    }
    if (fechaHasta) {
      const dHasta = parseDate(fechaHasta);
      cierres = cierres.filter(c => parseDate(c.fecha) <= dHasta);
    }
    if (tienda) {
      cierres = cierres.filter(c => c.tienda === tienda);
    }
    if (usuario) {
      cierres = cierres.filter(c => c.usuario === usuario);
    }

    const justStmt = db.prepare('SELECT * FROM justificaciones WHERE cierre_id = ?');
    cierres = cierres.map(c => ({
      ...c,
      justificaciones: justStmt.all(c.id)
    }));

    res.json(cierres);
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/cierres/existe', (req, res) => {
  const { fecha, tienda, usuario } = req.query;
  if (!fecha || !tienda || !usuario) {
    return res.status(400).json({ error: 'Parámetros requeridos' });
  }
  try {
    const row = db.prepare('SELECT id FROM cierres WHERE fecha = ? AND tienda = ? AND usuario = ?')
      .get(fecha, tienda, usuario);
    res.json({ existe: !!row });
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/cierres', (req, res) => {
  const {
    fecha,
    tienda,
    usuario,
    total_billetes,
    final_balance,
    brinks_total,
    medios_pago,
    justificaciones = [],
    grand_difference_total,
    balance_sin_justificar,
    responsable,
    comentarios
  } = req.body;

  try {
    const insertCierre = db.prepare(`INSERT INTO cierres (
      fecha, tienda, usuario, total_billetes, final_balance, brinks_total,
      grand_difference_total, medios_pago, balance_sin_justificar, responsable,
      comentarios
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

    const result = insertCierre.run(
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
    );

    const cierreId = result.lastInsertRowid;
    if (Array.isArray(justificaciones)) {
      const insertJust = db.prepare(`INSERT INTO justificaciones (
        cierre_id, fecha, orden, cliente, monto_dif, ajuste, motivo
      ) VALUES (?,?,?,?,?,?,?)`);
      for (const j of justificaciones) {
        insertJust.run(
          cierreId,
          j.fecha,
          j.orden,
          j.cliente,
          j.monto_dif,
          j.ajuste,
          j.motivo
        );
      }
    }

    res.json({ id: cierreId });
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
