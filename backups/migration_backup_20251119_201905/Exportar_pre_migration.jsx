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
  FormGroup,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Popover,
  TextField
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
  Info as InfoIcon,
  FilterAltOff as FilterAltOffIcon,
  CreditCard as CreditCardIcon,
  Tune as TuneIcon,
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';
import { DateRangePicker } from 'react-date-range';
import { es } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import moment from 'moment';
import axios from 'axios';
import { fetchWithFallback, axiosWithFallback } from '../config';
import { formatCurrency as formatCurrencyGlobal, normalizeNumber as normalizeNumberGlobal } from '../utils/numberFormat';

// Función para formatear moneda (unificada)
const formatCurrency = (value) => formatCurrencyGlobal(value);

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
    color: 'success.main',
    bgColor: 'success.light',
  },
  DIFERENCIA_MENOR: {
    label: 'Diferencia menor',
    icon: <WarningIcon color="warning" />,
    color: 'warning.main',
    bgColor: 'warning.light',
  },
  DIFERENCIA_GRAVE: {
    label: 'Diferencia grave',
    icon: <ErrorIcon color="error" />,
    color: 'error.main',
    bgColor: 'error.light',
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
const processNumericValue = (value) => normalizeNumberGlobal(value);

// Función específica para procesar valores de ajuste y monto_dif
const processAjusteValue = (ajuste, monto_dif) => {
  // Con la nueva implementación, los valores deberían venir como números desde la DB
  // Pero mantenemos compatibilidad por si hay valores legacy
  
  // Intentar procesar ajuste primero
  if (ajuste !== null && ajuste !== undefined && ajuste !== '') {
    if (typeof ajuste === 'number') return ajuste;
    if (typeof ajuste === 'string') {
      // Limpiar string: remover espacios, convertir puntos de miles y comas decimales
      const cleaned = ajuste
        .trim()
        .replace(/\s+/g, '') // Remover espacios
        .replace(/\./g, '')  // Remover puntos de miles (formato español)
        .replace(',', '.');   // Convertir coma decimal a punto
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) return parsed;
    }
  }
  
  // Si ajuste no es válido, intentar con monto_dif (campo legacy)
  if (monto_dif !== null && monto_dif !== undefined && monto_dif !== '') {
    if (typeof monto_dif === 'number') return monto_dif;
    if (typeof monto_dif === 'string') {
      const cleaned = monto_dif
        .trim()
        .replace(/\s+/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) return parsed;
    }
  }
  
  return 0; // Valor por defecto
};

// Utilidad para describir medios de pago combinando objeto y texto legible
const formatMediosPagoDetalle = (mediosPagoRaw) => {
  if (!mediosPagoRaw) return 'Sin declarar';
  if (typeof mediosPagoRaw === 'string') {
    try {
      const parsed = JSON.parse(mediosPagoRaw);
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([medio, valor]) => `${medio}: ${formatCurrency(processNumericValue(valor) || valor || 0)}`)
          .join(' | ');
      }
      return mediosPagoRaw;
    } catch (err) {
      return mediosPagoRaw;
    }
  }
  if (typeof mediosPagoRaw === 'object') {
    return Object.entries(mediosPagoRaw)
      .map(([medio, valor]) => `${medio}: ${formatCurrency(processNumericValue(valor) || valor || 0)}`)
      .join(' | ');
  }
  return 'Sin declarar';
};

