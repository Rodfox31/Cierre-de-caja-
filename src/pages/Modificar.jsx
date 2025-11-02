import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { normalizeNumber } from '../utils/numberFormat';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { axiosWithFallback } from '../config';
import moment from 'moment';

export default function Modificar({ cierre, onClose, onSave }) {
  const theme = useTheme();
  
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({ motivos_error_pago: [] });
  const [justificaciones, setJustificaciones] = useState([]);
  const [modificarJustificaciones, setModificarJustificaciones] = useState(false); // Nueva opción
  const [justificacionesOriginales, setJustificacionesOriginales] = useState([]); // Backup de originales
  const [totales, setTotales] = useState({
    totalFacturado: 0,
    totalCobrado: 0,
    diferenciaTotal: 0,
    totalAjustes: 0,
    balanceFinal: 0,
  });

  // carga init
  useEffect(() => {
    axiosWithFallback('/localStorage').then(res => setConfig(res.data)).catch(() => {});
    if (!cierre?.id) return;
    setLoading(true);
    axiosWithFallback(`/api/cierres-completo/${cierre.id}`)
      .then(res => {
        const d = res.data;
        console.log('🔍 DEBUG - Respuesta completa del API:', d);
        console.log('🔍 DEBUG - medios_pago recibidos:', d.medios_pago);
        console.log('🔍 DEBUG - tipo de medios_pago:', typeof d.medios_pago);
        
        let medios = [];
        if (d.medios_pago) {
          if (typeof d.medios_pago === 'string') {
            console.log('📝 medios_pago es string, parseando...');
            medios = JSON.parse(d.medios_pago);
            console.log('📝 Resultado del parse:', medios);
          } else if (Array.isArray(d.medios_pago)) {
            console.log('📝 medios_pago es array');
            medios = d.medios_pago;
          } else {
            console.log('📝 medios_pago es objeto, convirtiendo a array...');
            medios = Object.entries(d.medios_pago).map(([m, v]) => {
              console.log(`  - Medio: ${m}`, v);
              return {
                medio: m,
                facturado: v.facturado || 0,
                cobrado: v.cobrado || 0,
                differenceVal: v.differenceVal || 0,
              };
            });
          }
        }
        
        console.log('🔍 DEBUG - medios antes de mapear:', medios);
        
        medios = medios.map(mp => {
          const facturado = normalizeNumber(mp.facturado);
          const cobrado = normalizeNumber(mp.cobrado);
          const differenceVal = normalizeNumber(mp.differenceVal);
          
          const resultado = {
            ...mp,
            facturado,
            cobrado,
            differenceVal,
          };
          console.log(`  ✅ Medio procesado: ${mp.medio}`, {
            facturadoOriginal: mp.facturado,
            facturadoParsed: facturado,
            cobradoOriginal: mp.cobrado,
            cobradoParsed: cobrado,
            differenceValOriginal: mp.differenceVal,
            differenceValParsed: differenceVal
          });
          return resultado;
        });
        console.log('🔍 DEBUG - medios finales:', medios);
        
        let fecha = d.fecha;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
          fecha = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');
        }
        setForm({ ...d, medios_pago: medios, fecha });
        
        // Procesar justificaciones con logging para debug
        const justificacionesOriginales = d.justificaciones || [];
        console.log('📋 Justificaciones originales cargadas:', justificacionesOriginales.length);
        
        // Log detallado para depuración
        console.log('🔍 DEBUG - Estructura exacta de justificaciones:', JSON.stringify(d.justificaciones, null, 2));
        console.log('🔍 DEBUG - Ejemplo de primera justificación:', justificacionesOriginales[0] ? 
          JSON.stringify(justificacionesOriginales[0], null, 2) : 'No hay justificaciones');
          const js = justificacionesOriginales.filter(j => {
          // Si la justificación tiene ID (viene de la DB), SIEMPRE es válida
          if (j && j.id) {
            return true;
          }
          
          // Para justificaciones nuevas (sin ID), aplicar filtro más estricto
          const esValida = j && (
            (j.motivo && j.motivo.trim()) || 
            (j.ajuste && parseFloat(j.ajuste) !== 0) || 
            (j.monto_dif && j.monto_dif !== '0' && j.monto_dif !== '') || 
            (j.orden && j.orden.trim()) || 
            (j.cliente && j.cliente.trim())
          );
          
          if (!esValida && j) {
            console.log('⚠️ Justificación nueva sin contenido filtrada:', {
              id: j.id,
              motivo: j.motivo,
              ajuste: j.ajuste,
              monto_dif: j.monto_dif,
              orden: j.orden,
              cliente: j.cliente
            });
          }
          
          return esValida;
        });
          console.log('✅ Justificaciones válidas después del filtro:', js.length);
        setJustificaciones(js);
        setJustificacionesOriginales(js); // Guardar backup de las originales
      })
      .catch(err => setError('No se pudo cargar: ' + err.message))
      .finally(() => setLoading(false));
  }, [cierre]);

  // calcula totales
  useEffect(() => {
    const m = form.medios_pago || [];
    const totalFacturado = m.reduce((s, x) => s + x.facturado, 0);
    const totalCobrado = m.reduce((s, x) => s + x.cobrado, 0);
    const diferenciaTotal = totalCobrado - totalFacturado;
    const totalAjustes = justificaciones.reduce((s, j) => s + (+j.ajuste || 0), 0);
    setTotales({
      totalFacturado,
      totalCobrado,
      diferenciaTotal,
      totalAjustes,
      balanceFinal: diferenciaTotal - totalAjustes,
    });
  }, [form.medios_pago, justificaciones]);

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const handleMedioChange = useCallback((i, field, value) => {
    setForm(f => {
      const list = [...(f.medios_pago || [])];
      list[i] = { ...list[i], [field]: +value || 0 };
      list[i].differenceVal = list[i].cobrado - list[i].facturado;
      return { ...f, medios_pago: list };
    });
  }, []);
  const handleJustChange = useCallback((i, field, value) => {
    setJustificaciones(js => {
      const arr = [...js];
      arr[i] = { ...arr[i], [field]: value };
      
      // Si se cambia el ajuste, actualizar también monto_dif para mantener sincronizado
      if (field === 'ajuste') {
        const ajusteNum = parseFloat(value) || 0;
        arr[i].monto_dif = formatMoney(ajusteNum).replace(/\s+/g, ' ');
      }
      
      // Marcar como modificada si ya tiene ID (viene de la DB)
      if (arr[i].id) {
        arr[i]._modificada = true;
      }
      
      return arr;
    });
  }, []);

  const addJust = useCallback(() => {
    setJustificaciones(js => [
      ...js,
      { 
        cierre_id: form.id, 
        fecha: form.fecha, 
        orden: '', 
        cliente: '', 
        monto_dif: '$ 0', // Formato consistente con DB
        ajuste: 0, 
        motivo: '' 
      },
    ]);
  }, [form]);  const delJust = useCallback(
    async i => {
      if (window.confirm('¿Eliminar justificación?')) {
        const justificacion = justificaciones[i];
        
        try {
          // Si la justificación tiene ID (existe en la DB), eliminarla del servidor INMEDIATAMENTE
          if (justificacion.id) {
            console.log(`🗑️ Eliminando justificación ID ${justificacion.id} del servidor...`);
            await axiosWithFallback(`/api/justificaciones/${justificacion.id}`, { method: 'delete' });
            console.log(`✅ Justificación ID ${justificacion.id} eliminada del servidor`);
            
            // También eliminar de las justificaciones originales
            setJustificacionesOriginales(orig => orig.filter(j => j.id !== justificacion.id));
          }
          
          // Eliminar del estado local (tanto para justificaciones con ID como nuevas)
          setJustificaciones(js => js.filter((_, idx) => idx !== i));
          
        } catch (error) {
          console.error('Error eliminando justificación:', error);
          setError('Error al eliminar la justificación: ' + (error.response?.data?.error || error.message));
          return; // No eliminar del estado local si falló la eliminación del servidor
        }
      }
    },
    [justificaciones]
  );const handleSave = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Validar que tenemos un ID de cierre
      if (!form.id) {
        setError('No se encontró el ID del cierre');
        return;
      }      // Validar y formatear fecha correctamente
      let fechaEnv;
      if (!form.fecha) {
        setError('La fecha del cierre es requerida');
        return;
      }
        console.log('🔍 Validando fecha original:', form.fecha);
      
      // Intentar múltiples formatos de fecha
      let momentDate;
      if (moment(form.fecha, 'YYYY-MM-DD', true).isValid()) {
        momentDate = moment(form.fecha, 'YYYY-MM-DD');
        console.log('✅ Fecha válida formato YYYY-MM-DD');
      } else if (moment(form.fecha, 'DD/MM/YYYY', true).isValid()) {
        momentDate = moment(form.fecha, 'DD/MM/YYYY');
        console.log('✅ Fecha válida formato DD/MM/YYYY');
      } else if (moment(form.fecha).isValid()) {
        momentDate = moment(form.fecha);
        console.log('✅ Fecha válida formato automático');
      } else {
        console.error('❌ Fecha inválida:', form.fecha);
        setError('La fecha del cierre no es válida: ' + form.fecha);
        return;
      }
      
      fechaEnv = momentDate.format('DD/MM/YYYY');
      console.log('📅 Fecha formateada para envío:', fechaEnv);// Filtrar justificaciones válidas y formatear fecha con logging detallado
      console.log('💾 Preparando guardado...');
      console.log('📝 Justificaciones antes del filtro de guardado:', justificaciones.length);
        const cleanJs = justificaciones.filter(j => {
        // Si la justificación tiene ID (viene de la DB), SIEMPRE preservar
        if (j && j.id) {
          return true;
        }
        
        // Para justificaciones nuevas (sin ID), aplicar filtro estricto
        const esValida = j && (
          (j.motivo && j.motivo.trim()) || 
          (j.ajuste && parseFloat(j.ajuste) !== 0) || 
          (j.monto_dif && j.monto_dif !== '0' && j.monto_dif !== '') || 
          (j.orden && j.orden.trim()) || 
          (j.cliente && j.cliente.trim())
        );
        
        if (!esValida && j) {
          console.log('⚠️ Justificación nueva sin contenido excluida del guardado:', {
            id: j.id,
            motivo: j.motivo,
            ajuste: j.ajuste,
            monto_dif: j.monto_dif,
            orden: j.orden,
            cliente: j.cliente
          });
        }
        
        return esValida;
      }).map(j => {
        // Asegurarse de que monto_dif tenga el formato adecuado basado en ajuste
        const ajusteNum = parseFloat(j.ajuste) || 0;
        const montoFormatted = formatMoney(ajusteNum).replace(/\s+/g, ' ');
        
        return {
          ...j,
          fecha: fechaEnv, // Usar la misma fecha del cierre
          cierre_id: form.id, // Asegurar que tienen el cierre_id correcto
          monto_dif: montoFormatted, // Actualizar monto_dif con formato consistente
          ajuste: ajusteNum // Asegurar que ajuste es un número
        };
      });
      
              console.log('Guardando cierre:', {
        id: form.id,
        fecha: fechaEnv,
        fechaOriginal: form.fecha,
        justificaciones: cleanJs.length,
        justificacionesData: cleanJs
      });
      
      // Log detallado de los valores monto_dif y ajuste para verificar sincronización
      console.log('🔍 DEBUG - Valores de monto_dif y ajuste en justificaciones:', 
        cleanJs.map(j => ({
          id: j.id,
          monto_dif: j.monto_dif,
          ajuste: j.ajuste,
          diferencia: j.monto_dif !== formatMoney(j.ajuste).replace(/\s+/g, ' ') ? 'INCONSISTENTE' : 'OK'
        }))
      );      const payload = {
        ...form,
        medios_pago: JSON.stringify(form.medios_pago),
        grand_difference_total: totales.diferenciaTotal,
        balance_sin_justificar: totales.balanceFinal,
        fecha: fechaEnv,
        // Solo incluir justificaciones si el usuario eligió modificarlas Y solo las nuevas/modificadas
        ...(modificarJustificaciones ? { 
          justificaciones: cleanJs.filter(j => !j.id || j._modificada) // Solo nuevas o marcadas como modificadas
        } : {})
      };
      
      console.log('📤 Payload final:', {
        incluirJustificaciones: modificarJustificaciones,
        cantidadJustificaciones: modificarJustificaciones ? cleanJs.length : 'NO MODIFICAR'
      });
      
      // Guardar cierre y justificaciones en una sola operación
      await axiosWithFallback(`/api/cierres-completo/${form.id}`, { method: 'PUT', data: payload });
      
      // Callback de éxito
      onSave?.({
        ...form,
        fecha: fechaEnv,
        medios_pago: form.medios_pago,
        grand_difference_total: totales.diferenciaTotal,
        balance_sin_justificar: totales.balanceFinal,
        justificaciones: cleanJs,
      });
      
      // Cerrar automáticamente
      onClose?.();
      
    } catch (e) {
      console.error('Error al guardar:', e);
      setError('Error al guardar: ' + (e.response?.data?.error || e.message || e));
    } finally {
      setLoading(false);
    }
  }, [form, justificaciones, totales, modificarJustificaciones, onSave, onClose]);

  const formatMoney = v =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);

  // loader
  if (loading && !form.id) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          bgcolor: theme.palette.background.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }
  return (    <Box
      sx={{
        width: '70vw',
        maxWidth: 1000,
        mx: 'auto',
        p: 1.5,
        height: '100vh',
        overflow: 'auto',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
      }}
    >
      <Typography variant="h5" align="center" sx={{ mb: 1.5, fontWeight: 600 }}>
        Modificar Cierre #{form.id}
      </Typography>
      <Alert severity="info" sx={{ mb: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: theme.palette.info.main }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          <strong>Diferencia Total:</strong> Suma de todas las diferencias entre cobrado y facturado.
          <br />
          <strong>Total Ajustes:</strong> Suma de todos los ajustes aplicados en las justificaciones.
          <br />
          <strong>Balance Final:</strong> Diferencia Total - Total Ajustes.
        </Typography>
      </Alert>      <Paper elevation={1} sx={{ p: 1, mb: 1.5, bgcolor: theme.palette.background.paper, borderRadius: 2 }}>
        <Grid container spacing={1}>
          {[
            ['Fecha', form.fecha ? moment(form.fecha).format('DD/MM/YYYY') : '-'],
            ['Usuario', form.usuario || '-'],
            ['Responsable', form.responsable || '-'],
            ['Diferencia Total', formatMoney(totales.diferenciaTotal)],
            ['Total Ajustes', formatMoney(totales.totalAjustes)],
            ['Balance Final', formatMoney(totales.balanceFinal)],
          ].map(([label, value], idx) => (
            <Grid item xs={6} sm={4} key={idx}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{value}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>      <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>
        Medios de Pago
      </Typography>
      <Box sx={{ display: 'grid', gap: 1, mb: 1.5 }}>
        {(form.medios_pago || []).map((m, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 1.5,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{m.medio}</Typography>
            </Box>            <TextField
              label="Facturado"
              type="number"
              value={m.facturado || ''}
              onChange={e => handleMedioChange(i, 'facturado', e.target.value)}
              variant="filled"
              size="small"
              sx={{
                width: 120,
                bgcolor: theme.palette.custom.tableRow,
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <TextField
              label="Cobrado"
              type="number"
              value={m.cobrado || ''}
              onChange={e => handleMedioChange(i, 'cobrado', e.target.value)}
              variant="filled"
              size="small"
              sx={{
                width: 120,
                bgcolor: theme.palette.custom.tableRow,
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <Box sx={{ width: 100, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.7rem' }}>
                Diferencia
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{formatMoney(m.differenceVal)}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>      <Box sx={{ display: 'flex', alignItems: 'center', justify: 'space-between', mb: 1, p: 1, bgcolor: theme.palette.background.paper, borderRadius: 2, border: `1px solid ${theme.palette.custom.tableBorder}` }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          Justificaciones ({justificacionesOriginales.length} originales)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={modificarJustificaciones}
                onChange={(e) => setModificarJustificaciones(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-thumb': {
                    backgroundColor: modificarJustificaciones ? theme.palette.success.main : theme.palette.text.disabled,
                  },
                  '& .MuiSwitch-track': {
                    backgroundColor: modificarJustificaciones ? alpha(theme.palette.success.main, 0.5) : alpha(theme.palette.text.primary, 0.3),
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: modificarJustificaciones ? theme.palette.success.main : theme.palette.text.disabled }}>
                {modificarJustificaciones ? 'Modificando justificaciones' : 'Preservar justificaciones originales'}
              </Typography>
            }
            sx={{ mr: 2 }}
          />
          {modificarJustificaciones && (
            <Button
              startIcon={<AddIcon />}
              size="small"
              variant="outlined"
              onClick={addJust}
              sx={{ borderRadius: 2, borderColor: theme.palette.custom.tableBorder, fontSize: '0.8rem' }}
            >
              Nueva
            </Button>
          )}
        </Box>
      </Box>
        {/* Mostrar advertencia si no se van a modificar las justificaciones */}
      {!modificarJustificaciones && justificacionesOriginales.length > 0 && (
        <Alert severity="info" sx={{ mb: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), borderColor: theme.palette.info.main }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            Las justificaciones se mantendrán sin cambios. Active la modificación si desea editarlas.
          </Typography>
        </Alert>
      )}

      {/* Mostrar justificaciones originales en modo solo lectura */}
      {!modificarJustificaciones && justificacionesOriginales.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.9rem', color: theme.palette.text.secondary }}>
            Justificaciones actuales (solo lectura):
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {justificacionesOriginales.map((j, i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'center',
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.custom.tableBorder}`,
                  opacity: 0.8,
                }}
              >
                <Box sx={{ 
                  width: 80, 
                  fontSize: '0.8rem', 
                  color: theme.palette.text.secondary,
                  textAlign: 'center',
                  fontFamily: 'monospace'
                }}>
                  {j.orden || '-'}
                </Box>
                <Box sx={{ 
                  width: 120, 
                  fontSize: '0.8rem', 
                  color: theme.palette.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {j.cliente || '-'}
                </Box>
                <Box sx={{ 
                  width: 90, 
                  fontSize: '0.8rem', 
                  color: theme.palette.text.secondary,
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  {/* Mostrar el monto_dif (valor de la diferencia) */}
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.6rem', display: 'block' }}>
                    Diferencia:
                  </Typography>
                  {j.monto_dif || '-'}
                </Box>
                <Box sx={{ 
                  width: 90, 
                  fontSize: '0.8rem', 
                  color: j.ajuste > 0 ? theme.palette.success.main : j.ajuste < 0 ? theme.palette.error.main : theme.palette.text.secondary,
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.6rem', display: 'block' }}>
                    Ajuste:
                  </Typography>
                  {formatMoney(j.ajuste || 0)}
                </Box>
                <Box sx={{ 
                  flex: 1, 
                  fontSize: '0.8rem', 
                  color: theme.palette.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {j.motivo || '-'}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
      
      {modificarJustificaciones && (
        <Box>
          {justificaciones.length === 0 && (
            <Typography color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
              No hay justificaciones registradas
            </Typography>
          )}
          <Box sx={{ display: 'grid', gap: 1, mb: 1.5 }}>
            {justificaciones.map((j, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 1.5,
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              bgcolor: theme.palette.background.paper,
              borderRadius: 2,
            }}
          >
            <IconButton
              onClick={() => delJust(i)}
              sx={{ color: theme.palette.error.main, p: 0.5 }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>            <TextField
              label="Orden"
              value={j.orden || ''}
              onChange={e => handleJustChange(i, 'orden', e.target.value)}
              variant="filled"
              size="small"
              sx={{ 
                width: 80, 
                bgcolor: theme.palette.custom.tableRow, 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <TextField
              label="Cliente"
              value={j.cliente || ''}
              onChange={e => handleJustChange(i, 'cliente', e.target.value)}
              variant="filled"
              size="small"
              sx={{ 
                width: 120, 
                bgcolor: theme.palette.custom.tableRow, 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 90,
            }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.6rem' }}>
                Diferencia
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary }}>
                {j.monto_dif || '$ 0'}
              </Typography>
            </Box>
            <TextField
              label="Ajuste"
              type="number"
              value={j.ajuste || ''}
              onChange={e => handleJustChange(i, 'ajuste', e.target.value)}
              variant="filled"
              size="small"
              sx={{ 
                width: 80, 
                bgcolor: theme.palette.custom.tableRow, 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <FormControl 
              variant="filled" 
              size="small" 
              sx={{ 
                flex: 1, 
                bgcolor: theme.palette.custom.tableRow, 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            >
              <InputLabel sx={{ color: theme.palette.text.secondary }}>Motivo</InputLabel>
              <Select
                value={j.motivo || ''}
                onChange={e => handleJustChange(i, 'motivo', e.target.value)}
                sx={{ 
                  color: theme.palette.text.primary,
                  '& .MuiSelect-select': { height: '16px' },
                }}
              >
                {config.motivos_error_pago?.map((motivo, idx) => (
                  <MenuItem key={idx} value={motivo} sx={{ fontSize: '0.8rem' }}>
                    {motivo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>          </Paper>
        ))}
      </Box>
        </Box>
      )}

      <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>
        Comentarios
      </Typography>
      <TextField
        name="comentarios"
        value={form.comentarios || ''}
        onChange={handleChange}
        variant="filled"
        multiline
        rows={2}
        fullWidth
        sx={{ 
          mb: 2, 
          bgcolor: theme.palette.custom.tableRow, 
          borderRadius: 2,
          '& .MuiInputBase-input': { fontSize: '0.9rem' },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ color: theme.palette.text.secondary, borderRadius: 2, fontSize: '0.9rem' }}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} sx={{ borderRadius: 2, fontSize: '0.9rem' }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
