import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Chip,
  Divider,
  useTheme,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Collapse,
  IconButton,
  Modal,
  Fade,
  Tabs,
  Tab,
  Tooltip,
  Stack,
  Avatar,
  alpha
} from '@mui/material';
import {
  Store as StoreIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  DateRange as DateRangeIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import moment from 'moment';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Función para formatear moneda
function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value || 0);
}

// Componente ExactValue
const ExactValue = React.memo(function ExactValue({ value, currency = true }) {
  const styles = {
    exactValue: {
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: '0.875rem',
      whiteSpace: 'nowrap',
    },
  };
  
  return (
    <Typography component="span" sx={styles.exactValue}>
      {currency ? formatCurrency(value) : value.toFixed(4)}
    </Typography>
  );
});

// Constantes para estados de cierre (copiadas de Diferencias.jsx)
const ESTADOS_CIERRE = {
  CORRECTO: {
    label: 'Correcto',
    icon: <CheckCircleIcon color="success" />,
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)',
  },
  DIFERENCIA_MENOR: {
    label: 'Diferencia menor',
    icon: <WarningIcon color="warning" />,
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.1)',
  },
  DIFERENCIA_GRAVE: {
    label: 'Diferencia grave',
    icon: <ErrorIcon color="error" />,
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
  },
};

// Función para obtener el estado de un cierre (copiada de Diferencias.jsx)
function getEstado(cierre) {
  const diffVal = Number(cierre.grand_difference_total) || 0;
  if (diffVal === 0) return ESTADOS_CIERRE.CORRECTO;
  if (diffVal > 10000 || diffVal < -10000) return ESTADOS_CIERRE.DIFERENCIA_GRAVE;
  return ESTADOS_CIERRE.DIFERENCIA_MENOR;
}

// Función para procesar valores numéricos con comas (copiada de Diferencias.jsx)
const processNumericValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '.').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Componente para la tarjeta de tienda
const TiendaCard = React.memo(function TiendaCard({ 
  tienda, 
  totalCierres, 
  cierresConErrores, 
  totalDiferencia,
  onClick 
}) {
  const theme = useTheme();
  const porcentajeErrores = totalCierres > 0 ? (cierresConErrores / totalCierres) * 100 : 0;
  
  // Colores más sutiles y sofisticados
  const getCardColor = () => {
    if (porcentajeErrores === 0) return '#2E3440'; // Gris azulado oscuro
    if (porcentajeErrores <= 20) return '#3B4252'; // Gris medio
    return '#434C5E'; // Gris más claro
  };

  const getAccentColor = () => {
    if (porcentajeErrores === 0) return '#A3BE8C'; // Verde sutil
    if (porcentajeErrores <= 20) return '#EBCB8B'; // Amarillo sutil
    return '#BF616A'; // Rojo sutil
  };

  const getTextColor = () => {
    if (porcentajeErrores === 0) return '#D8DEE9'; // Texto claro
    if (porcentajeErrores <= 20) return '#E5E9F0';
    return '#ECEFF4';
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: getCardColor(),
        border: `1px solid ${getAccentColor()}20`,
        borderRadius: 2,
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: `0 2px 8px ${getAccentColor()}15`,
          borderColor: `${getAccentColor()}40`,
        },
        height: '100px',
        minWidth: '220px',
        maxWidth: '300px',
      }}
      onClick={onClick}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: 1.5, 
        px: 2,
        height: '100%',
        '&:last-child': { pb: 1.5 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: getAccentColor(),
                mr: 1.5,
              }} 
            />
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500, 
                color: getTextColor(),
                fontSize: '0.95rem',
              }}
            >
              {tienda}
            </Typography>
          </Box>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: `${getTextColor()}80`,
              fontSize: '0.75rem',
            }}
          >
            {porcentajeErrores.toFixed(0)}%
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: getAccentColor(), 
                fontWeight: 600,
                fontSize: '0.9rem',
                lineHeight: 1,
              }}
            >
              {cierresConErrores}/{totalCierres}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: `${getTextColor()}60`,
                fontSize: '0.7rem',
              }}
            >
              errores
            </Typography>
          </Box>
          
          {totalDiferencia !== 0 && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: totalDiferencia > 0 ? '#BF616A' : '#A3BE8C',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  lineHeight: 1,
                }}
              >
                {totalDiferencia > 0 ? '+' : ''}{formatMoney(totalDiferencia)}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: `${getTextColor()}60`,
                  fontSize: '0.7rem',
                }}
              >
                diferencia
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