const slugify = (text) =>
  (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[^\p{ASCII}]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'datos';

const CIERRE_COLUMN_DEFINITIONS = [
  { id: 'id', label: 'ID cierre', group: 'Datos base', getValue: (cierre) => cierre.id || '' },
  { id: 'fecha', label: 'Fecha', group: 'Datos base', getValue: (cierre) => cierre.fecha || '' },
  { id: 'tienda', label: 'Tienda', group: 'Datos base', getValue: (cierre) => cierre.tienda || '' },
  { id: 'usuario', label: 'Usuario', group: 'Datos base', getValue: (cierre) => cierre.usuario || '' },
  { id: 'total_billetes', label: 'Total billetes', group: 'Montos', getValue: (cierre) => formatCurrency(cierre.total_billetes || 0) },
  { id: 'brinks_total', label: 'Brinks', group: 'Montos', getValue: (cierre) => formatCurrency(cierre.brinks_total || 0) },
  { id: 'grand_difference_total', label: 'Diferencia', group: 'Montos', getValue: (cierre) => formatCurrency(cierre.grand_difference_total || 0) },
  { id: 'balance_sin_justificar', label: 'Balance sin justificar', group: 'Montos', getValue: (cierre) => formatCurrency(cierre.balance_sin_justificar || 0) },
  { id: 'estado', label: 'Estado cierre', group: 'Seguimiento', getValue: (cierre) => getEstado(cierre).label },
  { id: 'validado', label: 'Validación', group: 'Seguimiento', getValue: (cierre) => getValidacionInfo(cierre).label },
  { id: 'usuario_validacion', label: 'Usuario validación', group: 'Seguimiento', getValue: (cierre) => cierre.usuario_validacion || '-' },
  { id: 'fecha_validacion', label: 'Fecha validación', group: 'Seguimiento', getValue: (cierre) => cierre.fecha_validacion || '-' },
  { id: 'responsable', label: 'Responsable', group: 'Seguimiento', getValue: (cierre) => cierre.responsable || '-' },
  { id: 'comentarios', label: 'Comentarios', group: 'Seguimiento', getValue: (cierre) => cierre.comentarios || '-' },
  { id: 'medios_pago', label: 'Medios de pago', group: 'Montos', getValue: (cierre) => formatMediosPagoDetalle(cierre.medios_pago) },
  { id: 'justificaciones_count', label: '# Justificaciones', group: 'Justificaciones', getValue: (cierre) => (cierre.justificaciones?.length || 0) },
  {
    id: 'justificaciones_total',
    label: 'Total ajustado en justific.',
    group: 'Justificaciones',
    getValue: (cierre) => {
      const total = (cierre.justificaciones || []).reduce(
        (acc, just) => acc + processAjusteValue(just.ajuste, just.monto_dif),
        0
      );
      return formatCurrency(total);
    }
  },
];

const JUSTIFICACION_COLUMN_DEFINITIONS = [
  { id: 'just_id', label: 'ID justificación', getValue: (_, just) => just?.id || '' },
  { id: 'just_fecha', label: 'Fecha justificación', getValue: (_, just) => just?.fecha ? moment(just.fecha).format('DD/MM/YYYY') : '' },
  { id: 'just_usuario', label: 'Usuario justificación', getValue: (_, just) => just?.usuario || '' },
  { id: 'just_cliente', label: 'Cliente', getValue: (_, just) => just?.cliente || '' },
  { id: 'just_orden', label: 'Orden', getValue: (_, just) => just?.orden || '' },
  { id: 'just_medio', label: 'Medio de pago', getValue: (_, just) => just?.medio_pago || '' },
  { id: 'just_motivo', label: 'Motivo', getValue: (_, just) => just?.motivo || '' },
  {
    id: 'just_ajuste',
    label: 'Ajuste',
    getValue: (_, just) => (just ? formatCurrency(processAjusteValue(just.ajuste, just.monto_dif)) : formatCurrency(0))
  },
];

// NUEVO: función para mostrar estado de validación
// validado = 0: Sin validar
// validado = 1: Validado
// validado = 2: Revisar Boutique
function getValidacionInfo(cierre) {
  const estado = Number(cierre.validado) || 0;
  
  if (estado === 1) {
    return {
      label: 'Validado',
      icon: <CheckCircleIcon color="success" fontSize="small" />,
      color: 'success.main',
      usuario: cierre.usuario_validacion,
      fecha: cierre.fecha_validacion
    };
  }
  
  if (estado === 2) {
    return {
      label: 'Revisar Boutique',
      icon: <WarningIcon color="warning" fontSize="small" />,
      color: 'warning.main',
      usuario: cierre.usuario_validacion,
      fecha: cierre.fecha_validacion
    };
  }
  
  return {
    label: 'Sin validar',
    icon: <ErrorIcon color="error" fontSize="small" />,
    color: 'error.main',
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
  onClick 
}) {
  const theme = useTheme();
  const porcentajeErrores = totalCierres > 0 ? (cierresConErrores / totalCierres) * 100 : 0;
  
  // Usar colores del tema basados en porcentaje de errores
  const getCardColor = () => {
    return theme.palette.background.paper;
  };

  const getAccentColor = () => {
    if (porcentajeErrores === 0) return theme.palette.success.main;
    if (porcentajeErrores <= 20) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getTextColor = () => {
    return theme.palette.text.primary;
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
                  color: totalDiferencia > 0 ? theme.palette.negative.main : theme.palette.positive.main,
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

// Componente compacto para DateRangePicker
const CompactDateRangePicker = React.memo(function CompactDateRangePicker({ 
  fechaDesde, 
  fechaHasta, 
  onChange, 
  disabled,
  theme 
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selection, setSelection] = useState({
    startDate: fechaDesde ? fechaDesde.toDate() : new Date(),
    endDate: fechaHasta ? fechaHasta.toDate() : new Date(),
    key: 'selection'
  });

  const handleClick = (event) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (ranges) => {
    const { startDate, endDate } = ranges.selection;
    setSelection(ranges.selection);
    onChange(moment(startDate), moment(endDate));
  };

  const open = Boolean(anchorEl);
  const displayText = fechaDesde && fechaHasta 
    ? `${fechaDesde.format('DD/MM/YY')} - ${fechaHasta.format('DD/MM/YY')}`
    : 'Seleccionar rango';

  return (
    <>
      <TextField
        size="small"
        value={displayText}
        onClick={handleClick}
        disabled={disabled}
        placeholder="Desde - Hasta"
        InputProps={{
          readOnly: true,
          sx: {
            cursor: disabled ? 'default' : 'pointer',
            height: 40,
            backgroundColor: alpha(theme.palette.background.paper, 0.85),
            color: theme.palette.text.primary,
          }
        }}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.custom?.tableBorder || theme.palette.divider,
          },
          '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: disabled ? undefined : theme.palette.primary.main,
          },
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 0.5,
            boxShadow: 3,
            backgroundColor: '#fff',
            '& .rdrCalendarWrapper': {
              backgroundColor: '#fff',
              color: '#000',
            },
            '& .rdrMonth': {
              width: '280px',
            },
            '& .rdrMonthAndYearWrapper': {
              backgroundColor: '#fff',
              color: '#000',
            },
            '& .rdrMonthPicker select, & .rdrYearPicker select': {
              backgroundColor: '#fff',
              color: '#000',
            },
            '& .rdrWeekDay': {
              color: '#000',
            },
            '& .rdrDayToday .rdrDayNumber span:after': {
              backgroundColor: theme.palette.primary.main,
            },
            '& .rdrDay': {
              color: '#000',
            },
            '& .rdrDayNumber span': {
              color: '#000',
            },
            '& .rdrDayDisabled': {
              backgroundColor: 'transparent',
            },
            '& .rdrDayPassive .rdrDayNumber span': {
              color: '#d5dce0',
            },
          }
        }}
      >
        <DateRangePicker
          ranges={[selection]}
          onChange={handleSelect}
          locale={es}
          months={2}
          direction="horizontal"
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          rangeColors={[theme.palette.primary.main]}
        />
      </Popover>
    </>
  );
});

