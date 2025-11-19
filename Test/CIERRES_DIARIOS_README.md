# Tabla Cierres Diarios - Documentación

## 📋 Descripción
La tabla `cierres_diarios` almacena resúmenes consolidados de los cierres de caja diarios, permitiendo tener un registro histórico de la comparación entre lo cobrado y lo facturado por día.

## 🗄️ Estructura de la Tabla

```sql
CREATE TABLE cierres_diarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  usuario TEXT NOT NULL,
  tienda TEXT,
  medios_pago TEXT NOT NULL,
  comentarios TEXT,
  fecha_creacion TEXT DEFAULT (datetime('now', 'localtime'))
);
```

### Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER | ID único auto-incremental |
| `fecha` | TEXT | Fecha del cierre en formato DD/MM/YYYY |
| `usuario` | TEXT | Username del usuario que creó el cierre |
| `tienda` | TEXT | Nombre de la tienda/boutique (puede ser "Todas") |
| `medios_pago` | TEXT | JSON con array de medios de pago (ver estructura abajo) |
| `comentarios` | TEXT | Comentarios del cierre diario |
| `fecha_creacion` | TEXT | Timestamp automático de creación |

## 📊 Estructura del JSON en `medios_pago`

```json
[
  {
    "medio": "Efectivo",
    "cobrado": 50000.00,
    "facturado": 49000.00,
    "diferencia": 1000.00
  },
  {
    "medio": "MPoint",
    "cobrado": 30000.00,
    "facturado": 30000.00,
    "diferencia": 0.00
  }
]
```

## 🔌 Endpoints API

### POST `/api/cierres-diarios`
Crea un nuevo cierre diario.

**Body:**
```json
{
  "fecha": "30/10/2025",
  "usuario": "admin",
  "tienda": "Solar",
  "medios_pago": [
    {
      "medio": "Efectivo",
      "cobrado": 50000,
      "facturado": 49000,
      "diferencia": 1000
    }
  ],
  "comentarios": "Cierre normal del día"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cierre diario guardado exitosamente",
  "id": 1
}
```

### GET `/api/cierres-diarios`
Obtiene todos los cierres diarios ordenados por fecha descendente.

**Response:**
```json
[
  {
    "id": 1,
    "fecha": "30/10/2025",
    "usuario": "admin",
    "tienda": "Solar",
    "medios_pago": [...],
    "comentarios": "Cierre normal del día",
    "fecha_creacion": "2025-10-30 13:40:54"
  }
]
```

### GET `/api/cierres-diarios/:id`
Obtiene un cierre diario específico por ID.

### DELETE `/api/cierres-diarios/:id`
Elimina un cierre diario por ID.

## 💻 Uso en el Frontend

### Componente: `CierreDiario.jsx`

El componente permite:
1. **Seleccionar fecha** (año, mes, día)
2. **Filtrar por tienda** (opcional)
3. **Ver medios de pago consolidados** del día
4. **Ingresar valores de "Facturado"** manualmente
5. **Agregar comentarios** sobre el cierre
6. **Guardar el cierre diario** en la base de datos

### Flujo de Guardado:

```javascript
const handleGuardarCierreDiario = async () => {
  // 1. Valida usuario autenticado
  // 2. Construye array de medios de pago con cobrado, facturado y diferencia
  // 3. Envía POST a /api/cierres-diarios
  // 4. Muestra notificación de éxito/error
  // 5. Limpia el campo de comentarios
};
```

## 🔄 Diferencias con la tabla `cierres`

| Aspecto | `cierres` | `cierres_diarios` |
|---------|-----------|-------------------|
| **Granularidad** | Por cierre individual | Consolidado por día |
| **Origen** | Creado por usuarios en tiempo real | Creado manualmente desde vista CierreDiario |
| **Medios de Pago** | Valores originales del sistema | Valores revisados/ajustados |
| **Propósito** | Registro operativo detallado | Resumen para control gerencial |
| **Comentarios** | Por cierre individual | Por día completo |

## 🚀 Instalación

La tabla se crea automáticamente al iniciar el servidor (`node src/server.js`).

Para crear manualmente:
```bash
node create_cierres_diarios_table.js
```

## 📝 Notas

- El campo `medios_pago` se almacena como JSON string en la BD
- El backend automáticamente parsea/stringifica el JSON
- Los valores numéricos en el JSON deben ser números, no strings
- La fecha debe estar en formato DD/MM/YYYY
- El usuario se obtiene del contexto de autenticación (`currentUser.username`)
