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
  TextField,
  Button
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
import { useAuth } from '../contexts/AuthContext';

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

// Función para normalizar números en formato argentino
function normalizeNumber(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const normalized = value.toString()
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(normalized) || 0;
}

function CierreDiario() {
  const theme = useTheme();
  const { currentUser } = useAuth();
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
  const [cobradoValues, setCobradoValues] = useState({}); // Nuevo: valores de cobrado editables
  const [calendarioData, setCalendarioData] = useState({}); // Nuevo: datos para el calendario
  const [comentarioDiario, setComentarioDiario] = useState(''); // Comentario del cierre diario

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

  // NUEVO: Cargar datos del mes completo para el calendario
  useEffect(() => {
    if (mediosPagoConfig.length > 0) {
      fetchCalendarioData();
    }
  }, [selectedYear, selectedMonth, selectedTienda, mediosPagoConfig]);

  const fetchCierres = async () => {
    setLoading(true);
    try {
      const response = await axiosWithFallback('/api/cierres-completo');
      let allCierres = response.data;

      // Filtrar por fecha específica - FORMATO DD/MM/YYYY
      allCierres = allCierres.filter(cierre => {
        if (!cierre.fecha) return false;
        const cierreFecha = moment(cierre.fecha, 'DD/MM/YYYY');
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

  // NUEVO: Obtener datos de todo el mes para el calendario
  const fetchCalendarioData = async () => {
    try {
      const response = await axiosWithFallback('/api/cierres-completo');
      let allCierres = response.data;

      // Filtrar por mes y año - FORMATO DD/MM/YYYY
      allCierres = allCierres.filter(cierre => {
        if (!cierre.fecha) return false;
        const cierreFecha = moment(cierre.fecha, 'DD/MM/YYYY');
        return cierreFecha.year() === selectedYear && 
               cierreFecha.month() === selectedMonth;
      });

      // Filtrar por tienda si está seleccionada
      if (selectedTienda) {
        allCierres = allCierres.filter(cierre => cierre.tienda === selectedTienda);
      }

      // Agrupar por día
      const datosPorDia = {};
      allCierres.forEach(cierre => {
        const dia = moment(cierre.fecha, 'DD/MM/YYYY').date();
        if (!datosPorDia[dia]) {
          datosPorDia[dia] = {
            totalCobrado: 0,
            totalFacturado: 0,
            diferencia: 0,
            cierresCount: 0
          };
        }

        // Procesar medios de pago
        if (cierre.medios_pago) {
          const medios = Array.isArray(cierre.medios_pago) 
            ? cierre.medios_pago 
            : JSON.parse(cierre.medios_pago);

          if (Array.isArray(medios)) {
            medios.forEach(medio => {
              // Limpiar el formato de cobrado (ej: "71.500,00" -> 71500.00)
              let cobrado = 0;
              if (typeof medio.cobrado === 'string') {
                cobrado = parseFloat(medio.cobrado.replace(/\./g, '').replace(',', '.')) || 0;
              } else {
                cobrado = Number(medio.cobrado) || 0;
              }
              
              datosPorDia[dia].totalCobrado += cobrado;
              datosPorDia[dia].totalFacturado += Number(medio.facturado) || 0;
            });
          }
        }
        datosPorDia[dia].cierresCount++;
      });

      // Calcular diferencias
      Object.keys(datosPorDia).forEach(dia => {
        datosPorDia[dia].diferencia = 
          datosPorDia[dia].totalCobrado - datosPorDia[dia].totalFacturado;
      });

      setCalendarioData(datosPorDia);
    } catch (error) {
      console.error('Error al cargar datos del calendario:', error);
    }
  };

  // MODIFICADO: Calcular totales por medio de pago - cobrado viene de la DB (Sistema)
  const calcularMediosPago = (cierresData) => {
    // Usar los medios de pago de la configuración
    const mediosMap = {};
    
    // Inicializar con todos los medios de pago configurados
    mediosPagoConfig.forEach(medio => {
      mediosMap[medio] = {
        medio: medio,
        cobrado: 0 // cobrado = lo que viene del sistema (DB)
      };
    });

    // Sumar los valores de "cobrado" de los cierres (que es lo del sistema Sieben)
    cierresData.forEach(cierre => {
      if (!cierre.medios_pago) return;

      const medios = typeof cierre.medios_pago === 'string' 
        ? JSON.parse(cierre.medios_pago) 
        : cierre.medios_pago;

      if (Array.isArray(medios)) {
        medios.forEach(medio => {
          const nombre = medio.medio || 'Sin nombre';
          if (mediosMap[nombre]) {
            // Limpiar el formato de cobrado (ej: "71.500,00" -> 71500.00)
            let cobrado = 0;
            if (typeof medio.cobrado === 'string') {
              cobrado = parseFloat(medio.cobrado.replace(/\./g, '').replace(',', '.')) || 0;
            } else {
              cobrado = Number(medio.cobrado) || 0;
            }
            mediosMap[nombre].cobrado += cobrado;
          }
        });
      }
    });

    // Convertir a array manteniendo el orden de la configuración
    const mediosArray = mediosPagoConfig.map(medio => mediosMap[medio]);
    setMediosPagoData(mediosArray);

    // Actualizar los valores de cobrado (sistema) para mostrar en la columna de solo lectura
    const nuevosCobradoValuesDB = {};
    mediosArray.forEach(medio => {
      if (medio.cobrado > 0) {
        nuevosCobradoValuesDB[medio.medio] = medio.cobrado.toFixed(2);
      }
    });
    setFacturadoValues(nuevosCobradoValuesDB); // facturadoValues guarda lo del sistema

    // NO pre-llenar cobradoValues - dejar en blanco para que el usuario complete (lo REAL)
    setCobradoValues({});
  };

  const handleFacturadoChange = (medioNombre, value) => {
    setFacturadoValues(prev => ({
      ...prev,
      [medioNombre]: value
    }));
  };

  const handleCobradoChange = (medioNombre, value) => {
    const cleanValue = value.replace(/[^\d.,]/g, '');
    setCobradoValues(prev => ({
      ...prev,
      [medioNombre]: cleanValue
    }));
  };

  const calcularDiferencia = (medio) => {
    const facturadoReal = normalizeNumber(cobradoValues[medio.medio]);
    const cobradoSistema = parseFloat(facturadoValues[medio.medio]) || 0;
    return facturadoReal - cobradoSistema;
  };

  // Calcular totales
  const calcularTotales = () => {
    let totalFacturado = 0;
    let totalCobrado = 0;
    let totalDiferencia = 0;

    mediosPagoData.forEach(medio => {
      const facturado = normalizeNumber(cobradoValues[medio.medio]);
      const cobrado = parseFloat(facturadoValues[medio.medio]) || 0;
      const diferencia = facturado - cobrado;

      totalFacturado += facturado;
      totalCobrado += cobrado;
      totalDiferencia += diferencia;
    });

    return {
      totalFacturado,
      totalCobrado,
      totalDiferencia
    };
  };

  const handleGuardarCierreDiario = async () => {
    try {
      // Validar que hay un usuario logueado
      if (!currentUser || !currentUser.username) {
        setSnackbar({ 
          open: true, 
          message: 'Error: No hay usuario autenticado', 
          severity: 'error' 
        });
        return;
      }

      // Construir el array de medios de pago con la información completa
      const mediosPagoParaGuardar = mediosPagoData.map(medio => {
        const facturadoReal = parseFloat(cobradoValues[medio.medio]) || 0; // Lo que el usuario ingresó (REAL)
        const cobradoSistema = parseFloat(facturadoValues[medio.medio]) || 0; // Lo de la DB (Sistema)
        const diferencia = facturadoReal - cobradoSistema;
        
        // IMPORTANTE: En la DB, "facturado" es lo REAL y "cobrado" es lo del SISTEMA
        return {
          medio: medio.medio,
          facturado: facturadoReal,  // Lo que el usuario ingresó manualmente (REAL del cierre)
          cobrado: cobradoSistema,   // Lo que viene del sistema (esperado)
          diferencia: diferencia
        };
      });

      // Formatear la fecha en DD/MM/YYYY
      const fechaFormateada = moment()
        .year(selectedYear)
        .month(selectedMonth)
        .date(selectedDay)
        .format('DD/MM/YYYY');

      const datosParaGuardar = {
        fecha: fechaFormateada,
        usuario: currentUser.username,
        tienda: selectedTienda || 'Todas',
        medios_pago: mediosPagoParaGuardar,
        comentarios: comentarioDiario || ''
      };

      console.log('Guardando cierre diario:', datosParaGuardar);

      // Enviar al backend
      const response = await axiosWithFallback('/api/cierres-diarios', {
        method: 'POST',
        data: datosParaGuardar,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSnackbar({ 
          open: true, 
          message: '✓ Cierre diario guardado exitosamente', 
          severity: 'success' 
        });
        
        // Limpiar el comentario después de guardar
        setComentarioDiario('');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar cierre diario:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error al guardar el cierre diario: ' + (error.message || 'Error desconocido'), 
        severity: 'error' 
      });
    }
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
                  onChange={(e) => setSelectedYear(Number(e.target.value))} 
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
                  onChange={(e) => setSelectedMonth(Number(e.target.value))} 
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
                onChange={(e) => setSelectedDay(Number(e.target.value))} 
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
                        Facturado
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
                            <TableCell align="right" sx={{ py: 0.75 }}>
                              <TextField
                                size="small"
                                placeholder="0,00"
                                value={cobradoValues[medio.medio] || ''}
                                onChange={(e) => handleCobradoChange(medio.medio, e.target.value)}
                                InputProps={{
                                  sx: {
                                    fontSize: '0.85rem',
                                    height: 32,
                                    width: 140,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: 1.5,
                                    transition: 'all 0.2s ease',
                                    '& fieldset': { 
                                      borderColor: theme.palette.primary.main,
                                      borderWidth: 2,
                                      transition: 'all 0.2s ease' 
                                    },
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                      '& fieldset': { borderColor: theme.palette.primary.dark }
                                    },
                                    '&.Mui-focused': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                                      '& fieldset': { borderColor: theme.palette.primary.dark, borderWidth: 2 }
                                    }
                                  }
                                }}
                                sx={{ 
                                  '& .MuiInputBase-input': { 
                                    color: theme.palette.text.primary, 
                                    fontFamily: 'monospace',
                                    textAlign: 'right',
                                    fontWeight: 'bold'
                                  }
                                }}
                                onInput={(e) => e.target.value = e.target.value.replace(/[^0-9.,]/g, "")}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 0.75 }}>
                              <Box sx={{
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                border: `1px solid ${theme.palette.divider}`,
                                display: 'inline-block',
                                minWidth: 120
                              }}>
                                <Typography sx={{ 
                                  fontFamily: 'monospace',
                                  fontWeight: 'bold',
                                  fontSize: '0.9rem',
                                  color: theme.palette.text.primary
                                }}>
                                  {formatCurrency(medio.cobrado)}
                                </Typography>
                              </Box>
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

                    {/* Fila de Totales */}
                    {mediosPagoData.length > 0 && (() => {
                      const totales = calcularTotales();
                      return (
                        <TableRow 
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            borderTop: `2px solid ${theme.palette.primary.main}`,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.12)
                            }
                          }}
                        >
                          <TableCell sx={{ 
                            fontWeight: 'bold',
                            color: theme.palette.primary.main,
                            py: 1.5,
                            fontSize: '1rem'
                          }}>
                            TOTALES
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Typography sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: theme.palette.primary.main
                            }}>
                              {formatCurrency(totales.totalFacturado)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Typography sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: theme.palette.primary.main
                            }}>
                              {formatCurrency(totales.totalCobrado)}
                            </Typography>
                          </TableCell>
                          <TableCell 
                            align="right" 
                            sx={{ 
                              py: 1.5
                            }}
                          >
                            <Typography sx={{ 
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              color: totales.totalDiferencia === 0 ? theme.palette.text.primary : 
                                     totales.totalDiferencia > 0 ? theme.palette.positive?.main || '#4caf50' : 
                                     theme.palette.negative?.main || '#f44336'
                            }}>
                              {formatCurrency(totales.totalDiferencia)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Box de Comentarios del Cierre Diario */}
            {!loading && (
              <Box sx={{ mt: 3 }}>
                <Paper 
                  elevation={2}
                  sx={{ 
                    p: 3,
                    border: `1px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: theme.palette.background.paper
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    📝 Comentarios del Cierre Diario
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Ingrese comentarios sobre el cierre del día..."
                    value={comentarioDiario}
                    onChange={(e) => setComentarioDiario(e.target.value)}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        '&:hover fieldset': {
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                        }
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      alignSelf: 'center',
                      flex: 1
                    }}>
                      {comentarioDiario.length} caracteres
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setComentarioDiario('')}
                      disabled={!comentarioDiario}
                      sx={{ minWidth: 100 }}
                    >
                      Limpiar
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleGuardarCierreDiario}
                      disabled={!comentarioDiario && mediosPagoData.length === 0}
                      sx={{ 
                        minWidth: 150,
                        fontWeight: 'bold'
                      }}
                    >
                      💾 Guardar Cierre Diario
                    </Button>
                  </Box>
                </Paper>
              </Box>
            )}
          </Grid>

          {/* Calendario Grid - Derecha */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                height: '100%',
                minHeight: 400,
                border: `1px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`,
                borderRadius: 1,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <CalendarTodayIcon /> 
                {months[selectedMonth]} {selectedYear}
              </Typography>
              
              {/* Días de la semana */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 0.5,
                mb: 1
              }}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
                  <Box key={dia} sx={{ 
                    textAlign: 'center', 
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    py: 0.5
                  }}>
                    {dia}
                  </Box>
                ))}
              </Box>

              {/* Grid del calendario */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 0.5,
              }}>
                {(() => {
                  // Calcular días vacíos al inicio
                  const primerDia = moment().year(selectedYear).month(selectedMonth).date(1).day();
                  const diasVacios = Array(primerDia).fill(null);
                  
                  return [...diasVacios, ...daysInMonth].map((dia, index) => {
                    if (dia === null) {
                      return <Box key={`empty-${index}`} />;
                    }
                    
                    const datos = calendarioData[dia];
                    const isSelected = dia === selectedDay;
                    const isToday = dia === moment().date() && 
                                   selectedMonth === moment().month() && 
                                   selectedYear === moment().year();
                    
                    return (
                      <Paper
                        key={dia}
                        elevation={isSelected ? 3 : 0}
                        sx={{
                          aspectRatio: '1',
                          p: 0.5,
                          cursor: 'pointer',
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.2) : 
                                  isToday ? alpha(theme.palette.info.main, 0.1) :
                                  datos ? alpha(theme.palette.success.main, 0.05) : 'transparent',
                          border: `2px solid ${
                            isSelected ? theme.palette.primary.main : 
                            isToday ? theme.palette.info.main :
                            datos ? theme.palette.divider : 
                            'transparent'
                          }`,
                          borderRadius: 1,
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          overflow: 'hidden',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            transform: 'scale(1.05)',
                            zIndex: 10,
                            boxShadow: 2
                          }
                        }}
                        onClick={() => setSelectedDay(dia)}
                      >
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: isSelected || isToday ? 'bold' : 'normal',
                            fontSize: '0.7rem',
                            color: isSelected ? theme.palette.primary.main : 
                                   isToday ? theme.palette.info.main :
                                   theme.palette.text.primary
                          }}
                        >
                          {dia}
                        </Typography>
                        
                        {datos && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 0.2,
                            alignItems: 'center'
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                                color: datos.diferencia === 0 ? 'text.secondary' :
                                       datos.diferencia > 0 ? theme.palette.success.main :
                                       theme.palette.error.main,
                              }}
                            >
                              {datos.diferencia > 0 ? '+' : ''}
                              {Math.abs(datos.diferencia) > 999 
                                ? `${(datos.diferencia / 1000).toFixed(0)}k`
                                : datos.diferencia.toFixed(0)
                              }
                            </Typography>
                            <Box sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%',
                              bgcolor: datos.cierresCount > 1 ? theme.palette.warning.main : theme.palette.success.main
                            }} />
                          </Box>
                        )}
                      </Paper>
                    );
                  });
                })()}
              </Box>

              {/* Leyenda */}
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
                  <Box component="span" sx={{ 
                    display: 'inline-block', 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.success.main,
                    mr: 0.5
                  }} />
                  1 cierre
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem' }}>
                  <Box component="span" sx={{ 
                    display: 'inline-block', 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.warning.main,
                    mr: 0.5
                  }} />
                  Múltiples cierres
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Resumen Detallado del Día - Tabla Comprimida */}
        {!loading && cierres.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                border: `2px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.03)
              }}
            >
              <Typography variant="h6" sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: theme.palette.primary.main,
                fontWeight: 'bold'
              }}>
                📋 Resumen del Día {selectedDay}/{selectedMonth + 1}/{selectedYear}
              </Typography>

              <Grid container spacing={3}>
                {/* Tabla de Cajas - Izquierda */}
                <Grid item xs={12} md={7}>
                  <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                      border: `1px solid ${theme.palette.divider}`,
                      maxHeight: 600,
                      overflow: 'auto'
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.1), width: '25%' }}>
                            Usuario / Tienda
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.1), width: '15%' }}>
                            Hora
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.1), width: '60%' }}>
                            Medios de Pago
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cierres.map((cierre, index) => {
                          const medios = typeof cierre.medios_pago === 'string' 
                            ? JSON.parse(cierre.medios_pago) 
                            : cierre.medios_pago || [];
                          
                          // Filtrar solo medios con valores
                          const mediosConValor = medios.filter(m => 
                            (parseFloat(m.cobrado) || 0) !== 0 || (parseFloat(m.facturado) || 0) !== 0
                          );
                          
                          return (
                            <TableRow key={index} hover>
                              <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3 }}>
                                  {cierre.usuario}
                                </Typography>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                  {cierre.tienda}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top', py: 1.5 }}>
                                <Typography variant="caption">
                                  {cierre.hora || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {mediosConValor.map((medio, idx) => {
                                    const cobrado = parseFloat(medio.cobrado) || 0;
                                    const facturado = parseFloat(medio.facturado) || 0;
                                    const diferencia = cobrado - facturado;
                                    
                                    return (
                                      <Box 
                                        key={idx}
                                        sx={{ 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          px: 1,
                                          py: 0.3,
                                          border: `1px solid ${theme.palette.divider}`,
                                          borderRadius: 1,
                                          bgcolor: alpha(theme.palette.info.main, 0.03),
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                                          {medio.medio}:
                                        </Typography>
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            fontFamily: 'monospace',
                                            fontSize: '0.7rem',
                                            color: diferencia === 0 ? theme.palette.text.primary :
                                                   diferencia > 0 ? theme.palette.success.main :
                                                   theme.palette.error.main,
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia).replace('$', '')}
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Justificaciones - Derecha */}
                <Grid item xs={12} md={5}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      maxHeight: 600,
                      overflow: 'auto'
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: theme.palette.warning.main, fontSize: '0.875rem' }}>
                      📝 Justificaciones
                    </Typography>
                    {cierres.some(c => c.justificaciones && c.justificaciones.length > 0) ? (
                      <Box>
                        {cierres.map((cierre, index) => {
                          if (!cierre.justificaciones || cierre.justificaciones.length === 0) return null;
                          
                          return (
                            <Box 
                              key={index}
                              sx={{ 
                                mb: 1.5,
                                pb: 1,
                                borderBottom: index < cierres.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none'
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: theme.palette.primary.main, fontSize: '0.7rem' }}>
                                {cierre.usuario}
                              </Typography>
                              {cierre.justificaciones.map((just, jIdx) => (
                                <Box 
                                  key={jIdx}
                                  sx={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    mb: 0.5,
                                    p: 0.5,
                                    bgcolor: alpha(theme.palette.warning.main, 0.03),
                                    borderLeft: `2px solid ${theme.palette.warning.main}`,
                                    borderRadius: 0.5
                                  }}
                                >
                                  <Box sx={{ flex: 1, mr: 1 }}>
                                    <Typography variant="caption" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.3 }}>
                                      {just.descripcion}
                                    </Typography>
                                    {just.tipo && (
                                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.6rem' }}>
                                        {just.tipo}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: theme.palette.warning.dark, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                                    {formatCurrency(just.monto)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 3, display: 'block', fontSize: '0.75rem' }}>
                        Sin justificaciones
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
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