export default function ControlMensual() {
  const theme = useTheme();
  
  // Estados
  const [fechaDesde, setFechaDesde] = useState(moment().startOf('month'));
  const [fechaHasta, setFechaHasta] = useState(moment().endOf('month'));
  const [tiendas, setTiendas] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]); // NUEVO: Lista de medios de pago
  const [allJustificaciones, setAllJustificaciones] = useState([]);
  const [filteredJustificaciones, setFilteredJustificaciones] = useState([]);
  const [allCierres, setAllCierres] = useState([]); // NUEVO: Todos los cierres completos
  const [filteredCierres, setFilteredCierres] = useState([]); // NUEVO: Cierres filtrados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [selectedMedioPago, setSelectedMedioPago] = useState(null); // NUEVO: Filtro por medio de pago
  const [selectedUsuario, setSelectedUsuario] = useState(null); // NUEVO: Filtro por usuario
  const [usuarios, setUsuarios] = useState([]); // NUEVO: Lista de usuarios
  const [modalDetalle, setModalDetalle] = useState(null);
  const [tabValue, setTabValue] = useState(0); // 0: Justificaciones, 1: Cierres, 2: Medios de Pago, 3: Resúmenes
  const [exportDataset, setExportDataset] = useState('cierres');
  const [selectedCierreColumns, setSelectedCierreColumns] = useState(CIERRE_COLUMN_DEFINITIONS.map((col) => col.id));
  const [selectedJustColumns, setSelectedJustColumns] = useState(JUSTIFICACION_COLUMN_DEFINITIONS.map((col) => col.id));
  const [expandirJustificaciones, setExpandirJustificaciones] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedMediosPagoFilter, setSelectedMediosPagoFilter] = useState([]);

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
        // No cargar motivos aquí, se cargarán desde las justificaciones
      } catch (err) {
        console.error('Error al cargar configuración:', err);
        showSnackbar('Error al cargar la configuración inicial.', 'error');
      }
    };
    loadConfig();
  }, [showSnackbar]);

  // Función para cargar justificaciones del rango de fechas seleccionado
  const fetchJustificaciones = useCallback(async () => {
    setLoading(true);
    setError('');
    
    const pad = (n) => n.toString().padStart(2, '0');
    const fechaDesdeStr = `${pad(fechaDesde.date())}/${pad(fechaDesde.month() + 1)}/${fechaDesde.year()}`;
    const fechaHastaStr = `${pad(fechaHasta.date())}/${pad(fechaHasta.month() + 1)}/${fechaHasta.year()}`;
    
    const params = {
      fechaDesde: fechaDesdeStr,
      fechaHasta: fechaHastaStr,
    };
    
    try {
      console.log('🔄 Cargando datos completos del período:', params);
      const response = await axiosWithFallback('/api/cierres-completo', { 
        params,
        timeout: 30000 // 30 segundos timeout
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Formato de respuesta inválido del servidor');
      }
      
      console.log(`✅ Datos cargados: ${response.data.length} cierres`);
      
      // NUEVO: Guardar todos los cierres completos para exportación
      const cierresCompletos = response.data.map(cierre => ({
        ...cierre,
        fechaMoment: moment(cierre.fecha, 'DD/MM/YYYY')
      }));
      setAllCierres(cierresCompletos);
      
      // Extraer todas las justificaciones de los cierres
      const todasJustificaciones = [];
      response.data.forEach((cierre) => {
        if (cierre.justificaciones && Array.isArray(cierre.justificaciones)) {
          cierre.justificaciones.forEach((justificacion) => {
            // Procesar fecha del cierre para usar en justificaciones
            let fechaFormateada = cierre.fecha;
            if (/^\d{4}-\d{2}-\d{2}$/.test(fechaFormateada)) {
              const [y, m, d] = fechaFormateada.split('-');
              fechaFormateada = `${pad(d)}/${pad(m)}/${y}`;
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(fechaFormateada)) {
              const [d, m, y] = fechaFormateada.split('-');
              fechaFormateada = `${pad(d)}/${pad(m)}/${y}`;
            }
            
            todasJustificaciones.push({
              ...justificacion,
              fecha: moment(fechaFormateada, 'DD/MM/YYYY'),
              tienda: cierre.tienda,
              usuario: justificacion.usuario || cierre.usuario, // Usar usuario de justificación o del cierre
              validado: cierre.validado || false, // Información de validación del cierre
              usuario_validacion: cierre.usuario_validacion || null,
              fecha_validacion: cierre.fecha_validacion || null,
              medio_pago: justificacion.medio_pago || '', // Agregado para asegurar que se incluya medio_pago
            });
          });
        }
      });
      
      setAllJustificaciones(todasJustificaciones);
      
      // Extraer motivos únicos de las justificaciones para el filtro
      const motivosUnicos = [...new Set(todasJustificaciones.map(j => j.motivo).filter(Boolean))];
      setMotivos(motivosUnicos);
      
      // NUEVO: Extraer medios de pago únicos de los CIERRES (no justificaciones)
      const mediosPagoSet = new Set();
      response.data.forEach(cierre => {
        if (cierre.medios_pago) {
          const medios = typeof cierre.medios_pago === 'string' 
            ? JSON.parse(cierre.medios_pago) 
            : cierre.medios_pago;
          if (Array.isArray(medios)) {
            medios.forEach(medio => {
              if (medio.medio) mediosPagoSet.add(medio.medio);
            });
          }
        }
      });
      const mediosPagoUnicos = [...mediosPagoSet].sort();
      setMediosPago(mediosPagoUnicos);
      
      // NUEVO: Extraer usuarios únicos de las justificaciones
      const usuariosUnicos = [...new Set(todasJustificaciones.map(j => j.usuario).filter(Boolean))].sort();
      setUsuarios(usuariosUnicos);
      
      console.log(`📊 Procesados: ${todasJustificaciones.length} justificaciones, ${mediosPagoUnicos.length} medios de pago, ${usuariosUnicos.length} usuarios`);
      showSnackbar(`Datos cargados: ${response.data.length} cierres, ${todasJustificaciones.length} justificaciones`, 'success');
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Error desconocido';
      const errorDetail = err?.response?.status ? ` (HTTP ${err.response.status})` : '';
      setError(`Error al cargar datos del servidor${errorDetail}: ${errorMsg}`);
      showSnackbar(`Error: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, showSnackbar]);

  // Filtrar justificaciones según los filtros seleccionados
  useEffect(() => {
    let filtered = allJustificaciones;
    
    if (selectedTienda) {
      filtered = filtered.filter(justificacion => justificacion.tienda === selectedTienda);
    }
    
    // NUEVO: Filtro por medio de pago
    if (selectedMedioPago) {
      filtered = filtered.filter(justificacion => justificacion.medio_pago === selectedMedioPago);
    }
    
    // NUEVO: Filtro por usuario
    if (selectedUsuario) {
      filtered = filtered.filter(justificacion => justificacion.usuario === selectedUsuario);
    }
    
    setFilteredJustificaciones(filtered);
  }, [selectedTienda, selectedMedioPago, selectedUsuario, allJustificaciones]);

  // NUEVO: Filtrar cierres completos según los filtros seleccionados
  useEffect(() => {
    let filtered = allCierres;
    
    if (selectedTienda) {
      filtered = filtered.filter(cierre => cierre.tienda === selectedTienda);
    }
    
    if (selectedUsuario) {
      filtered = filtered.filter(cierre => cierre.usuario === selectedUsuario);
    }
    
    setFilteredCierres(filtered);
  }, [selectedTienda, selectedUsuario, allCierres]);

  const tiendaEtiqueta = selectedTienda || 'todas';
  const periodoSlug = `${slugify(tiendaEtiqueta)}_${fechaDesde.format('DDMMYY')}-${fechaHasta.format('DDMMYY')}`;

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Función helper para obtener el texto del estado de validación
  const getValidacionTexto = (validado) => {
    const estado = Number(validado) || 0;
    if (estado === 1) return 'Validado';
    if (estado === 2) return 'Revisar Boutique';
    return 'Sin validar';
  };

  const years = useMemo(() => {
    const currentYear = moment().year();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // NUEVO: Función para limpiar todos los filtros
  const handleLimpiarFiltros = useCallback(() => {
    setSelectedTienda(null);
    setSelectedMotivo(null);
    setSelectedMedioPago(null);
    setSelectedUsuario(null);
    showSnackbar('Filtros limpiados', 'info');
  }, [showSnackbar]);

  // Calcular datos agregados por medio de pago
  const datosMediosPago = useMemo(() => {
    const agrupadoPorMedio = {};
    
    filteredJustificaciones.forEach(just => {
      const medio = just.medio_pago || 'Sin especificar';
      if (!agrupadoPorMedio[medio]) {
        agrupadoPorMedio[medio] = {
          medio_pago: medio,
          cantidad: 0,
          total: 0,
          transacciones: []
        };
      }
      agrupadoPorMedio[medio].cantidad++;
      agrupadoPorMedio[medio].total += processAjusteValue(just.ajuste, just.monto_dif);
      agrupadoPorMedio[medio].transacciones.push(just);
    });
    
    return Object.values(agrupadoPorMedio).sort((a, b) => b.total - a.total);
  }, [filteredJustificaciones]);

  // Calcular resúmenes estadísticos
  const resumenEstadisticas = useMemo(() => {
    // Por tienda
    const porTienda = {};
    filteredCierres.forEach(cierre => {
      const tienda = cierre.tienda;
      if (!porTienda[tienda]) {
        porTienda[tienda] = {
          tienda,
          cantidad_cierres: 0,
          total_billetes: 0,
          total_brinks: 0,
          total_diferencia: 0,
          cierres_con_error: 0,
          cierres_validados: 0
        };
      }
      porTienda[tienda].cantidad_cierres++;
      porTienda[tienda].total_billetes += cierre.total_billetes || 0;
      porTienda[tienda].total_brinks += cierre.brinks_total || 0;
      porTienda[tienda].total_diferencia += cierre.grand_difference_total || 0;
      if ((cierre.grand_difference_total || 0) !== 0) porTienda[tienda].cierres_con_error++;
      if (cierre.validado === 1) porTienda[tienda].cierres_validados++;
    });
    
    // Por usuario
    const porUsuario = {};
    filteredCierres.forEach(cierre => {
      const usuario = cierre.usuario;
      if (!porUsuario[usuario]) {
        porUsuario[usuario] = {
          usuario,
          cantidad_cierres: 0,
          total_diferencia: 0,
          cierres_perfectos: 0,
          cierres_con_error: 0
        };
      }
      porUsuario[usuario].cantidad_cierres++;
      porUsuario[usuario].total_diferencia += Math.abs(cierre.grand_difference_total || 0);
      if ((cierre.grand_difference_total || 0) === 0) {
        porUsuario[usuario].cierres_perfectos++;
      } else {
        porUsuario[usuario].cierres_con_error++;
      }
    });
    
    // Totales generales
    const totales = {
      total_cierres: filteredCierres.length,
      total_justificaciones: filteredJustificaciones.length,
      suma_ajustes: filteredJustificaciones.reduce((sum, j) => sum + processAjusteValue(j.ajuste, j.monto_dif), 0),
      suma_diferencias: filteredCierres.reduce((sum, c) => sum + (c.grand_difference_total || 0), 0),
      cierres_perfectos: filteredCierres.filter(c => (c.grand_difference_total || 0) === 0).length,
      cierres_validados: filteredCierres.filter(c => c.validado === 1).length
    };
    
    return {
      porTienda: Object.values(porTienda).sort((a, b) => b.cantidad_cierres - a.cantidad_cierres),
      porUsuario: Object.values(porUsuario).sort((a, b) => b.cantidad_cierres - a.cantidad_cierres),
      totales
    };
  }, [filteredCierres, filteredJustificaciones]);

  const detailedCierresRows = useMemo(() => {
    return filteredCierres.flatMap((cierre) => {
      const justificaciones = cierre.justificaciones || [];
      if (expandirJustificaciones && justificaciones.length > 0) {
        return justificaciones.map((just) => ({ cierre, justificacion: just }));
      }
      return [{ cierre, justificacion: null }];
    });
  }, [filteredCierres, expandirJustificaciones]);

  const activeCierreColumns = useMemo(
    () => CIERRE_COLUMN_DEFINITIONS.filter((col) => selectedCierreColumns.includes(col.id)),
    [selectedCierreColumns]
  );

  const activeJustColumns = useMemo(
    () =>
      expandirJustificaciones
        ? JUSTIFICACION_COLUMN_DEFINITIONS.filter((col) => selectedJustColumns.includes(col.id))
        : [],
    [selectedJustColumns, expandirJustificaciones]
  );

  const toggleCierreColumn = useCallback((columnId) => {
    setSelectedCierreColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  }, []);

  const toggleJustColumn = useCallback((columnId) => {
    setSelectedJustColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  }, []);

  const summaryCards = useMemo(() => {
    const totales = resumenEstadisticas.totales || {
      total_cierres: 0,
      cierres_validados: 0,
      total_justificaciones: 0,
      suma_ajustes: 0,
      suma_diferencias: 0,
      cierres_perfectos: 0,
    };
    const sumaDiferencias = totales.suma_diferencias || 0;
    const isDark = theme.palette.mode === 'dark';
    return [
      {
        label: 'Cierres en período',
        value: totales.total_cierres,
        helper: totales.cierres_validados ? `${totales.cierres_validados} validados` : 'Sin validaciones',
        color: theme.palette.primary.main,
        borderColor: isDark ? 'rgba(112, 92, 223, 0.3)' : 'rgba(31, 43, 204, 0.3)',
        shadowColor: isDark ? 'rgba(112, 92, 223, 0.25)' : 'rgba(31, 43, 204, 0.25)'
      },
      {
        label: 'Justificaciones asociadas',
        value: totales.total_justificaciones,
        helper: `${formatCurrency(totales.suma_ajustes || 0)} en ajustes`,
        color: theme.palette.info.main,
        borderColor: isDark ? 'rgba(136, 192, 208, 0.3)' : 'rgba(2, 136, 209, 0.3)',
        shadowColor: isDark ? 'rgba(136, 192, 208, 0.25)' : 'rgba(2, 136, 209, 0.25)'
      },
      {
        label: 'Suma diferencias',
        value: formatCurrency(sumaDiferencias),
        helper: `${totales.cierres_perfectos} cierres perfectos`,
        color: sumaDiferencias >= 0 ? theme.palette.warning.main : theme.palette.success.main,
        borderColor: sumaDiferencias >= 0 
          ? (isDark ? 'rgba(255, 152, 0, 0.3)' : 'rgba(237, 108, 2, 0.3)')
          : (isDark ? 'rgba(163, 190, 140, 0.3)' : 'rgba(46, 125, 50, 0.3)'),
        shadowColor: sumaDiferencias >= 0
          ? (isDark ? 'rgba(255, 152, 0, 0.25)' : 'rgba(237, 108, 2, 0.25)')
          : (isDark ? 'rgba(163, 190, 140, 0.25)' : 'rgba(46, 125, 50, 0.25)')
      },
      {
        label: 'Datos exportables',
        value: detailedCierresRows.length,
        helper: exportDataset === 'cierres_detallados' ? 'Incluye filas por justificación' : 'Modo resumen',
        color: theme.palette.secondary.main,
        borderColor: 'rgba(33, 150, 243, 0.3)',
        shadowColor: 'rgba(33, 150, 243, 0.25)'
      },
    ];
  }, [resumenEstadisticas, detailedCierresRows.length, exportDataset, theme.palette]);

  const buildExportDataset = () => {
    if (exportDataset === 'cierres') {
      if (!filteredCierres.length) return { error: 'No hay cierres para exportar.' };
      if (!activeCierreColumns.length) return { error: 'Seleccioná al menos una columna antes de exportar.' };
      const columns = activeCierreColumns.map(col => col.label);
      const rows = filteredCierres.map((cierre) =>
        activeCierreColumns.map((col) => col.getValue(cierre, null))
      );
      return {
        columns,
        rows,
        filename: `${slugify('cierres')}_${periodoSlug}`,
        sheetName: 'Cierres'
      };
    }

    if (exportDataset === 'medios_pago') {
      if (!datosMediosPago.length) return { error: 'No hay datos de medios de pago.' };
      // Filtrar por medios de pago seleccionados
      const mediosFiltrados = selectedMediosPagoFilter.length > 0
        ? datosMediosPago.filter(medio => selectedMediosPagoFilter.includes(medio.medio_pago))
        : datosMediosPago;
      
      if (!mediosFiltrados.length) return { error: 'No hay datos con los medios de pago seleccionados.' };
      
      const columns = ['Medio de Pago', 'Cantidad', 'Total ($)', 'Promedio ($)'];
      const rows = mediosFiltrados.map((medio) => [
        medio.medio_pago,
        medio.cantidad,
        formatCurrency(medio.total),
        formatCurrency(medio.total / (medio.cantidad || 1))
      ]);
      return {
        columns,
        rows,
        filename: `${slugify('medios_pago')}_${periodoSlug}`,
        sheetName: 'Medios de Pago'
      };
    }

    // Default: justificaciones
    if (!filteredJustificaciones.length) return { error: 'No hay justificaciones para exportar.' };
    if (!selectedJustColumns.length) return { error: 'Seleccioná al menos una columna antes de exportar.' };
    const activeJustColumnsDefs = JUSTIFICACION_COLUMN_DEFINITIONS.filter(col => selectedJustColumns.includes(col.id));
    const columns = activeJustColumnsDefs.map(col => col.label);
    const rows = filteredJustificaciones.map((just) =>
      activeJustColumnsDefs.map((col) => col.getValue(null, just))
    );
    return {
      columns,
      rows,
      filename: `${slugify('justificaciones')}_${periodoSlug}`,
      sheetName: 'Justificaciones'
    };
  };

  // Handlers para exportar datos
  // Utilidad para exportar CSV
  const handleExportCSV = () => {
    const dataset = buildExportDataset();
    if (dataset.error) {
      showSnackbar(dataset.error, 'warning');
      return;
    }
    const { columns, rows, filename } = dataset;
    if (!rows || rows.length === 0) {
      showSnackbar('No hay datos para exportar.', 'warning');
      return;
    }

    let csvContent = '\ufeff' + columns.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSnackbar(`CSV exportado (${rows.length} filas)`, 'success');
  };

  // Utilidad para exportar Excel (XLSX)
  const handleExportXLSX = () => {
    try {
      // @ts-ignore
      if (!window.XLSX) {
        showSnackbar('No se encontró la librería XLSX. Instale SheetJS en el proyecto.', 'error');
        return;
      }
      
      let rows = [];
      let sheetName = '';
      let filename = '';
      
      // Tab 0: Justificaciones
      if (tabValue === 0) {
        if (!filteredJustificaciones || filteredJustificaciones.length === 0) {
          showSnackbar('No hay justificaciones para exportar.', 'warning');
          return;
        }
        rows = filteredJustificaciones.map(j => ({
          ID: j.id || '',
          Fecha: j.fecha ? j.fecha.format('DD/MM/YYYY') : '',
          Tienda: j.tienda || '',
          Usuario: j.usuario || '',
          Cliente: j.cliente || '',
          Orden: j.orden || '',
          Motivo: j.motivo || '',
          'Ajuste ($)': processAjusteValue(j.ajuste, j.monto_dif),
          'Medio de Pago': j.medio_pago || '',
          Validado: getValidacionTexto(j.validado)
        }));
        sheetName = 'Justificaciones';
        filename = `justificaciones_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.xlsx`;
      }
      // Tab 1: Cierres Completos
      else if (tabValue === 1) {
        if (!filteredCierres || filteredCierres.length === 0) {
          showSnackbar('No hay cierres para exportar.', 'warning');
          return;
        }
        rows = filteredCierres.map(c => ({
          ID: c.id,
          Fecha: c.fecha,
          Tienda: c.tienda,
          Usuario: c.usuario,
          'Total Billetes': c.total_billetes || 0,
          Brinks: c.brinks_total || 0,
          Diferencia: c.grand_difference_total || 0,
          Responsable: c.responsable || '',
          Validado: getValidacionTexto(c.validado)
        }));
        sheetName = 'Cierres Completos';
        filename = `cierres_completos_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.xlsx`;
      }
      // Tab 2: Medios de Pago
      else if (tabValue === 2) {
        if (!datosMediosPago || datosMediosPago.length === 0) {
          showSnackbar('No hay datos de medios de pago para exportar.', 'warning');
          return;
        }
        rows = datosMediosPago.map(m => ({
          'Medio de Pago': m.medio_pago,
          Cantidad: m.cantidad,
          'Total ($)': m.total,
          'Promedio ($)': m.total / m.cantidad
        }));
        sheetName = 'Medios de Pago';
        filename = `medios_pago_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.xlsx`;
      }
      // Tab 3: Resúmenes
      else if (tabValue === 3) {
        rows = resumenEstadisticas.porTienda.map(t => ({
          Tipo: 'Tienda',
          Nombre: t.tienda,
          'Cantidad Cierres': t.cantidad_cierres,
          'Cierres con Error': t.cierres_con_error,
          '% Error': ((t.cierres_con_error / t.cantidad_cierres) * 100).toFixed(1) + '%',
          'Diferencia Total': t.total_diferencia
        }));
        sheetName = 'Resumen';
        filename = `resumen_estadisticas_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.xlsx`;
      }
      
      // @ts-ignore
      const ws = window.XLSX.utils.json_to_sheet(rows);
      // @ts-ignore
      const wb = window.XLSX.utils.book_new();
      // @ts-ignore
      window.XLSX.utils.book_append_sheet(wb, ws, sheetName);
      // @ts-ignore
      window.XLSX.writeFile(wb, filename);
      showSnackbar('Excel exportado exitosamente', 'success');
    } catch (err) {
      console.error('Error exportando Excel:', err);
      showSnackbar('Error al exportar a Excel.', 'error');
    }
  };

  // Utilidad para exportar PDF
  const handleExportPDF = () => {
    try {
      // @ts-ignore
      if (!window.jspdf || !window.jspdf.autoTable) {
        showSnackbar('No se encontró la librería jsPDF. Instale jsPDF y jsPDF-autotable en el proyecto.', 'error');
        return;
      }
      
      // @ts-ignore
      const doc = new window.jspdf.jsPDF();
      let columns = [];
      let rows = [];
      let filename = '';
      let title = '';
      
      // Tab 0: Justificaciones
      if (tabValue === 0) {
        if (!filteredJustificaciones || filteredJustificaciones.length === 0) {
          showSnackbar('No hay justificaciones para exportar.', 'warning');
          return;
        }
        title = 'Justificaciones';
        columns = [
          { header: 'ID', dataKey: 'id' },
          { header: 'Fecha', dataKey: 'fecha' },
          { header: 'Tienda', dataKey: 'tienda' },
          { header: 'Usuario', dataKey: 'usuario' },
          { header: 'Motivo', dataKey: 'motivo' },
          { header: 'Ajuste', dataKey: 'ajuste' }
        ];
        rows = filteredJustificaciones.map(j => ({
          id: j.id || '',
          fecha: j.fecha ? j.fecha.format('DD/MM/YYYY') : '',
          tienda: j.tienda || '',
          usuario: j.usuario || '',
          motivo: (j.motivo || '').substring(0, 40),
          ajuste: formatCurrency(processAjusteValue(j.ajuste, j.monto_dif))
        }));
        filename = `justificaciones_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.pdf`;
      }
      // Tab 1: Cierres Completos
      else if (tabValue === 1) {
        if (!filteredCierres || filteredCierres.length === 0) {
          showSnackbar('No hay cierres para exportar.', 'warning');
          return;
        }
        title = 'Cierres Completos';
        columns = [
          { header: 'ID', dataKey: 'id' },
          { header: 'Fecha', dataKey: 'fecha' },
          { header: 'Tienda', dataKey: 'tienda' },
          { header: 'Usuario', dataKey: 'usuario' },
          { header: 'Diferencia', dataKey: 'diferencia' }
        ];
        rows = filteredCierres.map(c => ({
          id: c.id,
          fecha: c.fecha,
          tienda: c.tienda,
          usuario: c.usuario,
          diferencia: formatCurrency(c.grand_difference_total || 0)
        }));
        filename = `cierres_completos_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.pdf`;
      }
      // Tab 2: Medios de Pago
      else if (tabValue === 2) {
        if (!datosMediosPago || datosMediosPago.length === 0) {
          showSnackbar('No hay datos de medios de pago para exportar.', 'warning');
          return;
        }
        title = 'Resumen Medios de Pago';
        columns = [
          { header: 'Medio de Pago', dataKey: 'medio' },
          { header: 'Cantidad', dataKey: 'cantidad' },
          { header: 'Total', dataKey: 'total' },
          { header: 'Promedio', dataKey: 'promedio' }
        ];
        rows = datosMediosPago.map(m => ({
          medio: m.medio_pago,
          cantidad: m.cantidad,
          total: formatCurrency(m.total),
          promedio: formatCurrency(m.total / m.cantidad)
        }));
        filename = `medios_pago_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.pdf`;
      }
      // Tab 3: Resúmenes
      else if (tabValue === 3) {
        title = 'Resumen Estadístico';
        columns = [
          { header: 'Tienda', dataKey: 'tienda' },
          { header: 'Cierres', dataKey: 'cierres' },
          { header: 'Con Error', dataKey: 'errores' },
          { header: '% Error', dataKey: 'porcentaje' },
          { header: 'Diferencia', dataKey: 'diferencia' }
        ];
        rows = resumenEstadisticas.porTienda.map(t => ({
          tienda: t.tienda,
          cierres: t.cantidad_cierres,
          errores: t.cierres_con_error,
          porcentaje: ((t.cierres_con_error / t.cantidad_cierres) * 100).toFixed(1) + '%',
          diferencia: formatCurrency(t.total_diferencia)
        }));
        filename = `resumen_estadisticas_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.pdf`;
      }
      
      // Agregar título
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      
      // @ts-ignore
      window.jspdf.autoTable(doc, {
        columns,
        body: rows,
        startY: 25,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        theme: 'grid',
      });
      
      doc.save(filename);
      showSnackbar('PDF exportado exitosamente', 'success');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      showSnackbar('Error al exportar a PDF.', 'error');
    }
  };

  return (
    <Box
      p={3}
      sx={{
        fontFamily: 'Inter',
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        minHeight: '100vh'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary
        }}
      >
        {/* SECCIÓN 1: Filtros de período con calendario y botones de exportar */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            p: 3, 
            borderRadius: 3,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(112, 92, 223, 0.05)' : 'rgba(31, 43, 204, 0.05)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(112, 92, 223, 0.2)' : '1px solid rgba(31, 43, 204, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRangeIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                Período y Filtros
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setShowFilters(!showFilters)}
                sx={{ ml: 1 }}
              >
                {showFilters ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleExportCSV}
                startIcon={<FileDownloadIcon />}
                sx={{
                  fontSize: '0.75rem',
                  px: 1.5,
                  py: 0.5,
                  height: '28px',
                }}
              >
                CSV
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowPreview(!showPreview)}
                startIcon={<VisibilityIcon />}
                sx={{
                  fontSize: '0.75rem',
                  px: 1.5,
                  py: 0.5,
                  height: '28px',
                }}
              >
                {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
              </Button>
            </Box>
          </Box>
          
          <Collapse in={showFilters}>
            <Grid container spacing={2}>
              {/* Rango de fechas */}
              <Grid item xs={12} md={3}>
                <CompactDateRangePicker
                  fechaDesde={fechaDesde}
                  fechaHasta={fechaHasta}
                  onChange={(desde, hasta) => {
                    setFechaDesde(desde);
                    setFechaHasta(hasta);
                  }}
                  disabled={loading}
                  theme={theme}
                />
              </Grid>

              {/* Filtro de tienda */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tienda</InputLabel>
                  <Select
                    value={selectedTienda || ''}
                    onChange={(e) => setSelectedTienda(e.target.value || null)}
                    label="Tienda"
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      height: '40px',
                    }}
                  >
                    <MenuItem value="">Todas las tiendas</MenuItem>
                    {tiendas.map((tienda) => (
                      <MenuItem key={tienda} value={tienda}>
                        {tienda}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Filtro de usuario */}
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={selectedUsuario || ''}
                    onChange={(e) => setSelectedUsuario(e.target.value || null)}
                    label="Usuario"
                    sx={{
                      bgcolor: theme.palette.background.paper,
                      borderRadius: 2,
                      height: '40px',
                    }}
                  >
                    <MenuItem value="">Todos los usuarios</MenuItem>
                    {usuarios.map((usuario) => (
                      <MenuItem key={usuario} value={usuario}>
                        {usuario}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Botón cargar */}
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  onClick={fetchJustificaciones}
                  disabled={loading}
                  startIcon={loading ? null : <RefreshIcon />}
                  fullWidth
                  sx={{
                    height: '40px',
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Cargando...' : 'Cargar Datos'}
                </Button>
              </Grid>

              {/* Filtros de Medios de Pago (solo para dataset medios_pago) */}
              {exportDataset === 'medios_pago' && mediosPago.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                    Filtrar por Medios de Pago:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {mediosPago.map((medio) => (
                      <Chip
                        key={medio}
                        label={medio}
                        onClick={() => {
                          setSelectedMediosPagoFilter(prev => 
                            prev.includes(medio) 
                              ? prev.filter(m => m !== medio)
                              : [...prev, medio]
                          );
                        }}
                        color={selectedMediosPagoFilter.includes(medio) ? 'primary' : 'default'}
                        variant={selectedMediosPagoFilter.includes(medio) ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Collapse>
        </Paper>

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* SECCIÓN 2: Selección de Tipo de Exportación y Configuración de Columnas */}
        <Paper 
          elevation={0} 
          sx={{ 
            mb: 3, 
            p: 3, 
            borderRadius: 3,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.05)' : 'rgba(33, 150, 243, 0.05)',
            border: theme.palette.mode === 'dark' ? '1px solid rgba(33, 150, 243, 0.2)' : '1px solid rgba(33, 150, 243, 0.2)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TuneIcon sx={{ color: theme.palette.secondary.main }} />
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Configuración de Exportación
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                variant={exportDataset === 'cierres' ? 'contained' : 'outlined'}
                fullWidth
                startIcon={<AssignmentIcon />}
                onClick={() => setExportDataset('cierres')}
                sx={{
                  height: '56px',
                  borderRadius: 2,
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  px: 2
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Cierres
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    Configurar columnas
                  </Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant={exportDataset === 'justificaciones' ? 'contained' : 'outlined'}
                fullWidth
                startIcon={<ReceiptIcon />}
                onClick={() => setExportDataset('justificaciones')}
                sx={{
                  height: '56px',
                  borderRadius: 2,
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  px: 2
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Justificaciones
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    Configurar columnas
                  </Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant={exportDataset === 'medios_pago' ? 'contained' : 'outlined'}
                fullWidth
                startIcon={<CreditCardIcon />}
                onClick={() => setExportDataset('medios_pago')}
                sx={{
                  height: '56px',
                  borderRadius: 2,
                  fontWeight: 600,
                  justifyContent: 'flex-start',
                  px: 2
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Medios de Pago
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    Resumen por medio de pago
                  </Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>

          {/* Configuración de columnas para cierres */}
          {exportDataset === 'cierres' && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Columnas de Cierres
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setSelectedCierreColumns(CIERRE_COLUMN_DEFINITIONS.map(c => c.id))}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Seleccionar todas
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedCierreColumns([])}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Limpiar
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={1}>
                {CIERRE_COLUMN_DEFINITIONS.map((col) => (
                  <Grid item xs={6} sm={4} md={3} key={col.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedCierreColumns.includes(col.id)}
                          onChange={() => toggleCierreColumn(col.id)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {col.label}
                        </Typography>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Configuración de columnas para justificaciones */}
          {exportDataset === 'justificaciones' && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Columnas de Justificaciones
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => setSelectedJustColumns(JUSTIFICACION_COLUMN_DEFINITIONS.map(c => c.id))}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Seleccionar todas
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setSelectedJustColumns([])}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Limpiar
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={1}>
                {JUSTIFICACION_COLUMN_DEFINITIONS.map((col) => (
                  <Grid item xs={6} sm={4} md={3} key={col.id}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedJustColumns.includes(col.id)}
                          onChange={() => toggleJustColumn(col.id)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {col.label}
                        </Typography>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Info para medios de pago */}
          {exportDataset === 'medios_pago' && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Los datos de medios de pago se exportarán con todas las columnas disponibles: Medio de Pago, Cantidad, Total y Promedio.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* SECCIÓN 3: Vista Previa con Tabla de Datos */}
        <Collapse in={showPreview}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 3, 
              p: 3, 
              borderRadius: 3,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(163, 190, 140, 0.05)' : 'rgba(46, 125, 50, 0.05)',
              border: theme.palette.mode === 'dark' ? '2px solid rgba(163, 190, 140, 0.3)' : '2px solid rgba(46, 125, 50, 0.3)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TableChartIcon sx={{ color: theme.palette.success.main }} />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Previsualización de Datos
                </Typography>
              </Box>
              <Chip 
                label={`${
                  exportDataset === 'cierres' ? filteredCierres.length :
                  exportDataset === 'justificaciones' ? filteredJustificaciones.length :
                  datosMediosPago.length
                } registros`}
                color="primary"
                size="small"
              />
            </Box>
            
            <Box sx={{ 
              mb: 2,
              p: 2, 
              borderRadius: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(136, 192, 208, 0.1)' : 'rgba(2, 136, 209, 0.1)',
              border: theme.palette.mode === 'dark' ? '1px solid rgba(136, 192, 208, 0.2)' : '1px solid rgba(2, 136, 209, 0.2)'
            }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                <strong>Tipo:</strong> {exportDataset === 'cierres' ? 'Cierres' : exportDataset === 'justificaciones' ? 'Justificaciones' : 'Medios de Pago'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                <strong>Período:</strong> {fechaDesde.format('DD/MM/YY')} - {fechaHasta.format('DD/MM/YY')} {selectedTienda ? `- ${selectedTienda}` : '- Todas las tiendas'}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                <strong>Columnas:</strong> {exportDataset === 'cierres' ? selectedCierreColumns.length : exportDataset === 'justificaciones' ? selectedJustColumns.length : 'Todas'}
              </Typography>
            </Box>

            {/* Tabla de previsualización */}
            <TableContainer sx={{ maxHeight: 600, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {exportDataset === 'cierres' && activeCierreColumns.map((col) => (
                      <TableCell key={col.id} sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.paper }}>
                        {col.label}
                      </TableCell>
                    ))}
                    {exportDataset === 'justificaciones' && JUSTIFICACION_COLUMN_DEFINITIONS.filter(col => selectedJustColumns.includes(col.id)).map((col) => (
                      <TableCell key={col.id} sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.paper }}>
                        {col.label}
                      </TableCell>
                    ))}
                    {exportDataset === 'medios_pago' && ['Medio de Pago', 'Cantidad', 'Total ($)', 'Promedio ($)'].map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 'bold', bgcolor: theme.palette.background.paper }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportDataset === 'cierres' && filteredCierres.slice(0, 100).map((cierre, index) => (
                    <TableRow key={index} hover>
                      {activeCierreColumns.map((col) => (
                        <TableCell key={col.id}>
                          {col.getValue(cierre, null)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {exportDataset === 'justificaciones' && filteredJustificaciones.slice(0, 100).map((just, index) => (
                    <TableRow key={index} hover>
                      {JUSTIFICACION_COLUMN_DEFINITIONS.filter(col => selectedJustColumns.includes(col.id)).map((col) => (
                        <TableCell key={col.id}>
                          {col.getValue(null, just)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {exportDataset === 'medios_pago' && datosMediosPago
                    .filter(medio => selectedMediosPagoFilter.length === 0 || selectedMediosPagoFilter.includes(medio.medio_pago))
                    .slice(0, 100)
                    .map((medio, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{medio.medio_pago}</TableCell>
                        <TableCell>{medio.cantidad}</TableCell>
                        <TableCell>{formatCurrency(medio.total)}</TableCell>
                        <TableCell>{formatCurrency(medio.total / (medio.cantidad || 1))}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {(
              (exportDataset === 'cierres' && filteredCierres.length > 100) ||
              (exportDataset === 'justificaciones' && filteredJustificaciones.length > 100) ||
              (exportDataset === 'medios_pago' && datosMediosPago.length > 100)
            ) && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: theme.palette.text.secondary, textAlign: 'center' }}>
                Mostrando primeros 100 registros de {
                  exportDataset === 'cierres' ? filteredCierres.length :
                  exportDataset === 'justificaciones' ? filteredJustificaciones.length :
                  datosMediosPago.length
                } totales
              </Typography>
            )}
          </Paper>
        </Collapse>

        {/* SECCIÓN 4: Vista de Datos (Opcional - puede ser collapse) */}
        <Collapse in={false}>
          <Paper 
            elevation={0} 
            sx={{ 
              mb: 3, 
              p: 3, 
              borderRadius: 3,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.custom.tableBorder}`
            }}
          >
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, mb: 2 }}>
              Vista Previa de Datos
            </Typography>
            {/* Aquí iría una vista previa de los datos a exportar */}
          </Paper>
        </Collapse>
      </Paper>
      
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
