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
import { fetchWithFallback, axiosWithFallback } from '../config';

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

// NUEVO: función para mostrar estado de validación
function getValidacionInfo(cierre) {
  if (cierre.validado) {
    return {
      label: 'Validado',
      icon: <CheckCircleIcon color="success" fontSize="small" />,
      color: '#4caf50',
      usuario: cierre.usuario_validacion,
      fecha: cierre.fecha_validacion
    };
  }
  return {
    label: 'Sin validar',
    icon: <ErrorIcon color="error" fontSize="small" />,
    color: '#f44336',
    usuario: null,
    fecha: null
  };
}

// Componente para la tarjeta de tienda
const TiendaCard = React.memo(function TiendaCard({ 
  tienda, 
  totalCierres, 
  cierresConErrores, 
  totalDiferencia,
  todosCierres,
  onClick,
  isSelected
}) {
  const theme = useTheme();
  
  // Solo considerar cierres no validados para el % de error
  const cierresNoValidados = todosCierres?.filter(cierre => !cierre.validado) || [];
  const totalNoValidados = cierresNoValidados.length;
  const erroresNoValidados = cierresNoValidados.filter(cierre => {
    const estado = getEstado(cierre);
    return estado === ESTADOS_CIERRE.DIFERENCIA_MENOR || estado === ESTADOS_CIERRE.DIFERENCIA_GRAVE;
  }).length;
  const porcentajeErrores = totalNoValidados > 0 ? (erroresNoValidados / totalNoValidados) * 100 : 0;
  
  // Calcular estadísticas adicionales basadas en todosCierres
  const cierresValidados = todosCierres?.filter(cierre => cierre.validado).length || 0;
  const cierresSinValidar = totalCierres - cierresValidados;
  const diferenciaValidada = todosCierres?.filter(cierre => cierre.validado)
    .reduce((sum, cierre) => sum + (Number(cierre.grand_difference_total) || 0), 0) || 0;
  const diferenciaSinValidar = totalDiferencia - diferenciaValidada;
  
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: getCardColor(),
        border: isSelected 
          ? `2px solid ${getAccentColor()}` 
          : `1px solid ${getAccentColor()}20`,
        borderRadius: 2,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${getAccentColor()}20`,
          borderColor: `${getAccentColor()}50`,
        },
        minHeight: isSelected ? '220px' : '180px',
        width: '100%',
        minWidth: '180px',
        maxWidth: '220px',
        flex: '1 1 180px',
        ...(isSelected && {
          boxShadow: `0 4px 16px ${getAccentColor()}30` ,
          transform: 'translateY(-1px)',
        }),
      }}
      onClick={onClick}
    >
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'flex-start',
        py: 1.5, 
        px: 2,
        height: '100%',
        '&:last-child': { pb: 1.5 }
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: getAccentColor(),
                mr: 1,
                boxShadow: `0 0 6px ${getAccentColor()}40`,
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                color: getTextColor(),
                fontSize: '1rem',
              }}
            >
              {tienda}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: `${getTextColor()}80`,
                fontSize: '0.7rem',
                fontWeight: 500,
              }}
            >
              {porcentajeErrores.toFixed(0)}% errores
            </Typography>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
          {/* Total Cierres */}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: getAccentColor(), 
                fontWeight: 700,
                fontSize: '1.1rem',
                lineHeight: 1,
              }}
            >
              {totalCierres}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: `${getTextColor()}70`,
                fontSize: '0.65rem',
                display: 'block',
              }}
            >
              Total cierres
            </Typography>
          </Box>

          {/* Errores */}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: erroresNoValidados > 0 ? '#BF616A' : '#A3BE8C', 
                fontWeight: 700,
                fontSize: '1.1rem',
                lineHeight: 1,
              }}
            >
              {erroresNoValidados}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: `${getTextColor()}70`,
                fontSize: '0.65rem',
                display: 'block',
              }}
            >
              Con errores
            </Typography>
          </Box>

          {/* Validados */}
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#A3BE8C', 
                fontWeight: 600,
                fontSize: '0.9rem',
                lineHeight: 1,
              }}
            >
              {cierresValidados}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: `${getTextColor()}70`,
                fontSize: '0.65rem',
                display: 'block',
              }}
            >
              Validados
            </Typography>
          </Box>

          {/* Sin Validar */}
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: cierresSinValidar > 0 ? '#EBCB8B' : '#A3BE8C', 
                fontWeight: 600,
                fontSize: '0.9rem',
                lineHeight: 1,
              }}
            >
              {cierresSinValidar}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: `${getTextColor()}70`,
                fontSize: '0.65rem',
                display: 'block',
              }}
            >
              Sin validar
            </Typography>
          </Box>
        </Box>

        {/* Mostrar detalles de diferencias solo si está seleccionada */}
        <Collapse in={isSelected && totalDiferencia !== 0} timeout={400} unmountOnExit>
          <Box sx={{ borderTop: `1px solid ${getAccentColor()}20`, pt: 1, mt: 1, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: totalDiferencia > 0 ? '#BF616A' : '#A3BE8C',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Diferencia Total
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: totalDiferencia > 0 ? '#BF616A' : '#A3BE8C',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {totalDiferencia > 0 ? '+' : ''}{formatMoney(totalDiferencia)}
              </Typography>
            </Box>
            {diferenciaSinValidar !== 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: `${getTextColor()}80`,
                    fontSize: '0.7rem',
                  }}
                >
                  Sin validar
                </Typography>
                <Typography 
                  variant="caption"
                  sx={{ color: '#EBCB8B', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  {diferenciaSinValidar > 0 ? '+' : ''}{formatMoney(diferenciaSinValidar)}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

// Componente para renderizar cada fila de cierre con opción desplegable
function CierreRow({ cierre, isSelected, handleCheckboxChange, handleMarcarRevisar, formatMoney, setModalDetalle }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const estado = getEstado(cierre);
  const validacionInfo = getValidacionInfo(cierre);
  const diferencia = Number(cierre.grand_difference_total) || 0;

  // Calcular diferencia justificada
  const diferenciaJustificada = cierre.justificaciones?.reduce((sum, j) => {
    return sum + (Number(j.ajuste) || 0);
  }, 0) || 0;
  
  const saldoSinJustificar = diferencia - diferenciaJustificada;
  const numJustificaciones = cierre.justificaciones?.length || 0;

  return (
    <React.Fragment>
      <TableRow
        sx={{
          '& > *': { borderBottom: 'unset' },
          backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) },
        }}
      >
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <Checkbox
            size="small"
            checked={isSelected}
            onChange={(e) => handleCheckboxChange(cierre.id, e.target.checked)}
            disabled={false}
          />
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            disabled={numJustificaciones === 0}
            sx={{ 
              color: numJustificaciones > 0 ? '#A3BE8C' : '#666',
              '&:disabled': { color: '#333' }
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {cierre.id}
          </Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <Typography variant="body2">{cierre.fecha.format('DD/MM/YYYY')}</Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>{cierre.usuario}</TableCell>
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <Chip
            icon={estado.icon}
            label={estado.label}
            size="small"
            sx={{
              backgroundColor: estado.bgColor,
              color: estado.color,
              fontWeight: 'bold',
            }}
          />
        </TableCell>
        <TableCell sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <Tooltip
            title={
              validacionInfo.usuario
                ? `Validado por ${validacionInfo.usuario} el ${moment(validacionInfo.fecha).format('DD/MM/YYYY HH:mm')}`
                : 'Sin validar'
            }
            arrow
          >
            <Chip
              icon={validacionInfo.icon}
              label={validacionInfo.label}
              size="small"
              sx={{
                backgroundColor: alpha(validacionInfo.color, 0.1),
                color: validacionInfo.color,
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (cierre.validado) {
                  handleMarcarRevisar(cierre.id);
                }
              }}
            />
          </Tooltip>
        </TableCell>
        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <ExactValue value={diferencia} />
        </TableCell>
        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <ExactValue value={diferenciaJustificada} />
        </TableCell>
        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <ExactValue value={saldoSinJustificar} />
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={numJustificaciones} 
              size="small"
              sx={{
                backgroundColor: numJustificaciones > 0 ? '#A3BE8C20' : '#66666620',
                color: numJustificaciones > 0 ? '#A3BE8C' : '#666',
                fontWeight: 'bold',
              }}
            />
            {numJustificaciones > 0 && (
              <Typography variant="caption" sx={{ color: '#A3BE8C', fontSize: '0.7rem' }}>
                justif.
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: '1px solid rgba(81, 81, 81, 1)' }}>
          <IconButton size="small" onClick={() => setModalDetalle(cierre)}>
            <VisibilityIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: '#2E3440', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ color: '#ECEFF4', fontSize: '1rem' }}>
                Justificaciones ({numJustificaciones})
              </Typography>
              {numJustificaciones > 0 ? (
                <Table size="small" aria-label="justificaciones">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }}>Usuario</TableCell>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }}>Cliente</TableCell>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }}>Orden</TableCell>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }}>Medio de Pago</TableCell>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }}>Motivo</TableCell>
                      <TableCell sx={{ color: '#D8DEE9', fontWeight: 'bold' }} align="right">Ajuste</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cierre.justificaciones.map((justificacion, index) => (
                      <TableRow key={justificacion.id || index}>
                        <TableCell sx={{ color: '#E5E9F0' }}>
                          {justificacion.fecha ? moment(justificacion.fecha).format('DD/MM/YYYY') : '-'}
                        </TableCell>
                        <TableCell sx={{ color: '#E5E9F0' }}>{justificacion.usuario || '-'}</TableCell>
                        <TableCell sx={{ color: '#E5E9F0' }}>{justificacion.cliente || '-'}</TableCell>
                        <TableCell sx={{ color: '#E5E9F0' }}>{justificacion.orden || '-'}</TableCell>
                        <TableCell sx={{ color: '#E5E9F0' }}>{justificacion.medio_pago || '-'}</TableCell>
                        <TableCell sx={{ color: '#E5E9F0', maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {justificacion.motivo || 'Sin motivo'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#EBCB8B', fontWeight: 'bold' }}>
                          {formatMoney(justificacion.ajuste || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" sx={{ color: '#D8DEE9', fontStyle: 'italic' }}>
                  No hay justificaciones para este cierre
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

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
  // Nuevo estado para el filtro de validación
  const [showValidados, setShowValidados] = useState(false);
  // Nuevo estado para el tercer switch
  const [showTodos, setShowTodos] = useState(false);
  // Nuevo estado para la tarjeta seleccionada
  const [selectedCard, setSelectedCard] = useState(null);

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
        const res = await axiosWithFallback('/localStorage');
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
      console.log('Solicitando cierres:', params);
      const response = await axiosWithFallback('/api/cierres-completo', { params });
      console.log('Respuesta cierres:', response);
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
      setError(`Error al cargar los datos. Intente nuevamente.\n${err?.message || ''}\n${err?.response?.data ? JSON.stringify(err.response.data) : ''}`);
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
      let totalDiferenciaValidado = 0;
      cierresTienda.forEach(cierre => {
        const estado = getEstado(cierre);
        if (estado === ESTADOS_CIERRE.DIFERENCIA_MENOR || estado === ESTADOS_CIERRE.DIFERENCIA_GRAVE) {
          cierresConErrores++;
        }
        totalDiferencia += Number(cierre.grand_difference_total) || 0;
        if (cierre.validado) {
          totalDiferenciaValidado += Number(cierre.grand_difference_total) || 0;
        }
      });
      return {
        tienda,
        totalCierres,
        cierresConErrores,
        totalDiferencia,
        totalDiferenciaValidado,
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

  // Efecto para actualizar la tabla cuando cambie cualquier switch
  useEffect(() => {
    if (selectedTienda) {
      handleTiendaClick(selectedTienda);
    }
    // Mantener la selección de tarjeta al cambiar filtros
  }, [showWithoutErrors, showValidados, showTodos]); // Se ejecuta cuando cambia cualquiera de los switches

  const handleTiendaClick = (tienda) => {
    // Si hacemos clic en la misma tienda, toggle la selección
    if (selectedCard === tienda) {
      setSelectedCard(null);
    } else {
      setSelectedCard(tienda);
    }
    
    // Encontrar la tienda en las estadísticas
    const tiendaStats = estadisticasPorTienda.find(stats => stats.tienda === tienda);
    if (tiendaStats) {
      // Filtrar según los switches
      let cierresFiltrados = tiendaStats.todosCierres;
      if (!showTodos) {
        if (!showWithoutErrors) {
          cierresFiltrados = cierresFiltrados.filter(cierre => {
            const estado = getEstado(cierre);
            return estado === ESTADOS_CIERRE.DIFERENCIA_MENOR || estado === ESTADOS_CIERRE.DIFERENCIA_GRAVE;
          });
        }
        if (showValidados) {
          cierresFiltrados = cierresFiltrados.filter(cierre => cierre.validado);
        } else {
          cierresFiltrados = cierresFiltrados.filter(cierre => !cierre.validado);
        }
      }
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
      const allIds = new Set(selectedCierres.filter(c => !c.validado).map(cierre => cierre.id));
      setSelectedCierresIds(allIds);
    } else {
      setSelectedCierresIds(new Set());
    }
  };

  const handleValidarDiferencias = async () => {
    const selectedIds = Array.from(selectedCierresIds);
    if (selectedIds.length === 0) {
      showSnackbar('Por favor seleccione al menos un cierre para validar.', 'warning');
      return;
    }
    try {
      const usuario_validacion = window.prompt('Ingrese su usuario para validar:', 'admin');
      if (!usuario_validacion) return;
      await axiosWithFallback('/api/cierres-validar', {
        method: 'PUT',
        data: {
          ids: selectedIds,
          usuario_validacion
        }
      });
      showSnackbar('Cierres validados correctamente.', 'success');
      setSelectedCierresIds(new Set());
      await fetchCierres(); // Refrescar todos los datos
      // Mantener la tarjeta seleccionada para ver el cambio dinámico
      // setSelectedTienda(null); // Comentado para mantener la selección
    } catch (err) {
      showSnackbar('Error al validar cierres.', 'error');
    }
  };

  const handlePasarRevision = async () => {
    const selectedIds = Array.from(selectedCierresIds);
    if (selectedIds.length === 0) {
      showSnackbar('Selecciona al menos un cierre para pasar a revisión.', 'warning');
      return;
    }
    let successCount = 0;
    for (const cierreId of selectedIds) {
      try {
        // Usar el endpoint correcto con axiosWithFallback (usa el puerto 3001)
        const res = await axiosWithFallback(`/api/cierres-completo/${cierreId}/revisar`, {
          method: 'PUT',
        });
        if (res.status === 200) successCount++;
      } catch (err) {
        // Error individual, continuar con los demás
      }
    }
    if (successCount > 0) {
      showSnackbar(`Se pasaron a revisión ${successCount} cierre(s).`, 'success');
      await fetchCierres(); // Refresca la tabla
      setSelectedCierresIds(new Set());
    } else {
      showSnackbar('No se pudo pasar a revisión ningún cierre.', 'error');
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Cambiar estado a 'revisar' para cierres validados
  const handleMarcarRevisar = async (cierreId) => {
    try {
      await axiosWithFallback(`/api/cierres-completo/${cierreId}/revisar`, {
        method: 'PUT'
      });
      showSnackbar('Cierre marcado para revisión.', 'success');
      await fetchCierres(); // Refrescar datos
    } catch (err) {
      showSnackbar('Error al marcar para revisión.', 'error');
    }
  };

  // Handlers para exportar datos
  // Utilidad para exportar CSV
  const handleExportCSV = () => {
    if (!selectedCierres || selectedCierres.length === 0) {
      showSnackbar('No hay datos para exportar.', 'warning');
      return;
    }
    // Definir columnas a exportar
    const columns = [
      'ID', 'Fecha', 'Usuario', 'Estado', 'Validación', 'Diferencia Total', 'Diferencia Justificada', 'Saldo Sin Justificar', 'Justificaciones'
    ];
    // Mapear datos
    const rows = selectedCierres.map(cierre => {
      const estado = getEstado(cierre).label;
      const validacion = getValidacionInfo(cierre).label;
      const diferencia = formatMoney(Number(cierre.grand_difference_total) || 0);
      // Justificaciones resumidas
      let diferenciaJustificada = 0;
      let justificaciones = '-';
      if (cierre.justificaciones && cierre.justificaciones.length > 0) {
        // Calcular diferencia justificada
        diferenciaJustificada = cierre.justificaciones.reduce((sum, j) => {
          if (j.ajuste != null) {
            const ajusteNum = Number(j.ajuste);
            return sum + (isNaN(ajusteNum) ? 0 : ajusteNum);
          } else if (j.monto_dif != null) {
            let monto = j.monto_dif;
            if (typeof monto === 'string') {
              monto = monto.replace(/\$/g, '').trim();
              if (monto.includes(',')) {
                const partes = monto.split(',');
                const entero = partes[0].replace(/\./g, '');
                const decimal = partes[1] || '0';
                monto = entero + '.' + decimal;
              } else {
                monto = monto.replace(/\./g, '');
              }
            }
            const numeroMonto = Number(monto);
            return sum + (isNaN(numeroMonto) ? 0 : numeroMonto);
          }
          return sum;
        }, 0);
        justificaciones = cierre.justificaciones.map(j => j.motivo || 'Sin motivo').join(' | ');
      }
      const saldoSinJustificar = (Number(cierre.grand_difference_total) || 0) - diferenciaJustificada;
      
      return [
        cierre.id,
        cierre.fecha ? cierre.fecha.format('DD/MM/YYYY') : '',
        cierre.usuario || '',
        estado,
        validacion,
        diferencia,
        formatMoney(diferenciaJustificada),
        formatMoney(saldoSinJustificar),
        justificaciones
      ];
    });
    // Construir CSV
    let csvContent = columns.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `cierres_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utilidad para exportar Excel (XLSX)
  const handleExportXLSX = () => {
    if (!selectedCierres || selectedCierres.length === 0) {
      showSnackbar('No hay datos para exportar.', 'warning');
      return;
    }
    // Usar SheetJS (xlsx) si está disponible
    try {
      // @ts-ignore
      if (!window.XLSX) {
        showSnackbar('No se encontró la librería XLSX. Instale SheetJS en el proyecto.', 'error');
        return;
      }
      const columns = [
        'ID', 'Fecha', 'Usuario', 'Estado', 'Validación', 'Diferencia Total', 'Diferencia Justificada', 'Saldo Sin Justificar', 'Justificaciones'
      ];
      const rows = selectedCierres.map(cierre => {
        const estado = getEstado(cierre).label;
        const validacion = getValidacionInfo(cierre).label;
        const diferencia = Number(cierre.grand_difference_total) || 0;
        let diferenciaJustificada = 0;
        let justificaciones = '-';
        if (cierre.justificaciones && cierre.justificaciones.length > 0) {
          // Calcular diferencia justificada
          diferenciaJustificada = cierre.justificaciones.reduce((sum, j) => {
            if (j.ajuste != null) {
              const ajusteNum = Number(j.ajuste);
              return sum + (isNaN(ajusteNum) ? 0 : ajusteNum);
            } else if (j.monto_dif != null) {
              let monto = j.monto_dif;
              if (typeof monto === 'string') {
                monto = monto.replace(/\$/g, '').trim();
                if (monto.includes(',')) {
                  const partes = monto.split(',');
                  const entero = partes[0].replace(/\./g, '');
                  const decimal = partes[1] || '0';
                  monto = entero + '.' + decimal;
                } else {
                  monto = monto.replace(/\./g, '');
                }
              }
              const numeroMonto = Number(monto);
              return sum + (isNaN(numeroMonto) ? 0 : numeroMonto);
            }
            return sum;
          }, 0);
          justificaciones = cierre.justificaciones.map(j => j.motivo || 'Sin motivo').join(' | ');
        }
        const saldoSinJustificar = diferencia - diferenciaJustificada;
        
        return {
          ID: cierre.id,
          Fecha: cierre.fecha ? cierre.fecha.format('DD/MM/YYYY') : '',
          Usuario: cierre.usuario || '',
          Estado: estado,
          Validación: validacion,
          'Diferencia Total': diferencia,
          'Diferencia Justificada': diferenciaJustificada,
          'Saldo Sin Justificar': saldoSinJustificar,
          Justificaciones: justificaciones
        };
      });
      // @ts-ignore
      const ws = window.XLSX.utils.json_to_sheet(rows);
      // @ts-ignore
      const wb = window.XLSX.utils.book_new();
      // @ts-ignore
      window.XLSX.utils.book_append_sheet(wb, ws, 'Cierres');
      // @ts-ignore
      window.XLSX.writeFile(wb, `cierres_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.xlsx`);
    } catch (err) {
      showSnackbar('Error al exportar a Excel.', 'error');
    }
  };

  // Utilidad para exportar PDF
  const handleExportPDF = () => {
    if (!selectedCierres || selectedCierres.length === 0) {
      showSnackbar('No hay datos para exportar.', 'warning');
      return;
    }
    // Usar jsPDF si está disponible
    try {
      // @ts-ignore
      if (!window.jspdf || !window.jspdf.autoTable) {
        showSnackbar('No se encontró la librería jsPDF. Instale jsPDF y jsPDF-autotable en el proyecto.', 'error');
        return;
      }
      // @ts-ignore
      const doc = new window.jspdf.jsPDF();
      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Usuario', dataKey: 'usuario' },
        { header: 'Estado', dataKey: 'estado' },
        { header: 'Validación', dataKey: 'validacion' },
        { header: 'Diferencia Total', dataKey: 'diferencia' },
        { header: 'Diferencia Justificada', dataKey: 'diferenciaJustificada' },
        { header: 'Saldo Sin Justificar', dataKey: 'saldoSinJustificar' },
        { header: 'Justificaciones', dataKey: 'justificaciones' }
      ];
      const rows = selectedCierres.map(cierre => {
        const estado = getEstado(cierre).label;
        const validacion = getValidacionInfo(cierre).label;
        const diferencia = formatMoney(Number(cierre.grand_difference_total) || 0);
        let diferenciaJustificada = 0;
        let justificaciones = '-';
        if (cierre.justificaciones && cierre.justificaciones.length > 0) {
          // Calcular diferencia justificada
          diferenciaJustificada = cierre.justificaciones.reduce((sum, j) => {
            if (j.ajuste != null) {
              const ajusteNum = Number(j.ajuste);
              return sum + (isNaN(ajusteNum) ? 0 : ajusteNum);
            } else if (j.monto_dif != null) {
              let monto = j.monto_dif;
              if (typeof monto === 'string') {
                monto = monto.replace(/\$/g, '').trim();
                if (monto.includes(',')) {
                  const partes = monto.split(',');
                  const entero = partes[0].replace(/\./g, '');
                  const decimal = partes[1] || '0';
                  monto = entero + '.' + decimal;
                } else {
                  monto = monto.replace(/\./g, '');
                }
              }
              const numeroMonto = Number(monto);
              return sum + (isNaN(numeroMonto) ? 0 : numeroMonto);
            }
            return sum;
          }, 0);
          justificaciones = cierre.justificaciones.map(j => j.motivo || 'Sin motivo').join(' | ');
        }
        const saldoSinJustificar = (Number(cierre.grand_difference_total) || 0) - diferenciaJustificada;
        
        return {
          id: cierre.id,
          fecha: cierre.fecha ? cierre.fecha.format('DD/MM/YYYY') : '',
          usuario: cierre.usuario || '',
          estado,
          validacion,
          diferencia,
          diferenciaJustificada: formatMoney(diferenciaJustificada),
          saldoSinJustificar: formatMoney(saldoSinJustificar),
          justificaciones
        };
      });
      // @ts-ignore
      window.jspdf.autoTable(doc, {
        columns,
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [209, 109, 109] },
        margin: { top: 20 },
        theme: 'grid',
      });
      doc.save(`cierres_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.pdf`);
    } catch (err) {
      showSnackbar('Error al exportar a PDF.', 'error');
    }
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
        {/* Mensajes de error primero */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* ...eliminado banner de resumen ejecutivo... */}

        {/* Fila de controles secundarios y acciones principales enmarcados - AHORA ARRIBA DE LOS STORE BOX */}
        <Card sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: '#232323', boxShadow: '0 2px 8px #A3BE8C15', border: '1px solid #A3BE8C20', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
          {/* Grupo principal: Año, Mes, Validar, Revisar, Switches */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#232323', borderRadius: 2, px: 2, py: 1 }}>
            <FormControl fullWidth size="small" sx={{ minWidth: 100, maxWidth: 120 }}>
              <InputLabel sx={{ color: '#ffffff', fontSize: '0.95rem', top: '-4px' }}>Año</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Año"
                sx={{
                  color: '#ffffff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                  '.MuiSvgIcon-root': { color: '#ffffff' },
                  borderRadius: 2,
                  minHeight: 32,
                  fontSize: '0.95rem',
                  height: 36,
                }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year} sx={{ fontSize: '0.95rem', minHeight: 32 }}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ minWidth: 100, maxWidth: 120 }}>
              <InputLabel sx={{ color: '#ffffff', fontSize: '0.95rem', top: '-4px' }}>Mes</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Mes"
                sx={{
                  color: '#ffffff',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' },
                  '.MuiSvgIcon-root': { color: '#ffffff' },
                  borderRadius: 2,
                  minHeight: 32,
                  fontSize: '0.95rem',
                  height: 36,
                }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              >
                {months.map((month, index) => (
                  <MenuItem key={index} value={index} sx={{ fontSize: '0.95rem', minHeight: 32 }}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleValidarDiferencias}
              disabled={selectedCierresIds.size === 0}
              sx={{
                backgroundColor: '#4CAF50',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#45A049' },
                '&:disabled': { backgroundColor: '#3a3a3a', color: '#666666' },
                borderRadius: 2,
                px: 2,
                fontSize: '0.8rem',
                minHeight: 32,
                minWidth: 110,
              }}
            >
              Validar ({selectedCierresIds.size})
            </Button>
            <Button
              variant="contained"
              onClick={handlePasarRevision}
              disabled={selectedCierresIds.size === 0}
              sx={{
                backgroundColor: '#F44336',
                color: '#ffffff',
                '&:hover': { backgroundColor: '#D32F2F' },
                '&:disabled': { backgroundColor: '#3a3a3a', color: '#666666' },
                borderRadius: 2,
                px: 2,
                fontSize: '0.8rem',
                minHeight: 32,
                minWidth: 110,
              }}
            >
              Revisar ({selectedCierresIds.size})
            </Button>
            <FormControlLabel
              sx={{ alignSelf: 'center', bgcolor: 'transparent', px: 1, py: 0, borderRadius: 1, boxShadow: 'none', height: 32, display: 'flex', alignItems: 'center', flexDirection: 'row' }}
              control={
                <Switch
                  checked={showWithoutErrors}
                  onChange={(e) => setShowWithoutErrors(e.target.checked)}
                  size="small"
                  disabled={showTodos}
                  sx={{
                    width: 38,
                    height: 22,
                    p: 0.5,
                    '& .MuiSwitch-switchBase': {
                      color: showTodos ? '#888' : (showWithoutErrors ? '#4caf50' : '#f44336'),
                      padding: 0.5,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: showTodos ? '#888' : '#4caf50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#888' : '#4caf50',
                      opacity: 0.7,
                    },
                    '& .MuiSwitch-switchBase + .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#888' : '#f44336',
                      opacity: 0.7,
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#888' : (showWithoutErrors ? '#4caf50' : '#f44336'),
                      borderRadius: 11,
                      opacity: 0.5,
                    },
                    '& .MuiSwitch-thumb': {
                      boxShadow: 'none',
                      width: 16,
                      height: 16,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: showTodos ? '#888' : (showWithoutErrors ? '#4caf50' : '#f44336'), fontSize: '0.85rem', fontWeight: 500, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                  {showWithoutErrors ? 'Sin errores' : 'Con errores'}
                </Typography>
              }
            />
            <FormControlLabel
              sx={{ alignSelf: 'center', bgcolor: 'transparent', px: 1, py: 0, borderRadius: 1, boxShadow: 'none', height: 32, display: 'flex', alignItems: 'center', flexDirection: 'row' }}
              control={
                <Switch
                  checked={showValidados}
                  onChange={(e) => setShowValidados(e.target.checked)}
                  size="small"
                  disabled={showTodos}
                  sx={{
                    width: 38,
                    height: 22,
                    p: 0.5,
                    '& .MuiSwitch-switchBase': {
                      color: showTodos ? '#888' : (showValidados ? '#4caf50' : '#FFD700'),
                      padding: 0.5,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: showTodos ? '#888' : '#4caf50',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#888' : '#4caf50',
                      opacity: 0.7,
                    },
                    '& .MuiSwitch-switchBase + .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#888' : '#FFD700',
                      opacity: 0.7,
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#888' : (showValidados ? '#4caf50' : '#FFD700'),
                      borderRadius: 11,
                      opacity: 0.5,
                    },
                    '& .MuiSwitch-thumb': {
                      boxShadow: 'none',
                      width: 16,
                      height: 16,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: showTodos ? '#888' : (showValidados ? '#4caf50' : '#FFD700'), fontSize: '0.85rem', fontWeight: 500, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                  {showValidados ? 'Validados' : 'Sin validar'}
                </Typography>
              }
            />
            <FormControlLabel
              sx={{ alignSelf: 'center', bgcolor: 'transparent', px: 1, py: 0, borderRadius: 1, boxShadow: 'none', height: 32 }}
              control={
                <Switch
                  checked={showTodos}
                  onChange={(e) => setShowTodos(e.target.checked)}
                  size="small"
                  sx={{
                    width: 38,
                    height: 22,
                    p: 0.5,
                    '& .MuiSwitch-switchBase': {
                      color: showTodos ? '#2196f3' : '#888',
                      padding: 0.5,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#2196f3',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#2196f3',
                      opacity: 0.7,
                    },
                    '& .MuiSwitch-track': {
                      backgroundColor: showTodos ? '#2196f3' : '#888',
                      borderRadius: 11,
                      opacity: 0.5,
                    },
                    '& .MuiSwitch-thumb': {
                      boxShadow: 'none',
                      width: 16,
                      height: 16,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: showTodos ? '#2196f3' : '#888', fontSize: '0.85rem', fontWeight: 500 }}>
                  Mostrar todos
                </Typography>
              }
            />
          </Box>
          {/* Espacio vacío y grupo derecho: Actualizar, CSV, PDF */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 300, justifyContent: 'flex-end', flex: 1 }}>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="outlined"
              onClick={fetchCierres}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{
                color: '#ffffff',
                borderColor: '#444',
                '&:hover': { borderColor: '#888' },
                height: '36px',
                fontSize: '0.95rem',
                borderRadius: 2,
                px: 1.5,
              }}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            <Button variant="outlined" size="small" sx={{ borderRadius: 2, minWidth: 40, px: 1, fontSize: '0.85rem', color: '#fff', borderColor: '#fff', bgcolor: '#222', '&:hover': { bgcolor: '#444', borderColor: '#fff' } }} onClick={handleExportCSV}>CSV</Button>
            <Button variant="outlined" size="small" sx={{ borderRadius: 2, minWidth: 40, px: 1, fontSize: '0.85rem', color: '#D16D6D', borderColor: '#D16D6D', bgcolor: '#222', '&:hover': { bgcolor: '#3a2323', borderColor: '#D16D6D' } }} onClick={handleExportPDF}>PDF</Button>
          </Box>
        </Card>

        {/* Fila principal: TiendaCards */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', overflowX: 'auto', width: '100%' }}>
          {tiendasAMostrar.map((stats) => (
            <Box key={stats.tienda} sx={{ display: 'flex', alignItems: 'stretch', flex: '1 1 180px', minWidth: '180px', maxWidth: '220px' }}>
              <TiendaCard
                tienda={stats.tienda}
                totalCierres={stats.totalCierres}
                cierresConErrores={stats.cierresConErrores}
                totalDiferencia={stats.totalDiferencia}
                todosCierres={stats.todosCierres}
                onClick={() => handleTiendaClick(stats.tienda)}
                isSelected={selectedCard === stats.tienda}
              />
            </Box>
          ))}
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
                          '&.Mui-checked': { color: '#A3BE8C' } 
                        }} 
                        checked={selectedCierres.length > 0 && selectedCierresIds.size === selectedCierres.filter(c => !c.validado).length} 
                        indeterminate={selectedCierresIds.size > 0 && selectedCierresIds.size < selectedCierres.filter(c => !c.validado).length} 
                        onChange={(e) => handleSelectAll(e.target.checked)} 
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff', width: 50 }}>Ver</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>ID</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Fecha</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Usuario</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Estado</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>Validación</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>
                      <Tooltip title="Diferencia total del cierre antes de ajustes" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span>Diferencia Total</span>
                          <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.7rem', color: '#88C0D0' }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>
                      <Tooltip title="Total de todas las justificaciones realizadas" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span>Diferencia Justificada</span>
                          <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.7rem', color: '#88C0D0' }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }}>
                      <Tooltip title="Saldo sin justificar (Diferencia Total - Justificaciones)" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span>Saldo Sin Justificar</span>
                          <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.7rem', color: '#88C0D0' }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }} align="center">Justif.</TableCell>
                    <TableCell sx={{ bgcolor: '#3a3a3a', color: '#ffffff' }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCierres.map((cierre) => (
                    <CierreRow
                      key={cierre.id}
                      cierre={cierre}
                      isSelected={selectedCierresIds.has(cierre.id)}
                      handleCheckboxChange={handleCheckboxChange}
                      handleMarcarRevisar={handleMarcarRevisar}
                      formatMoney={formatMoney}
                      setModalDetalle={setModalDetalle}
                    />
                  ))}
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
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Facturado:</strong> <ExactValue value={processNumericValue(modalDetalle.total_facturado)} /></Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Cobrado:</strong> <ExactValue value={processNumericValue(modalDetalle.total_cobrado)} /></Typography>
                  <Typography variant="body1" sx={{ color: '#ffffff' }}><strong>Diferencia:</strong> <ExactValue value={modalDetalle.grand_difference_total} /></Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>Validación</Typography>
                  {modalDetalle.validado ? (
                    <Box>
                      <Chip icon={<CheckCircleIcon />} label="Validado" color="success" sx={{ mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#4caf50' }}>
                        Usuario: {modalDetalle.usuario_validacion}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#4caf50' }}>
                        Fecha: {modalDetalle.fecha_validacion}
                      </Typography>
                    </Box>
                  ) : (
                    <Chip icon={<ErrorIcon />} label="Sin validar" color="error" />
                  )}
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
                      {modalDetalle.medios_pago.map((m, i) => {
                        return (
                          <TableRow key={m.medio ? m.medio + '-' + i : i} sx={{ bgcolor: '#2a2a2a' }}>
                            <TableCell sx={{ color: '#ffffff' }}>{m.medio}</TableCell>
                            <TableCell align="right" sx={{ color: '#ffffff' }}>$ {m.facturado}</TableCell>
                            <TableCell align="right" sx={{ color: '#ffffff' }}>$ {m.cobrado}</TableCell>
                            <TableCell align="right" sx={{ color: '#ffffff' }}>$ {m.differenceVal}</TableCell>
                          </TableRow>
                        );
                      })}
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
                          // Limpiar el string: remover $ y espacios, luego procesar formato argentino
                          monto = monto.replace(/\$/g, '').trim();
                          // En formato argentino: punto = separador de miles, coma = separador decimal
                          // Ej: "20.500" = 20500, "20.500,50" = 20500.50, "20,50" = 20.50
                          if (monto.includes(',')) {
                            // Tiene coma decimal: "20.500,50" -> partes: ["20.500", "50"]
                            const partes = monto.split(',');
                            const entero = partes[0].replace(/\./g, ''); // Remover puntos de miles
                            const decimal = partes[1] || '0';
                            monto = entero + '.' + decimal;
                          } else {
                            // No tiene coma decimal: "20.500" -> 20500 (punto como separador de miles)
                            monto = monto.replace(/\./g, '');
                          }
                        }
                        const numeroMonto = Number(monto);
                        const montoValido = !isNaN(numeroMonto) ? numeroMonto : 0;
                        
                        return (
                          <TableRow key={j.id ? j.id : `${j.motivo}-${j.cliente}-${j.orden}-${i}`} sx={{ bgcolor: '#2a2a2a' }}>
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