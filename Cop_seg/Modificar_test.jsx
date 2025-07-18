import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import moment from 'moment';

export default function Modificar({ cierre, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({ tiendas: [], motivos_error_pago: [], medios_pago: [], asignaciones: {} });
  const [justificaciones, setJustificaciones] = useState([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteJustId, setDeleteJustId] = useState(null);
  
  // Estados calculados
  const [totales, setTotales] = useState({
    totalFacturado: 0,
    totalCobrado: 0,
    diferenciaTotal: 0,
    totalAjustes: 0,
    balanceFinal: 0
  });

  // Cargar configuración inicial
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/localStorage`);
        setConfig(response.data);
      } catch (err) {
        console.error('Error cargando configuración:', err);
      }
    };
    loadConfig();
  }, []);

  // Cargar datos del cierre
  useEffect(() => {
    if (!cierre?.id) return;
    setLoading(true);
    setError('');
    
    const loadCierre = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/cierres-completo/${cierre.id}`);
        const data = response.data;
        
        // Procesar medios de pago - FIX: Mejorar el parsing
        let mediosPago = [];
        try {
          if (data.medios_pago) {
            // Si es string, parsearlo
            if (typeof data.medios_pago === 'string') {
              mediosPago = JSON.parse(data.medios_pago);
            } 
            // Si es array, usarlo directamente
            else if (Array.isArray(data.medios_pago)) {
              mediosPago = data.medios_pago;
            }
            // Si es objeto, convertirlo a array
            else if (typeof data.medios_pago === 'object') {
              mediosPago = Object.keys(data.medios_pago).map(key => ({
                medio: key,
                facturado: data.medios_pago[key].facturado || 0,
                cobrado: data.medios_pago[key].cobrado || 0,
                differenceVal: data.medios_pago[key].differenceVal || 0
              }));
            }
          }

          // Asegurar que todos los elementos tengan las propiedades necesarias
          mediosPago = mediosPago.map(mp => ({
            medio: mp.medio || '',
            facturado: parseFloat(mp.facturado) || 0,
            cobrado: parseFloat(mp.cobrado) || 0,
            differenceVal: parseFloat(mp.differenceVal) || 0
          }));

        } catch (parseError) {
          console.error('Error parsing medios_pago:', parseError);
          mediosPago = [];
        }

        // Manejar el formato de fecha
        let fechaFormateada = data.fecha;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaFormateada)) {
          fechaFormateada = moment(fechaFormateada, 'DD/MM/YYYY').format('YYYY-MM-DD');
        }

        setForm({
          ...data,
          medios_pago: mediosPago,
          fecha: fechaFormateada
        });
        
        // Cargar justificaciones
        const justificacionesValidas = (data.justificaciones || []).filter(just => 
          just && typeof just === 'object' && (
            just.motivo || just.ajuste || just.monto_dif || just.orden || just.cliente
          )
        );
        setJustificaciones(justificacionesValidas);
        
      } catch (err) {
        console.error('Error loading cierre:', err);
        setError('No se pudo cargar el cierre: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    loadCierre();
  }, [cierre?.id]);

  // Calcular totales automáticamente
  useEffect(() => {
    const mediosPago = form.medios_pago || [];
    const totalFacturado = mediosPago.reduce((sum, mp) => sum + (parseFloat(mp.facturado) || 0), 0);
    const totalCobrado = mediosPago.reduce((sum, mp) => sum + (parseFloat(mp.cobrado) || 0), 0);
    const diferenciaTotal = totalCobrado - totalFacturado;
    const totalAjustes = justificaciones
      .filter(j => j && (j.ajuste || j.monto_dif || j.motivo)) // Filtrar justificaciones válidas
      .reduce((sum, j) => sum + (parseFloat(j.ajuste) || 0), 0);
    const balanceFinal = diferenciaTotal - totalAjustes;

    setTotales({
      totalFacturado,
      totalCobrado,
      diferenciaTotal,
      totalAjustes,
      balanceFinal
    });
  }, [form.medios_pago, justificaciones]);

  // Sincronizar fechas de justificaciones con la fecha del cierre
  useEffect(() => {
    if (form.fecha && justificaciones.length > 0) {
      setJustificaciones(prevJust => 
        prevJust.map(just => ({
          ...just,
          fecha: form.fecha // Sincronizar con la fecha del cierre
        }))
      );
    }
  }, [form.fecha]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleMedioPagoChange = useCallback((index, field, value) => {
    setForm(prev => {
      const mediosPago = [...(prev.medios_pago || [])];
      mediosPago[index] = {
        ...mediosPago[index],
        [field]: parseFloat(value) || 0
      };
      
      // Recalcular diferencia automáticamente
      if (field === 'facturado' || field === 'cobrado') {
        mediosPago[index].differenceVal = mediosPago[index].cobrado - mediosPago[index].facturado;
      }
      
      return { ...prev, medios_pago: mediosPago };
    });
  }, []);

  const handleJustificacionChange = useCallback((index, field, value) => {
    setJustificaciones(prev => {
      const newJust = [...prev];
      newJust[index] = { ...newJust[index], [field]: value };
      return newJust;
    });
  }, []);

  const addJustificacion = useCallback(() => {
    const newJust = {
      cierre_id: form.id,
      fecha: form.fecha, // Usar la fecha del cierre (ya está en formato YYYY-MM-DD)
      orden: '',
      cliente: '',
      monto_dif: 0,
      ajuste: 0,
      motivo: ''
    };
    setJustificaciones(prev => [...prev, newJust]);
  }, [form.id, form.fecha]);

  const deleteJustificacion = useCallback(async (index) => {
    const just = justificaciones[index];
    if (just.id) {
      // Si tiene ID, eliminar de la base de datos
      setDeleteJustId(just.id);
      setDeleteConfirmOpen(true);
    } else {
      // Si no tiene ID, solo remover del array
      setJustificaciones(prev => prev.filter((_, i) => i !== index));
    }
  }, [justificaciones]);

  const confirmDeleteJustificacion = useCallback(async () => {
    try {
      if (deleteJustId) {
        await axios.delete(`${API_BASE_URL}/api/justificaciones/${deleteJustId}`);
      }
      setJustificaciones(prev => prev.filter(j => j.id !== deleteJustId));
      setDeleteConfirmOpen(false);
      setDeleteJustId(null);
    } catch (err) {
      setError('Error al eliminar la justificación.');
    }
  }, [deleteJustId]);

  const handleGuardar = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Limpiar justificaciones inválidas o vacías
      const justificacionesLimpias = justificaciones.filter(just => 
        just && 
        typeof just === 'object' && 
        just.cierre_id && 
        (
          (just.motivo && just.motivo.trim()) || 
          (just.ajuste && parseFloat(just.ajuste) !== 0) || 
          (just.monto_dif && parseFloat(just.monto_dif) !== 0) ||
          (just.orden && just.orden.trim()) || 
          (just.cliente && just.cliente.trim())
        )
      );

      // Preparar datos para guardar
      // Convertir fecha de YYYY-MM-DD (del input) a DD/MM/YYYY para enviar a la API
      const fechaParaEnviar = moment(form.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY');
      
      const dataToSave = {
        ...form,
        medios_pago: JSON.stringify(form.medios_pago),
        grand_difference_total: totales.diferenciaTotal,
        balance_sin_justificar: totales.balanceFinal,
        fecha: fechaParaEnviar
      };

      // Guardar cierre principal
      await axios.put(`${API_BASE_URL}/api/cierres-completo/${form.id}`, dataToSave);
      
      // Guardar justificaciones con fechas en formato correcto
      for (const just of justificacionesLimpias) {
        // Convertir fecha de justificación a DD/MM/YYYY si es necesario
        const justToSave = {
          ...just,
          fecha: moment(just.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')
        };
        
        try {
          if (just.id) {
            // Intentar actualizar existente
            await axios.put(`${API_BASE_URL}/api/justificaciones/${just.id}`, justToSave);
          } else {
            // Crear nueva
            await axios.post(`${API_BASE_URL}/api/justificaciones`, {
              ...justToSave,
              cierre_id: form.id
            });
          }
        } catch (justError) {
          // Si falla la actualización (ej: ID no existe), intentar crear una nueva
          if (justError.response?.status === 404 && just.id) {
            console.warn(`Justificación ID ${just.id} no encontrada, creando nueva...`);
            try {
              const justSinId = { ...justToSave };
              delete justSinId.id; // Remover el ID para crear nueva
              await axios.post(`${API_BASE_URL}/api/justificaciones`, {
                ...justSinId,
                cierre_id: form.id
              });
            } catch (createError) {
              console.error('Error creando justificación de respaldo:', createError);
              throw new Error(`Error al guardar justificación: ${createError.response?.data?.error || createError.message}`);
            }
          } else {
            throw new Error(`Error al actualizar justificación: ${justError.response?.data?.error || justError.message}`);
          }
        }
      }

      // Ejecutar callbacks y cerrar modal automáticamente
      // Pasar los datos con la fecha ya convertida al formato correcto
      if (onSave) onSave({
        ...form,
        fecha: fechaParaEnviar, // Fecha en formato DD/MM/YYYY
        medios_pago: form.medios_pago, // Mantener como array
        grand_difference_total: totales.diferenciaTotal,
        balance_sin_justificar: totales.balanceFinal
      });
      if (onClose) onClose();
    } catch (err) {
      setError('Error al guardar los cambios: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getUsuariosByTienda = useCallback((tienda) => {
    return config.asignaciones[tienda] || [];
  }, [config.asignaciones]);

  const getEstadoCierre = () => {
    if (Math.abs(totales.balanceFinal) < 0.01) return { color: 'success', label: 'Cuadrado' };
    if (Math.abs(totales.balanceFinal) <= 1000) return { color: 'warning', label: 'Diferencia Menor' };
    return { color: 'error', label: 'Diferencia Grave' };
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading && !form.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{
      maxWidth: 900,
      width: '90vw',
      maxHeight: '85vh',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#0a0a0a',
      color: '#e0e0e0',
      borderRadius: 1,
      overflow: 'hidden',
      border: '1px solid #333'
    }}>
      {/* HEADER MINIMALISTA */}
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid #333',
        bgcolor: '#111',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h6" sx={{ color: '#e0e0e0', fontSize: '1.1rem' }}>
            Cierre #{form.id}
          </Typography>
          <Chip 
            label={getEstadoCierre().label}
            color={getEstadoCierre().color}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>
        
        <Box display="flex" gap={1}>
          <Button 
            onClick={onClose} 
            variant="text" 
            size="small"
            sx={{ color: '#999', minWidth: 60 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardar} 
            variant="contained" 
            size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <SaveIcon />}
            disabled={loading}
            sx={{ 
              bgcolor: '#2e7d32', 
              '&:hover': { bgcolor: '#388e3c' },
              minWidth: 70
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </Box>

      {/* CONTENIDO MINIMALISTA */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
        {error && <Alert severity="error" sx={{ mb: 1.5, bgcolor: '#2d1b1b' }}>{error}</Alert>}

        {/* INFORMACIÓN BÁSICA - SOLO LECTURA */}
        <Box sx={{ 
          mb: 1.5, 
          p: 1.5, 
          bgcolor: '#111', 
          borderRadius: 1,
          border: '1px solid #333'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, fontSize: '0.8rem' }}>
            INFORMACIÓN BÁSICA (Solo lectura)
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666' }}>Fecha</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                {form.fecha ? moment(form.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY') : '-'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666' }}>Tienda</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                {form.tienda || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666' }}>Usuario</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                {form.usuario || '-'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" sx={{ color: '#666' }}>Responsable</Typography>
              <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                {form.responsable || '-'}
              </Typography>
            </Grid>
          </Grid>
          
          {/* COMENTARIOS - ÚNICO CAMPO EDITABLE */}
          <Box sx={{ mt: 1.5 }}>
            <TextField
              label="Comentarios"
              name="comentarios"
              value={form.comentarios || ''}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={2}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#e0e0e0',
                  bgcolor: '#1a1a1a',
                  '& fieldset': { borderColor: '#333' }
                },
                '& .MuiInputLabel-root': { color: '#888', fontSize: '0.8rem' }
              }}
            />
          </Box>
        </Box>

        {/* MEDIOS DE PAGO */}
        <Box sx={{ 
          mb: 1.5, 
          p: 1.5, 
          bgcolor: '#111', 
          borderRadius: 1,
          border: '1px solid #333'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, fontSize: '0.8rem' }}>
            MEDIOS DE PAGO ({form.medios_pago?.length || 0})
          </Typography>
          <Grid container spacing={1}>
            {(form.medios_pago || []).map((medio, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ 
                  border: '1px solid #333', 
                  borderRadius: 1, 
                  p: 1, 
                  bgcolor: '#0a0a0a' 
                }}>
                  <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 0.5 }}>
                    {medio.medio}
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        label="Facturado"
                        type="number"
                        value={medio.facturado || ''}
                        onChange={(e) => handleMedioPagoChange(index, 'facturado', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            bgcolor: '#1a1a1a',
                            '& fieldset': { borderColor: '#333' }
                          },
                          '& .MuiInputLabel-root': { color: '#888', fontSize: '0.7rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Cobrado"
                        type="number"
                        value={medio.cobrado || ''}
                        onChange={(e) => handleMedioPagoChange(index, 'cobrado', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            bgcolor: '#1a1a1a',
                            '& fieldset': { borderColor: '#333' }
                          },
                          '& .MuiInputLabel-root': { color: '#888', fontSize: '0.7rem' }
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: (medio.differenceVal || 0) >= 0 ? '#4caf50' : '#f44336',
                      fontWeight: 'bold',
                      fontSize: '0.7rem',
                      display: 'block',
                      mt: 0.5
                    }}
                  >
                    Dif: {formatMoney(medio.differenceVal || 0)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* JUSTIFICACIONES */}
        <Box sx={{ 
          mb: 1.5, 
          p: 1.5, 
          bgcolor: '#111', 
          borderRadius: 1,
          border: '1px solid #333'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ color: '#888', fontSize: '0.8rem' }}>
              JUSTIFICACIONES ({justificaciones.length})
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={addJustificacion}
              sx={{ 
                bgcolor: '#1976d2', 
                '&:hover': { bgcolor: '#2196f3' },
                fontSize: '0.7rem',
                height: 24
              }}
            >
              Agregar
            </Button>
          </Box>
          
          <Grid container spacing={1}>
            {justificaciones.map((just, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ 
                  border: '1px solid #333', 
                  borderRadius: 1, 
                  p: 1, 
                  bgcolor: '#0a0a0a' 
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                      #{index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => deleteJustificacion(index)}
                      sx={{ color: '#f44336', padding: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Orden"
                        value={just.orden || ''}
                        onChange={(e) => handleJustificacionChange(index, 'orden', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            bgcolor: '#1a1a1a',
                            '& fieldset': { borderColor: '#333' }
                          },
                          '& .MuiInputLabel-root': { color: '#888', fontSize: '0.7rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Cliente"
                        value={just.cliente || ''}
                        onChange={(e) => handleJustificacionChange(index, 'cliente', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            bgcolor: '#1a1a1a',
                            '& fieldset': { borderColor: '#333' }
                          },
                          '& .MuiInputLabel-root': { color: '#888', fontSize: '0.7rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Ajuste"
                        type="number"
                        value={just.ajuste || ''}
                        onChange={(e) => handleJustificacionChange(index, 'ajuste', e.target.value)}
                        fullWidth
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': { 
                            color: '#e0e0e0',
                            bgcolor: '#1a1a1a',
                            '& fieldset': { borderColor: '#333' }
                          },
                          '& .MuiInputLabel-root': { color: '#888', fontSize: '0.7rem' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: '#888', fontSize: '0.7rem' }}>Motivo</InputLabel>
                        <Select
                          value={just.motivo || ''}
                          onChange={(e) => handleJustificacionChange(index, 'motivo', e.target.value)}
                          sx={{ 
                            color: '#e0e0e0',
                            bgcolor: '#1a1a1a',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333' }
                          }}
                        >
                          {config.motivos_error_pago.map((motivo) => (
                            <MenuItem key={motivo} value={motivo}>{motivo}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
            
            {justificaciones.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  border: '1px dashed #333', 
                  borderRadius: 1, 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: '#0a0a0a'
                }}>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
                    Sin justificaciones
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* RESUMEN FINAL */}
        <Box sx={{ 
          p: 1.5, 
          bgcolor: '#111', 
          borderRadius: 1,
          border: '1px solid #333'
        }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 1, fontSize: '0.8rem' }}>
            RESUMEN
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Facturado</Typography>
              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                {formatMoney(totales.totalFacturado)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Cobrado</Typography>
              <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                {formatMoney(totales.totalCobrado)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Diferencia</Typography>
              <Typography variant="body2" sx={{ color: totales.diferenciaTotal >= 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                {formatMoney(totales.diferenciaTotal)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Ajustes</Typography>
              <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                {formatMoney(totales.totalAjustes)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Balance</Typography>
              <Typography variant="body2" sx={{ color: Math.abs(totales.balanceFinal) < 0.01 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                {formatMoney(totales.balanceFinal)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>Estado</Typography>
              <Typography variant="body2" sx={{ color: getEstadoCierre().color === 'success' ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                {getEstadoCierre().label}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { bgcolor: '#111', color: '#e0e0e0' } }}
      >
        <DialogTitle sx={{ color: '#e0e0e0' }}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#e0e0e0' }}>
            ¿Está seguro que desea eliminar esta justificación?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#999' }}>
            Cancelar
          </Button>
          <Button onClick={confirmDeleteJustificacion} sx={{ color: '#f44336' }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
