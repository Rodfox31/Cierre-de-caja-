# Cambios pendientes en CierreDiario.jsx

## Layout deseado:
1. **Filtros** (arriba, ancho completo)
2. **Tabla de medios de pago** (ancho completo) 
3. **Comentarios (50%)** | **Calendario (50%)** (lado a lado)
4. **Resumen del día** (ancho completo, abajo) con:
   - Lista de todas las cajas del día con usuario, tienda, hora
   - Medios de pago de cada caja
   - Justificaciones de cada caja
   - Totales

## Cambios aplicados:
✅ Función normalizeNumber() para manejar formatos: "1.267.461,90" y "1267461,90"
✅ Selectores con Number() conversion
✅ calcularDiferencia() y calcularTotales() usando normalizeNumber()
✅ handleCobradoChange() limpia input y acepta ambos formatos

## Pendientes:
- Reorganizar Grid layout
- Agregar componente de resumen detallado con todas las cajas
