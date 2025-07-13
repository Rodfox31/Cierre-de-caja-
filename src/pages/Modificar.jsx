import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Calculate as CalculateIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
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
  const [expandedSections, setExpandedSections] = useState({
    basicos: true,
    medios: false,
    justificaciones: false,
    calculos: false
  });
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
        
        // Procesar medios de pago
        let mediosPago = [];
        try {
          const mp = typeof data.medios_pago === 'string' ? JSON.parse(data.medios_pago) : (data.medios_pago || {});
          if (Array.isArray(mp)) {
            mediosPago = mp;
          } else {
            mediosPago = Object.keys(mp).map(key => ({
              medio: key,
              facturado: mp[key].facturado || 0,
              cobrado: mp[key].cobrado || 0,
              differenceVal: mp[key].differenceVal || 0
            }));
          }
        } catch {
          mediosPago = config.medios_pago.map(medio => ({
            medio,
            facturado: 0,
            cobrado: 0,
            differenceVal: 0
          }));
        }

        // Manejar el formato de fecha que viene de la API (DD/MM/YYYY)
        let fechaFormateada = data.fecha;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaFormateada)) {
          // Si viene en formato DD/MM/YYYY, convertir a YYYY-MM-DD para el input
          fechaFormateada = moment(fechaFormateada, 'DD/MM/YYYY').format('YYYY-MM-DD');
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(fechaFormateada)) {
          // Si viene en formato YYYY-MM-DD, mantener
          fechaFormateada = fechaFormateada;
        }

        setForm({
          ...data,
          medios_pago: mediosPago,
          fecha: fechaFormateada
        });
        
        // Limpiar y validar justificaciones
        const justificacionesValidas = (data.justificaciones || []).filter(just => 
          just && typeof just === 'object' && (
            just.motivo || 
            just.ajuste || 
            just.monto_dif || 
            just.orden || 
            just.cliente
          )
        );
        setJustificaciones(justificacionesValidas);
        
      } catch (err) {
        setError('No se pudo cargar el cierre actualizado.');
      } finally {
        setLoading(false);
      }
    };
    
    loadCierre();
  }, [cierre?.id, config.medios_pago]);

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

  if (loading && !form.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{
      p: 0,
      maxWidth: 1400,
      width: '95vw',
      maxHeight: '95vh',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#1e1e1e',
      color: '#ffffff'
    }}>
      {/* HEADER FIJO */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #333',
        bgcolor: '#242424',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: '#ffffff', mb: 1 }}>
            Modificar Cierre #{form.id}
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <Chip 
              label={`${form.tienda} - ${form.usuario}`} 
              color="primary" 
              size="small" 
            />
            <Chip 
              label={moment(form.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY')} 
              variant="outlined" 
              size="small"
              sx={{ color: '#ffffff', borderColor: '#666' }}
            />
            <Chip 
              label={getEstadoCierre().label}
              color={getEstadoCierre().color}
              size="small"
            />
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          <Button 
            onClick={onClose} 
            variant="outlined" 
            startIcon={<CloseIcon />}
            disabled={loading}
            sx={{ color: '#ffffff', borderColor: '#666' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleGuardar} 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={loading}
            color="success"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </Box>
      </Box>

      {/* CONTENIDO SCROLLEABLE */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* RESUMEN DE TOTALES */}
        <Card sx={{ mb: 3, bgcolor: '#2a2a2a' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Resumen Financiero
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="textSecondary">Total Facturado</Typography>
                <Typography variant="h6" sx={{ color: '#4caf50' }}>
                  ${totales.totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="textSecondary">Total Cobrado</Typography>
                <Typography variant="h6" sx={{ color: '#2196f3' }}>
                  ${totales.totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="textSecondary">Diferencia Inicial</Typography>
                <Typography variant="h6" sx={{ color: totales.diferenciaTotal >= 0 ? '#4caf50' : '#f44336' }}>
                  ${totales.diferenciaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="textSecondary">Total Ajustes</Typography>
                <Typography variant="h6" sx={{ color: '#ff9800' }}>
                  ${totales.totalAjustes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Typography variant="body2" color="textSecondary">Balance Final</Typography>
                <Typography variant="h6" sx={{ color: Math.abs(totales.balanceFinal) < 0.01 ? '#4caf50' : '#f44336' }}>
                  ${totales.balanceFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* SECCIONES ACCORDION */}
        <Stack spacing={2}>
          {/* DATOS BÁSICOS */}
          <Accordion 
            expanded={expandedSections.basicos} 
            onChange={() => setExpandedSections(prev => ({...prev, basicos: !prev.basicos}))}
            sx={{ bgcolor: '#2a2a2a' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff' }} />}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>Datos Básicos del Cierre</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Fecha"
                    name="fecha"
                    type="date"
                    value={form.fecha || ''}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { color: '#ffffff' },
                      '& .MuiInputLabel-root': { color: '#ffffff' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ffffff' }}>Tienda</InputLabel>
                    <Select
                      name="tienda"
                      value={form.tienda || ''}
                      onChange={handleChange}
                      sx={{ color: '#ffffff' }}
                    >
                      {config.tiendas.map((tienda) => (
                        <MenuItem key={tienda} value={tienda}>{tienda}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#ffffff' }}>Usuario</InputLabel>
                    <Select
                      name="usuario"
                      value={form.usuario || ''}
                      onChange={handleChange}
                      sx={{ color: '#ffffff' }}
                    >
                      {getUsuariosByTienda(form.tienda).map((user) => (
                        <MenuItem key={user.usuario} value={user.usuario}>
                          {user.nombre} ({user.usuario})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Responsable"
                    name="responsable"
                    value={form.responsable || ''}
                    onChange={handleChange}
                    fullWidth
                    sx={{ 
                      '& .MuiOutlinedInput-root': { color: '#ffffff' },
                      '& .MuiInputLabel-root': { color: '#ffffff' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Comentarios"
                    name="comentarios"
                    value={form.comentarios || ''}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { color: '#ffffff' },
                      '& .MuiInputLabel-root': { color: '#ffffff' }
                    }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* MEDIOS DE PAGO */}
          <Accordion 
            expanded={expandedSections.medios} 
            onChange={() => setExpandedSections(prev => ({...prev, medios: !prev.medios}))}
            sx={{ bgcolor: '#2a2a2a' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff' }} />}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>
                Medios de Pago 
                <Chip 
                  label={`${form.medios_pago?.length || 0} medios`} 
                  size="small" 
                  sx={{ ml: 2, bgcolor: '#333', color: '#ffffff' }} 
                />
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Medio de Pago</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 'bold' }}>Facturado</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 'bold' }}>Cobrado</TableCell>
                    <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 'bold' }}>Diferencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.medios_pago || []).map((medio, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: '#ffffff' }}>
                        <Chip label={medio.medio} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={medio.facturado || ''}
                          onChange={(e) => handleMedioPagoChange(index, 'facturado', e.target.value)}
                          sx={{ 
                            width: 120,
                            '& .MuiOutlinedInput-root': { color: '#ffffff' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={medio.cobrado || ''}
                          onChange={(e) => handleMedioPagoChange(index, 'cobrado', e.target.value)}
                          sx={{ 
                            width: 120,
                            '& .MuiOutlinedInput-root': { color: '#ffffff' }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: medio.differenceVal >= 0 ? '#4caf50' : '#f44336',
                            fontWeight: 'bold'
                          }}
                        >
                          ${(medio.differenceVal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>

          {/* JUSTIFICACIONES */}
          <Accordion 
            expanded={expandedSections.justificaciones} 
            onChange={() => setExpandedSections(prev => ({...prev, justificaciones: !prev.justificaciones}))}
            sx={{ bgcolor: '#2a2a2a' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff' }} />}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>
                Justificaciones 
                <Chip 
                  label={`${justificaciones.length} items`} 
                  size="small" 
                  sx={{ ml: 2, bgcolor: '#333', color: '#ffffff' }} 
                />
                {totales.totalAjustes !== 0 && (
                  <Chip 
                    label={`Total: $${totales.totalAjustes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`} 
                    size="small" 
                    color="warning"
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addJustificacion}
                  size="small"
                  color="primary"
                >
                  Agregar Justificación
                </Button>
              </Box>
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Fecha</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Orden</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Cliente</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Monto Dif.</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Ajuste</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Motivo</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {justificaciones.map((just, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={just.fecha || ''}
                          disabled
                          sx={{ 
                            width: 140,
                            '& .MuiOutlinedInput-root': { 
                              color: '#ffffff',
                              backgroundColor: '#333'
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#888', display: 'block', fontSize: '0.7rem' }}>
                          (Misma fecha del cierre)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={just.orden || ''}
                          onChange={(e) => handleJustificacionChange(index, 'orden', e.target.value)}
                          sx={{ 
                            width: 100,
                            '& .MuiOutlinedInput-root': { color: '#ffffff' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={just.cliente || ''}
                          onChange={(e) => handleJustificacionChange(index, 'cliente', e.target.value)}
                          sx={{ 
                            width: 120,
                            '& .MuiOutlinedInput-root': { color: '#ffffff' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={just.monto_dif || ''}
                          onChange={(e) => handleJustificacionChange(index, 'monto_dif', e.target.value)}
                          sx={{ 
                            width: 100,
                            '& .MuiOutlinedInput-root': { color: '#ffffff' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={just.ajuste || ''}
                          onChange={(e) => handleJustificacionChange(index, 'ajuste', e.target.value)}
                          sx={{ 
                            width: 100,
                            '& .MuiOutlinedInput-root': { color: '#ffffff' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <Select
                            value={just.motivo || ''}
                            onChange={(e) => handleJustificacionChange(index, 'motivo', e.target.value)}
                            sx={{ color: '#ffffff' }}
                          >
                            {config.motivos_error_pago.map((motivo) => (
                              <MenuItem key={motivo} value={motivo}>{motivo}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Eliminar justificación">
                          <IconButton
                            size="small"
                            onClick={() => deleteJustificacion(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {justificaciones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: '#888', py: 4 }}>
                        No hay justificaciones registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>

          {/* CÁLCULOS Y VALIDACIONES */}
          <Accordion 
            expanded={expandedSections.calculos} 
            onChange={() => setExpandedSections(prev => ({...prev, calculos: !prev.calculos}))}
            sx={{ bgcolor: '#2a2a2a' }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff' }} />}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>
                Validaciones y Cálculos
                {Math.abs(totales.balanceFinal) < 0.01 ? (
                  <CheckIcon sx={{ color: '#4caf50', ml: 1 }} />
                ) : (
                  <WarningIcon sx={{ color: '#f44336', ml: 1 }} />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
                    Detalle de Cálculos
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: '#ffffff' }}>Total Facturado:</TableCell>
                        <TableCell align="right" sx={{ color: '#4caf50' }}>
                          ${totales.totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#ffffff' }}>Total Cobrado:</TableCell>
                        <TableCell align="right" sx={{ color: '#2196f3' }}>
                          ${totales.totalCobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 'bold' }}>Diferencia Inicial:</TableCell>
                        <TableCell align="right" sx={{ 
                          color: totales.diferenciaTotal >= 0 ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          ${totales.diferenciaTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: '#ffffff' }}>Total Ajustes:</TableCell>
                        <TableCell align="right" sx={{ color: '#ff9800' }}>
                          ${totales.totalAjustes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ borderTop: '2px solid #666' }}>
                        <TableCell sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.1em' }}>
                          Balance Final:
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          color: Math.abs(totales.balanceFinal) < 0.01 ? '#4caf50' : '#f44336',
                          fontWeight: 'bold',
                          fontSize: '1.1em'
                        }}>
                          ${totales.balanceFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
                    Estado del Cierre
                  </Typography>
                  <Box sx={{ p: 2, border: '1px solid #666', borderRadius: 1 }}>
                    {Math.abs(totales.balanceFinal) < 0.01 ? (
                      <Box display="flex" alignItems="center" sx={{ color: '#4caf50' }}>
                        <CheckIcon sx={{ mr: 1 }} />
                        <Typography variant="body1" fontWeight="bold">
                          Cierre Cuadrado - Balance: $0.00
                        </Typography>
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" sx={{ color: '#f44336' }}>
                        <WarningIcon sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {Math.abs(totales.balanceFinal) <= 1000 ? 'Diferencia Menor' : 'Diferencia Grave'}
                          </Typography>
                          <Typography variant="body2">
                            Diferencia: ${Math.abs(totales.balanceFinal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  {justificaciones.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: '#ffffff' }}>
                        Resumen de Justificaciones
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        {justificaciones.length} justificaciones registradas
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        Total ajustado: ${totales.totalAjustes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Box>

      {/* DIÁLOGO DE CONFIRMACIÓN PARA ELIMINAR JUSTIFICACIÓN */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar esta justificación? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
          <Button onClick={confirmDeleteJustificacion} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
