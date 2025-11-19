# Plan de Migración: Normalización de Medios de Pago
**Fecha**: 2025-11-19 20:19:05
**Backup Location**: `/workspaces/Cierre-de-caja-/backups/migration_backup_20251119_201905/`

---

## 📋 Objetivo
Migrar el campo `medios_pago` (TEXT con JSON) a una tabla normalizada `cierres_medios_pago`, similar al modelo actual de `justificaciones`.

---

## 🗄️ Estructura Actual

### Tabla `cierres`
```sql
CREATE TABLE cierres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  tienda TEXT,
  usuario TEXT,
  medios_pago TEXT,  -- ❌ JSON string: [{"medio":"Efectivo","facturado":5000,"cobrado":4800,...}]
  -- ... otros campos
);
```

### Tabla `justificaciones` (ya normalizada)
```sql
CREATE TABLE justificaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cierre_id INTEGER NOT NULL,
  fecha TEXT,
  usuario TEXT,
  orden TEXT,
  cliente TEXT,
  medio_pago TEXT,
  motivo TEXT,
  ajuste REAL,
  FOREIGN KEY (cierre_id) REFERENCES cierres(id) ON DELETE CASCADE
);
```

---

## 🎯 Estructura Propuesta

### Nueva Tabla `cierres_medios_pago`
```sql
CREATE TABLE cierres_medios_pago (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cierre_id INTEGER NOT NULL,
  medio TEXT NOT NULL,
  facturado REAL NOT NULL DEFAULT 0,
  cobrado REAL NOT NULL DEFAULT 0,
  diferencia REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (cierre_id) REFERENCES cierres(id) ON DELETE CASCADE
);

CREATE INDEX idx_cierres_medios_cierre ON cierres_medios_pago(cierre_id);
CREATE INDEX idx_cierres_medios_medio ON cierres_medios_pago(medio);
```

### Tabla `cierres` (modificada)
```sql
-- Remover campo medios_pago
ALTER TABLE cierres DROP COLUMN medios_pago;
```

---

## 🔄 Pasos de Migración

### 1. **Crear nueva tabla**
- Crear `cierres_medios_pago` con estructura normalizada
- Crear índices para performance

### 2. **Migrar datos existentes**
- Leer todos los registros de `cierres`
- Parsear JSON del campo `medios_pago`
- Insertar cada medio como fila en `cierres_medios_pago`
- Validar integridad de datos

### 3. **Actualizar Backend (server.js)**

#### POST `/api/cierres-completo`
**Antes:**
```javascript
medios_pago: JSON.stringify(mediosPagoExport)
```

**Después:**
```javascript
// Insertar en tabla separada
if (Array.isArray(medios_pago) && medios_pago.length > 0) {
  const insertMP = `INSERT INTO cierres_medios_pago (cierre_id, medio, facturado, cobrado, diferencia) VALUES (?, ?, ?, ?, ?)`;
  const stmt = db.prepare(insertMP);
  medios_pago.forEach(mp => {
    stmt.run([cierreId, mp.medio, mp.facturado, mp.cobrado, mp.difference]);
  });
  stmt.finalize();
}
```

#### GET `/api/cierres-completo`
**Agregar JOIN:**
```javascript
SELECT c.*, 
  GROUP_CONCAT(
    json_object('medio', cmp.medio, 'facturado', cmp.facturado, 'cobrado', cmp.cobrado, 'diferencia', cmp.diferencia)
  ) as medios_pago_json
FROM cierres c
LEFT JOIN cierres_medios_pago cmp ON c.id = cmp.cierre_id
GROUP BY c.id
```

#### PUT `/api/cierres/:id`
**Actualizar medios de pago:**
```javascript
// Eliminar medios existentes
db.run('DELETE FROM cierres_medios_pago WHERE cierre_id = ?', [cierreId]);
// Insertar nuevos
// ... (igual que POST)
```

### 4. **Actualizar Frontend (CierreCaja.jsx)**

**Línea ~1736:**
```javascript
// Antes:
medios_pago: JSON.stringify(mediosPagoExport)

// Después:
medios_pago: mediosPagoExport  // Enviar array sin stringify
```

### 5. **Actualizar Exportar.jsx**

**Línea ~1645 (fetchJustificaciones):**
```javascript
// Antes: JSON.parse(c.medios_pago)
// Después: c.medios_pago (ya viene como array desde backend)
```

### 6. **Testing**
- [ ] Crear nuevo cierre y verificar inserción
- [ ] Leer cierres existentes con medios de pago
- [ ] Modificar cierre existente
- [ ] Eliminar cierre (verificar CASCADE)
- [ ] Exportar datos con filtros de medios de pago
- [ ] Verificar performance de queries

---

## 🔙 Plan de Rollback

Si algo falla:

1. **Detener servidor**: `npm stop`
2. **Restaurar base de datos**:
   ```bash
   cp backups/migration_backup_20251119_201905/db_pre_migration.db db.js.db
   ```
3. **Restaurar código**:
   ```bash
   cp backups/migration_backup_20251119_201905/server_pre_migration.js src/server.js
   cp backups/migration_backup_20251119_201905/CierreCaja_pre_migration.jsx src/pages/CierreCaja.jsx
   cp backups/migration_backup_20251119_201905/Exportar_pre_migration.jsx src/pages/Exportar.jsx
   ```
4. **Reiniciar servidor**: `npm start`

---

## 📊 Archivos Respaldados

- ✅ `db_pre_migration.db` (108 KB)
- ✅ `server_pre_migration.js` (82 KB)
- ✅ `CierreCaja_pre_migration.jsx` (107 KB)
- ✅ `Exportar_pre_migration.jsx` (68 KB)
- ✅ `package_pre_migration.json` (1.4 KB)
- ✅ `localStorage_pre_migration.json` (1.4 KB)

---

## ✅ Pre-requisitos

- [x] Backup completo creado
- [ ] Plan de migración revisado y aprobado
- [ ] Usuario confirma proceder con la migración

---

**Estado**: ⏸️ Esperando aprobación del usuario para proceder
