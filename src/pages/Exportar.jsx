import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as TableChartIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import moment from 'moment';

export default function Exportar() {
  const theme = useTheme();
  
  // Estados para los datos
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para filtros
  const [fechaDesde, setFechaDesde] = useState(moment().subtract(30, 'days').format('YYYY-MM-DD'));
  const [fechaHasta, setFechaHasta] = useState(moment().format('YYYY-MM-DD'));
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');

  // Cargar configuración al montar el componente
  useEffect(() => {
    fetchConfiguracion();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/localStorage`);
      setConfiguracion(response.data);
    } catch (err) {
      console.error('Error cargando configuración:', err);
      setError('Error al cargar la configuración');
    }
  };

  const fetchCierres = async (params = {}) => {
    const queryParams = {
      fechaDesde: moment(fechaDesde).format('DD-MM-YYYY'),
      fechaHasta: moment(fechaHasta).format('DD-MM-YYYY'),
      ...params
    };
    if (tiendaSeleccionada) queryParams.tienda = tiendaSeleccionada;
    if (usuarioSeleccionado) queryParams.usuario = usuarioSeleccionado;

    const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`, { params: queryParams });
    return response.data;
  };

  const downloadFile = (content, filename, type = 'text/csv') => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // INFORME 1: Resumen General de Cierres
  const generarResumenGeneral = async () => {
    setLoading(true);
    try {
      const cierres = await fetchCierres();
      
      const headers = ['ID', 'Fecha', 'Tienda', 'Usuario', 'Gran Diferencia', 'Balance sin Justificar', 'Responsable', 'Estado'];
      const csvContent = [
        headers.join(','),
        ...cierres.map(c => {
          const estado = Math.abs(c.grand_difference_total) === 0 ? 'OK' : 
                        Math.abs(c.grand_difference_total) < 1000 ? 'Diferencia Menor' : 'Diferencia Grave';
          return [
            c.id,
            c.fecha,
            c.tienda,
            c.usuario,
            c.grand_difference_total || 0,
            c.balance_sin_justificar || 0,
            c.responsable || '',
            estado
          ].join(',');
        })
      ].join('\n');

      downloadFile(csvContent, `resumen_general_${moment().format('YYYY-MM-DD')}.csv`);
    } catch (err) {
      setError('Error generando informe de resumen general');
    } finally {
      setLoading(false);
    }
  };

  // INFORME 2: Detalle de Medios de Pago
  const generarDetalleMediosPago = async () => {
    setLoading(true);
    try {
      const cierres = await fetchCierres();
      
      const headers = ['ID_Cierre', 'Fecha', 'Tienda', 'Usuario', 'Medio_Pago', 'Facturado', 'Cobrado', 'Diferencia'];
      const rows = [];
      
      cierres.forEach(cierre => {
        if (cierre.medios_pago && cierre.medios_pago.length > 0) {
          cierre.medios_pago.forEach(medio => {
            rows.push([
              cierre.id,
              cierre.fecha,
              cierre.tienda,
              cierre.usuario,
              medio.medio,
              medio.facturado || 0,
              medio.cobrado || 0,
              medio.differenceVal || 0
            ].join(','));
          });
        }
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadFile(csvContent, `detalle_medios_pago_${moment().format('YYYY-MM-DD')}.csv`);
    } catch (err) {
      setError('Error generando informe de medios de pago');
    } finally {
      setLoading(false);
    }
  };

  // INFORME 3: Justificaciones Completas
  const generarJustificaciones = async () => {
    setLoading(true);
    try {
      const cierres = await fetchCierres();
      
      const headers = ['ID_Cierre', 'Fecha_Cierre', 'Tienda', 'Usuario', 'ID_Justificacion', 'Fecha_Justificacion', 'Orden', 'Cliente', 'Monto_Diferencia', 'Ajuste', 'Motivo'];
      const rows = [];
      
      for (const cierre of cierres) {
        if (cierre.justificaciones && cierre.justificaciones.length > 0) {
          cierre.justificaciones.forEach(just => {
            rows.push([
              cierre.id,
              cierre.fecha,
              cierre.tienda,
              cierre.usuario,
              just.id,
              just.fecha,
              just.orden || '',
              just.cliente || '',
              just.monto_dif || 0,
              just.ajuste || 0,
              just.motivo || ''
            ].join(','));
          });
        }
      }

      const csvContent = [headers.join(','), ...rows].join('\n');
      downloadFile(csvContent, `justificaciones_completas_${moment().format('YYYY-MM-DD')}.csv`);
    } catch (err) {
      setError('Error generando informe de justificaciones');
    } finally {
      setLoading(false);
    }
  };

  // INFORME 4: Estadísticas por Tienda
  const generarEstadisticasTienda = async () => {
    setLoading(true);
    try {
      const cierres = await fetchCierres();
      
      const estadisticas = {};
      
      cierres.forEach(cierre => {
        if (!estadisticas[cierre.tienda]) {
          estadisticas[cierre.tienda] = {
            total_cierres: 0,
            cierres_ok: 0,
            diferencias_menores: 0,
            diferencias_graves: 0,
            suma_diferencias: 0,
            total_justificaciones: 0
          };
        }
        
        const stats = estadisticas[cierre.tienda];
        stats.total_cierres++;
        stats.suma_diferencias += Math.abs(cierre.grand_difference_total || 0);
        stats.total_justificaciones += cierre.justificaciones ? cierre.justificaciones.length : 0;
        
        const absDiff = Math.abs(cierre.grand_difference_total || 0);
        if (absDiff === 0) stats.cierres_ok++;
        else if (absDiff < 1000) stats.diferencias_menores++;
        else stats.diferencias_graves++;
      });

      const headers = ['Tienda', 'Total_Cierres', 'Cierres_OK', 'Diferencias_Menores', 'Diferencias_Graves', 'Suma_Diferencias', 'Total_Justificaciones'];
      const csvContent = [
        headers.join(','),
        ...Object.entries(estadisticas).map(([tienda, stats]) => [
          tienda,
          stats.total_cierres,
          stats.cierres_ok,
          stats.diferencias_menores,
          stats.diferencias_graves,
          stats.suma_diferencias.toFixed(2),
          stats.total_justificaciones
        ].join(','))
      ].join('\n');

      downloadFile(csvContent, `estadisticas_tienda_${moment().format('YYYY-MM-DD')}.csv`);
    } catch (err) {
      setError('Error generando estadísticas por tienda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3} sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          📊 Generador de Informes
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filtros con Dark Mode */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[900], color: 'white' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Filtros para Informes
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Fecha Desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'white' },
                    '&:hover fieldset': { borderColor: 'white' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                    color: 'white'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Fecha Hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'white' },
                    '&:hover fieldset': { borderColor: 'white' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                    color: 'white'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'white' }}>Tienda</InputLabel>
                <Select
                  value={tiendaSeleccionada}
                  onChange={(e) => setTiendaSeleccionada(e.target.value)}
                  label="Tienda"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '& .MuiSvgIcon-root': { color: 'white' }
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {configuracion?.tiendas?.map((tienda) => (
                    <MenuItem key={tienda} value={tienda}>{tienda}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Usuario"
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                placeholder="Filtrar por usuario"
                size="small"
                sx={{
                  '& .MuiInputLabel-root': { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'white' },
                    '&:hover fieldset': { borderColor: 'white' },
                    '&.Mui-focused fieldset': { borderColor: 'white' },
                    color: 'white'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Informes Disponibles */}
        <Typography variant="h6" gutterBottom>
          Informes Disponibles
        </Typography>
        
        <Grid container spacing={3}>
          {/* Informe 1: Resumen General */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TableChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Resumen General de Cierres</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Exporta un resumen con ID, fecha, tienda, usuario, diferencias y estado de cada cierre.
                </Typography>
                <Button
                  variant="contained"
                  onClick={generarResumenGeneral}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  fullWidth
                >
                  Descargar CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Informe 2: Detalle Medios de Pago */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssessmentIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Detalle de Medios de Pago</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Detalle completo de todos los medios de pago por cierre con facturado, cobrado y diferencias.
                </Typography>
                <Button
                  variant="contained"
                  onClick={generarDetalleMediosPago}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  fullWidth
                  color="success"
                >
                  Descargar CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Informe 3: Justificaciones */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ReceiptIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">Justificaciones Completas</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Todas las justificaciones registradas con detalles de orden, cliente, monto y motivo.
                </Typography>
                <Button
                  variant="contained"
                  onClick={generarJustificaciones}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  fullWidth
                  color="warning"
                >
                  Descargar CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Informe 4: Estadísticas por Tienda */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssessmentIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="h6">Estadísticas por Tienda</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Resumen estadístico por tienda: total de cierres, diferencias, justificaciones.
                </Typography>
                <Button
                  variant="contained"
                  onClick={generarEstadisticasTienda}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                  fullWidth
                  color="info"
                >
                  Descargar CSV
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Información adicional */}
        <Box mt={4}>
          <Typography variant="body2" color="text.secondary">
            <strong>Nota:</strong> Los informes se generan en base a los filtros seleccionados. 
            Los archivos CSV pueden abrirse en Excel u otras hojas de cálculo.
            El período por defecto es de los últimos 30 días.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
