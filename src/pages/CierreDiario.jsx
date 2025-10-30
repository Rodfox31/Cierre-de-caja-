import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Typography,
  Grid,
  TextField
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Store as StoreIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/es';
import { axiosWithFallback } from '../config';

moment.locale('es');

// Función para formatear moneda
function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function CierreDiario() {
  const theme = useTheme();
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedDay, setSelectedDay] = useState(moment().date());
  const [selectedTienda, setSelectedTienda] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [mediosPagoData, setMediosPagoData] = useState([]);
  const [facturadoValues, setFacturadoValues] = useState({});

  // Generar años (últimos 5 años)
  const years = useMemo(() => {
    const currentYear = moment().year();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Nombres de meses
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Generar días del mes seleccionado
  const daysInMonth = useMemo(() => {
    const daysCount = moment().year(selectedYear).month(selectedMonth).daysInMonth();
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  }, [selectedYear, selectedMonth]);

  const [mediosPagoConfig, setMediosPagoConfig] = useState([]);

  // Cargar configuración (tiendas y medios de pago)
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosWithFallback('/localStorage');
        const configData = res.data;
        setTiendas(configData.tiendas || []);
        setMediosPagoConfig(configData.medios_pago || []);
      } catch (err) {
        console.error('Error al cargar configuración:', err);
      }
    })();
  }, []);

  // Cargar cierres cuando cambien los filtros o la configuración
  useEffect(() => {
    if (mediosPagoConfig.length > 0) {
      fetchCierres();
    }
  }, [selectedYear, selectedMonth, selectedDay, selectedTienda, mediosPagoConfig]);

  const fetchCierres = async () => {
    setLoading(true);
    try {
      const response = await axiosWithFallback('/api/cierres-completo');
      let allCierres = response.data;

      // Filtrar por fecha específica
      allCierres = allCierres.filter(cierre => {
        if (!cierre.fecha) return false;
        const cierreFecha = moment(cierre.fecha);
        return cierreFecha.year() === selectedYear && 
               cierreFecha.month() === selectedMonth &&
               cierreFecha.date() === selectedDay;
      });

      // Filtrar por tienda si está seleccionada
      if (selectedTienda) {
        allCierres = allCierres.filter(cierre => cierre.tienda === selectedTienda);
      }

      setCierres(allCierres);
      calcularMediosPago(allCierres);
    } catch (error) {
      console.error('Error al cargar cierres:', error);
      setSnackbar({ open: true, message: 'Error al cargar los datos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales por medio de pago usando la configuración
  const calcularMediosPago = (cierresData) => {
    // Usar los medios de pago de la configuración
    const mediosMap = {};
    
    // Inicializar con todos los medios de pago configurados
    mediosPagoConfig.forEach(medio => {
      mediosMap[medio] = {
        medio: medio,
        cobrado: 0
      };
    });

    // Sumar los valores de los cierres
    cierresData.forEach(cierre => {
      if (!cierre.medios_pago) return;

      const medios = typeof cierre.medios_pago === 'string' 
        ? JSON.parse(cierre.medios_pago) 
        : cierre.medios_pago;

      if (Array.isArray(medios)) {
        medios.forEach(medio => {
          const nombre = medio.medio || 'Sin nombre';
          if (mediosMap[nombre]) {
            mediosMap[nombre].cobrado += Number(medio.cobrado) || 0;
          }
        });
      }
    });

    // Convertir a array manteniendo el orden de la configuración
    const mediosArray = mediosPagoConfig.map(medio => mediosMap[medio]);
    setMediosPagoData(mediosArray);
  };

  const handleFacturadoChange = (medioNombre, value) => {
    setFacturadoValues(prev => ({
      ...prev,
      [medioNombre]: value
    }));
  };

  const calcularDiferencia = (medio) => {
    const facturado = parseFloat(facturadoValues[medio.medio]) || 0;
    return medio.cobrado - facturado;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
        {/* Controles superiores */}
        <Paper
          elevation={2}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            mb: 3,
            p: 2,
            borderRadius: 1,
            backgroundColor: theme.palette.background.paper,
            borderLeft: `4px solid ${theme.palette.primary.main}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Filtro de Año */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRangeIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>Año</InputLabel>
                <Select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)} 
                  label="Año"
                  sx={{ height: 32, fontSize: '0.75rem' }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Filtro de Mes */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Mes</InputLabel>
                <Select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)} 
                  label="Mes"
                  sx={{ height: 32, fontSize: '0.75rem' }}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Filtro de Día */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Día</InputLabel>
              <Select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)} 
                label="Día"
                sx={{ height: 32, fontSize: '0.75rem' }}
              >
                {daysInMonth.map((day) => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Filtro de Tienda */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StoreIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Tienda</InputLabel>
                <Select
                  value={selectedTienda}
                  onChange={(e) => setSelectedTienda(e.target.value)}
                  label="Tienda"
                  sx={{ height: 32, fontSize: '0.75rem' }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {tiendas.map(tienda => (
                    <MenuItem key={tienda} value={tienda}>{tienda}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* Contenedor Grid para tabla y calendario */}
        <Grid container spacing={3}>
          {/* Tabla de Medios de Pago - Izquierda */}
          <Grid item xs={12} md={8}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  border: `1px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`,
                  borderRadius: 1
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ 
                      bgcolor: theme.palette.mode === 'light' ? '#f3f4f6' : '#3a3a3a'
                    }}>
                      <TableCell sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.875rem',
                        color: theme.palette.text.primary,
                        borderBottom: `2px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`
                      }}>
                        Medio de Pago
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.875rem',
                        color: theme.palette.text.primary,
                        borderBottom: `2px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`
                      }}>
                        Cobrado
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.875rem',
                        color: theme.palette.text.primary,
                        borderBottom: `2px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`
                      }}>
                        Facturado
                      </TableCell>
                      <TableCell align="right" sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.875rem',
                        color: theme.palette.text.primary,
                        borderBottom: `2px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`
                      }}>
                        Diferencia
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mediosPagoData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No hay datos para la fecha seleccionada
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      mediosPagoData.map((medio, index) => {
                        const diferencia = calcularDiferencia(medio);
                        return (
                          <TableRow 
                            key={index} 
                            hover
                            sx={{
                              bgcolor: theme.palette.custom?.tableRow,
                              '&:hover': {
                                bgcolor: theme.palette.custom?.tableRowHover
                              },
                              borderBottom: `1px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`
                            }}
                          >
                            <TableCell sx={{ 
                              fontWeight: 'bold',
                              color: theme.palette.text.primary,
                              py: 0.75
                            }}>
                              {medio.medio}
                            </TableCell>
                            <TableCell align="right" sx={{ 
                              fontFamily: 'monospace', 
                              fontWeight: 'bold',
                              color: theme.palette.text.primary,
                              py: 0.75
                            }}>
                              {formatCurrency(medio.cobrado)}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 0.75 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="0.00"
                                value={facturadoValues[medio.medio] || ''}
                                onChange={(e) => handleFacturadoChange(medio.medio, e.target.value)}
                                InputProps={{
                                  sx: {
                                    fontSize: '0.9rem',
                                    height: 36,
                                    backgroundColor: alpha(theme.palette.custom?.tableRow || theme.palette.background.default, 0.5),
                                    borderRadius: 1.5,
                                    transition: 'all 0.2s ease',
                                    '& fieldset': { 
                                      borderColor: theme.palette.custom?.tableBorder || theme.palette.divider,
                                      transition: 'all 0.2s ease' 
                                    },
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.custom?.tableRow || theme.palette.background.default, 0.8),
                                      '& fieldset': { borderColor: theme.palette.info.main }
                                    },
                                    '&.Mui-focused': {
                                      backgroundColor: alpha(theme.palette.custom?.tableRow || theme.palette.background.default, 0.9),
                                      boxShadow: `0 0 0 2px ${alpha(theme.palette.info.main, 0.2)}`,
                                      '& fieldset': { borderColor: theme.palette.info.main, borderWidth: 2 }
                                    }
                                  }
                                }}
                                sx={{ 
                                  '& .MuiInputBase-input': { 
                                    color: theme.palette.text.primary, 
                                    fontFamily: 'monospace',
                                    textAlign: 'right'
                                  }
                                }}
                                onInput={(e) => e.target.value = e.target.value.replace(/[^0-9.,]/g, "")}
                              />
                            </TableCell>
                            <TableCell 
                              align="right" 
                              sx={{ 
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                color: diferencia === 0 ? theme.palette.text.primary : 
                                       diferencia > 0 ? theme.palette.positive?.main || '#4caf50' : 
                                       theme.palette.negative?.main || '#f44336',
                                py: 0.75
                              }}
                            >
                              {formatCurrency(diferencia)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Grid>

          {/* Calendario Placeholder - Derecha */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                minHeight: 400,
                border: `1px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`,
                borderRadius: 1,
                bgcolor: theme.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                Calendario
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
                Vista de calendario mensual
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 2 }}>
                Próximamente...
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CierreDiario;