export default function ControlMensual() {
  const theme = useTheme();
  
  // Estados
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [tiendas, setTiendas] = useState([]);
  const [allCierres, setAllCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showWithoutErrors, setShowWithoutErrors] = useState(false);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [selectedCierres, setSelectedCierres] = useState([]);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCierresIds, setSelectedCierresIds] = useState(new Set());

  // Funciones auxiliares
  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Cargar configuración inicial (tiendas)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/localStorage`);
        setTiendas(res.data.tiendas || []);
      } catch (err) {
        console.error('Error al cargar configuración:', err);
        showSnackbar('Error al cargar la configuración inicial.', 'error');
      }
    };
    loadConfig();
  }, [showSnackbar]);

  // Función para cargar cierres del mes seleccionado
  const fetchCierres = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Calcular el primer y último día del mes seleccionado
      const firstDay = moment().year(selectedYear).month(selectedMonth).startOf('month');
      const lastDay = moment().year(selectedYear).month(selectedMonth).endOf('month');
      
      const pad = (n) => n.toString().padStart(2, '0');
      const fechaDesdeStr = `${pad(firstDay.date())}/${pad(firstDay.month() + 1)}/${firstDay.year()}`;
      const fechaHastaStr = `${pad(lastDay.date())}/${pad(lastDay.month() + 1)}/${lastDay.year()}`;
      
      const params = {
        fechaDesde: fechaDesdeStr,
        fechaHasta: fechaHastaStr,
      };

      const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`, { params });
      
      // Procesar los datos con la misma lógica que en Diferencias.jsx
      const mapped = response.data.map((cierre) => {
        let mediosPago = [];
        try {
          const mp = typeof cierre.medios_pago === 'string'
            ? JSON.parse(cierre.medios_pago)
            : cierre.medios_pago || {};
          
          mediosPago = Array.isArray(mp)
            ? mp.map(item => ({
                medio: item.medio,
                facturado: processNumericValue(item.facturado),
                cobrado: processNumericValue(item.cobrado),
                differenceVal: processNumericValue(item.differenceVal),
              }))
            : Object.keys(mp).map((key) => ({
                medio: key,
                facturado: processNumericValue(mp[key].facturado),
                cobrado: processNumericValue(mp[key].cobrado),
                differenceVal: processNumericValue(mp[key].differenceVal),
              }));
        } catch {
          mediosPago = [];
        }
        
        // Procesar fecha
        let fechaFormateada = cierre.fecha;
        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaFormateada)) {
          const [y, m, d] = fechaFormateada.split('-');
          fechaFormateada = `${pad(d)}/${pad(m)}/${y}`;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(fechaFormateada)) {
          const [d, m, y] = fechaFormateada.split('-');
          fechaFormateada = `${pad(d)}/${pad(m)}/${y}`;
        }
        
        return {
          ...cierre,
          fecha: moment(fechaFormateada, 'DD/MM/YYYY'),
          medios_pago: mediosPago,
          justificaciones: cierre.justificaciones || [],
        };
      });
      
      setAllCierres(mapped);
      showSnackbar('Datos cargados exitosamente.', 'success');
    } catch (err) {
      console.error('Error al cargar cierres:', err);
      setError('Error al cargar los datos. Intente nuevamente.');
      showSnackbar('Error al cargar los datos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, showSnackbar]);

  // Cargar datos cuando cambian mes/año
  useEffect(() => {
    if (tiendas.length > 0) {
      fetchCierres();
    }
  }, [selectedMonth, selectedYear, tiendas.length, fetchCierres]);

  // Calcular estadísticas por tienda
  const estadisticasPorTienda = useMemo(() => {
    return tiendas.map(tienda => {
      const cierresTienda = allCierres.filter(cierre => cierre.tienda === tienda);
      const totalCierres = cierresTienda.length;
      
      let cierresConErrores = 0;
      let totalDiferencia = 0;
      
      cierresTienda.forEach(cierre => {
        const estado = getEstado(cierre);
        if (estado === ESTADOS_CIERRE.DIFERENCIA_MENOR || estado === ESTADOS_CIERRE.DIFERENCIA_GRAVE) {
          cierresConErrores++;
        }
        totalDiferencia += Number(cierre.grand_difference_total) || 0;
      });
      
      return {
        tienda,
        totalCierres,
        cierresConErrores,
        totalDiferencia,
        todosCierres: cierresTienda, // Guardamos todos los cierres
      };
    });
  }, [tiendas, allCierres]); // Quitamos showWithoutErrors de las dependencias

  // Filtrar tiendas a mostrar basado en el switch
  const tiendasAMostrar = useMemo(() => {
    // Siempre mostrar todas las tiendas
    return estadisticasPorTienda;
  }, [estadisticasPorTienda]);
  const years = useMemo(() => {
    const currentYear = moment().year();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Nombres de meses
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Efecto para actualizar la tabla cuando cambie el switch
  useEffect(() => {
    if (selectedTienda) {
      handleTiendaClick(selectedTienda);
    }
  }, [showWithoutErrors]); // Se ejecuta cuando cambia el switch

  const handleTiendaClick = (tienda) => {
    // Encontrar la tienda en las estadísticas
    const tiendaStats = estadisticasPorTienda.find(stats => stats.tienda === tienda);
    
    if (tiendaStats) {
      // Filtrar según el switch de mostrar sin errores (solo para la tabla)
      const cierresFiltrados = showWithoutErrors 
        ? tiendaStats.todosCierres 
        : tiendaStats.todosCierres.filter(cierre => {
            const estado = getEstado(cierre);
            return estado === ESTADOS_CIERRE.DIFERENCIA_MENOR || estado === ESTADOS_CIERRE.DIFERENCIA_GRAVE;
          });
      
      setSelectedTienda(tienda);
      setSelectedCierres(cierresFiltrados);
      setSelectedCierresIds(new Set()); // Limpiar selección al cambiar de tienda
    }
  };

  const handleCheckboxChange = (cierreId, checked) => {
    setSelectedCierresIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(cierreId);
      } else {
        newSet.delete(cierreId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(selectedCierres.map(cierre => cierre.id));
      setSelectedCierresIds(allIds);
    } else {
      setSelectedCierresIds(new Set());
    }
  };

  const handleValidarDiferencias = () => {
    const selectedCount = selectedCierresIds.size;
    if (selectedCount === 0) {
      showSnackbar('Por favor seleccione al menos un cierre para validar.', 'warning');
      return;
    }
    // TODO: Implementar lógica de validación
    showSnackbar(`Se validarán ${selectedCount} cierres seleccionados.`, 'info');
  };

  const handlePasarRevision = () => {
    const selectedCount = selectedCierresIds.size;
    if (selectedCount === 0) {
      showSnackbar('Por favor seleccione al menos un cierre para pasar a revisión.', 'warning');
      return;
    }
    // TODO: Implementar lógica de pasar a revisión
    showSnackbar(`Se pasarán a revisión ${selectedCount} cierres seleccionados.`, 'info');
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box
      p={3}
      sx={{
        fontFamily: 'Inter',
        bgcolor: '#121212',
        color: '#ffffff',
        minHeight: '100vh'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: '#1e1e1e',
          color: '#ffffff'
        }}
      >
        {/* Filtros */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#ffffff' }}>Mes</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Mes"
                  sx={{
                    color: '#ffffff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                    '.MuiSvgIcon-root': { color: '#ffffff' }
                  }}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#ffffff' }}>Año</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Año"
                  sx={{
                    color: '#ffffff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                    '.MuiSvgIcon-root': { color: '#ffffff' }
                  }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={fetchCierres}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{
                  color: '#ffffff',
                  borderColor: '#444',
                  '&:hover': { borderColor: '#888' },
                  height: '40px',
                }}
              >
                {loading ? 'Cargando...' : 'Actualizar'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3, borderColor: '#444' }} />

        {/* Período seleccionado */}
        <Typography variant="body1" sx={{ mb: 3, color: '#b0b0b0', fontSize: '0.95rem' }}>
          Período: {months[selectedMonth]} {selectedYear}
        </Typography>

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* Grid de tiendas */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: 2, 
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
        }}>
          {tiendasAMostrar.map((stats) => (
            <TiendaCard
              key={stats.tienda}
              tienda={stats.tienda}
              totalCierres={stats.totalCierres}
              cierresConErrores={stats.cierresConErrores}
              totalDiferencia={stats.totalDiferencia}
              onClick={() => handleTiendaClick(stats.tienda)}
            />
          ))}
        </Box>

        {/* Switch para filtrar tabla y botones de acción */}
        <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          {/* Botones de acción */}
          {selectedTienda && selectedCierres.length > 0 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleValidarDiferencias}
                disabled={selectedCierresIds.size === 0}
                sx={{
                  backgroundColor: '#4CAF50', // Verde más vivo
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#45A049',
                  },
                  '&:disabled': {
                    backgroundColor: '#3a3a3a',
                    color: '#666666',
                  },
                  borderRadius: 1,
                  px: 2,
                  fontSize: '0.8rem',
                }}
              >
                Validar ({selectedCierresIds.size})
              </Button>
              <Button
                variant="contained"
                onClick={handlePasarRevision}
                disabled={selectedCierresIds.size === 0}
                sx={{
                  backgroundColor: '#F44336', // Rojo
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#D32F2F',
                  },
                  '&:disabled': {
                    backgroundColor: '#3a3a3a',
                    color: '#666666',
                  },
                  borderRadius: 1,
                  px: 2,
                  fontSize: '0.8rem',
                }}
              >
                Revisar ({selectedCierresIds.size})
              </Button>
            </Box>
          ) : (
            <Box /> // Espacio vacío cuando no hay botones
          )}
          
          <FormControlLabel
            control={
              <Switch
                checked={showWithoutErrors}
                onChange={(e) => setShowWithoutErrors(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#A3BE8C',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#A3BE8C',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: '#ffffff', fontSize: '0.9rem' }}>
                Incluir cierres sin errores en la tabla
              </Typography>
            }
          />
        </Box>

        {/* Mensaje si no hay tiendas */}
        {tiendas.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#b0b0b0' }}>
              No se encontraron tiendas configuradas
            </Typography>
          </Box>
        )}

        {/* Mensaje si no hay tiendas con errores */}
        {tiendas.length > 0 && tiendasAMostrar.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: '#b0b0b0' }}>
              No se encontraron tiendas en el período seleccionado
            </Typography>
          </Box>
        )}

        {/* Tabla de cierres de la tienda seleccionada */}
        {selectedTienda && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: '#ffffff' }}>
                Cierres de {selectedTienda}
              </Typography>
              <Button
                variant="text"
                onClick={() => setSelectedTienda(null)}
                sx={{ color: '#b0b0b0', minWidth: 'auto' }}
              >
                <KeyboardArrowUpIcon />
              </Button>
            </Box>
            
            <TableContainer component={Paper} sx={{ 
              bgcolor: '#2a2a2a', 
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid #444'
            }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{
                    bgcolor: '#3a3a3a',
                    '& th': {
                      fontWeight: 'bold',
                      color: '#ffffff',
                      borderBottom: '2px solid #A3BE8C'
                    }
                  }}>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff', width: 50 }}>
                      <Checkbox
                        sx={{
                          color: '#A3BE8C',
                          '&.Mui-checked': { color: '#A3BE8C' },
                        }}
                        checked={selectedCierres.length > 0 && selectedCierresIds.size === selectedCierres.length}
                        indeterminate={selectedCierresIds.size > 0 && selectedCierresIds.size < selectedCierres.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff', width: 50 }}>Ver</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>ID</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Fecha</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Usuario</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Estado</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Diferencia Total</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Cliente</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Pedido</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Monto</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Justificaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCierres.map((cierre) => {
                    const estado = getEstado(cierre);
                    const diferencia = Number(cierre.grand_difference_total) || 0;
                    
                    // Calcular información agregada de justificaciones
                    const infoJustificaciones = cierre.justificaciones && cierre.justificaciones.length > 0 
                      ? (() => {
                          const justifs = cierre.justificaciones;
                          const totalJustifs = justifs.length;
                          
                          // Agrupar por cliente y orden únicos
                          const clientesUnicos = [...new Set(justifs.map(j => j.cliente).filter(c => c && c !== '0'))];
                          const ordenesUnicas = [...new Set(justifs.map(j => j.orden).filter(o => o && o !== '0'))];
                          
                          // Calcular monto total de justificaciones
                          const montoTotal = justifs.reduce((sum, j) => {
                            if (j.monto_dif != null) {
                              let monto = j.monto_dif;
                              if (typeof monto === 'string') {
                                monto = monto.replace(/\$/g, '').replace(/,/g, '.').trim();
                              }
                              const numeroMonto = Number(monto);
                              return sum + (isNaN(numeroMonto) ? 0 : numeroMonto);
                            }
                            return sum;
                          }, 0);
                          
                          return {
                            total: totalJustifs,
                            clientes: clientesUnicos,
                            ordenes: ordenesUnicas,
                            montoTotal,
                            justificaciones: justifs
                          };
                        })()
                      : null;
                    
                    return (
                      <TableRow 
                        key={cierre.id} 
                        sx={{ 
                          '&:hover': { bgcolor: '#3a3a3a' },
                          bgcolor: '#2a2a2a',
                          ...(diferencia !== 0 && {
                            borderLeft: `3px solid ${estado.color}`
                          })
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            sx={{
                              color: '#A3BE8C',
                              '&.Mui-checked': { color: '#A3BE8C' },
                            }}
                            checked={selectedCierresIds.has(cierre.id)}
                            onChange={(e) => handleCheckboxChange(cierre.id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver detalles del cierre" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalDetalle(cierre);
                              }}
                              sx={{ color: '#A3BE8C' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#ffffff',
                              fontFamily: 'monospace',
                              fontSize: '0.8rem'
                            }}
                          >
                            {cierre.id || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {cierre.fecha ? cierre.fecha.format('DD/MM') : cierre.fecha}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {cierre.usuario || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {estado.icon}
                            <Typography variant="body2" sx={{ ml: 1, color: estado.color }}>
                              {estado.label}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ 
                          color: diferencia === 0 ? '#A3BE8C' : diferencia > 0 ? '#BF616A' : '#EBCB8B',
                          fontWeight: 600,
                          fontFamily: 'monospace'
                        }}>
                          {formatMoney(diferencia)}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {infoJustificaciones ? (
                            infoJustificaciones.clientes.length > 0 
                              ? infoJustificaciones.clientes.slice(0, 2).join(', ') + 
                                (infoJustificaciones.clientes.length > 2 ? '...' : '')
                              : '-'
                          ) : '-'}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {infoJustificaciones ? (
                            infoJustificaciones.ordenes.length > 0
                              ? infoJustificaciones.ordenes.slice(0, 2).join(', ') +
                                (infoJustificaciones.ordenes.length > 2 ? '...' : '')
                              : '-'
                          ) : '-'}
                        </TableCell>
                        <TableCell sx={{ 
                          color: '#ffffff',
                          fontWeight: 600,
                          fontFamily: 'monospace'
                        }}>
                          {infoJustificaciones ? formatMoney(infoJustificaciones.montoTotal) : '-'}
                        </TableCell>
                        <TableCell sx={{ color: '#ffffff', maxWidth: 400 }}>
                          {infoJustificaciones ? (
                            <Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#EBCB8B',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  mb: 1
                                }}
                              >
                                {infoJustificaciones.total} justificación{infoJustificaciones.total > 1 ? 'es' : ''}:
                              </Typography>
                              
                              {/* Lista simple de todas las justificaciones */}
                              {infoJustificaciones.justificaciones.map((justif, idx) => (
                                <Typography 
                                  key={idx}
                                  variant="body2" 
                                  sx={{ 
                                    color: '#ffffff',
                                    fontSize: '0.8rem',
                                    mb: 0.5,
                                    pl: 1,
                                    borderLeft: '2px solid #555',
                                    wordBreak: 'break-word'
                                  }}
                                >
                                  <strong>#{idx + 1}:</strong> {justif.motivo || 'Sin motivo'}
                                  {(justif.cliente && justif.cliente !== '0') && (
                                    <Typography component="span" sx={{ color: '#88C0D0', fontSize: '0.7rem', ml: 1 }}>
                                      (Cliente: {justif.cliente})
                                    </Typography>
                                  )}
                                  {(justif.orden && justif.orden !== '0') && (
                                    <Typography component="span" sx={{ color: '#D8DEE9', fontSize: '0.7rem', ml: 1 }}>
                                      (Orden: {justif.orden})
                                    </Typography>
                                  )}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#BF616A', fontStyle: 'italic' }}>
                              Sin justificaciones
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {selectedCierres.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
                  No se encontraron cierres {!showWithoutErrors ? 'con errores ' : ''}para esta tienda en el período seleccionado
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Modal de detalle */}
      <Modal open={!!modalDetalle} onClose={() => { setModalDetalle(null); setTabValue(0); }}>
        <Fade in={!!modalDetalle}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', md: '80%' },
              maxWidth: 1000,
              bgcolor: '#1e1e1e',
              color: '#ffffff',
              boxShadow: 24,
              p: 3,
              borderRadius: 2,
              outline: 'none',
              maxHeight: '90vh',
              overflowY: 'auto',
              transition: 'transform 0.3s ease',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: '#ffffff' }}>
              Detalle completo del cierre – {modalDetalle?.fecha ? modalDetalle.fecha.format('DD/MM/YYYY') : 'N/A'}
            </Typography>
            <Tabs
              value={tabValue}
              onChange={(_, nv) => setTabValue(nv)}
              sx={{ 
                mb: 3,
                '& .MuiTab-root': { color: '#b0b0b0' },
                '& .Mui-selected': { color: '#A3BE8C' },
                '& .MuiTabs-indicator': { backgroundColor: '#A3BE8C' },
              }}
            >
              <Tab label="Información" />
              <Tab label="Medios de pago" />
              {modalDetalle?.justificaciones?.length > 0 && (
                <Tab label="Justificaciones" />
              )}
            </Tabs>

            {tabValue === 0 && modalDetalle && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>Información básica</Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Tienda:</strong> {modalDetalle.tienda}</Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Usuario:</strong> {modalDetalle.usuario}</Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Estado:</strong> {getEstado(modalDetalle).label}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>Totales</Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Facturado:</strong> <ExactValue value={modalDetalle.total_facturado} /></Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Cobrado:</strong> <ExactValue value={modalDetalle.total_cobrado} /></Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Diferencia:</strong> <ExactValue value={modalDetalle.grand_difference_total} /></Typography>
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && modalDetalle && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#ffffff' }}>Medios de pago</Typography>
                <TableContainer component={Paper} sx={{ bgcolor: '#2a2a2a' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Medio</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Facturado</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Cobrado</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Diferencia</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modalDetalle.medios_pago.map((m, i) => (
                        <TableRow key={i} sx={{ bgcolor: '#2a2a2a' }}>
                          <TableCell sx={{ color: '#ffffff' }}>{m.medio}</TableCell>
                          <TableCell align="right" sx={{ color: '#ffffff' }}><ExactValue value={m.facturado} /></TableCell>
                          <TableCell align="right" sx={{ color: '#ffffff' }}><ExactValue value={m.cobrado} /></TableCell>
                          <TableCell align="right" sx={{ color: '#ffffff' }}><ExactValue value={m.differenceVal} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {tabValue === 2 && modalDetalle?.justificaciones?.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#ffffff' }}>Justificaciones</Typography>
                <TableContainer component={Paper} sx={{ bgcolor: '#2a2a2a' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Motivo</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Monto</TableCell>
                        <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Cliente</TableCell>
                        <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Orden</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modalDetalle.justificaciones.map((j, i) => {
                        // Procesar el monto_dif que puede venir como texto con "$" y comas
                        let monto = j.monto_dif;
                        if (typeof monto === 'string') {
                          monto = monto.replace(/\$/g, '').replace(/,/g, '.').trim();
                        }
                        const numeroMonto = Number(monto);
                        const montoValido = !isNaN(numeroMonto) ? numeroMonto : 0;
                        
                        return (
                          <TableRow key={i} sx={{ bgcolor: '#2a2a2a' }}>
                            <TableCell sx={{ color: '#ffffff' }}><Typography variant="body2">{j.motivo}</Typography></TableCell>
                            <TableCell align="right" sx={{ color: '#ffffff' }}><ExactValue value={montoValido} /></TableCell>
                            <TableCell sx={{ color: '#ffffff' }}>{j.cliente || '-'}</TableCell>
                            <TableCell sx={{ color: '#ffffff' }}>{j.orden || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={() => { setModalDetalle(null); setTabValue(0); }} 
                sx={{ 
                  borderRadius: 1,
                  backgroundColor: '#A3BE8C',
                  '&:hover': { backgroundColor: '#8FA882' }
                }}
              >
                Cerrar
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
