import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Paper,
  Alert,
  Snackbar,
  Divider,
  useTheme,
  Typography,
  Modal,
  Fade,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  ButtonGroup,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Store as StoreIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterListIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon
} from '@mui/icons-material';
import moment from 'moment';
import { fetchWithFallback, axiosWithFallback } from '../config';
import DetallesCierre from './DetallesCierre';

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
                color: erroresNoValidados > 0 ? theme.palette.error.main : theme.palette.success.main, 
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
                color: alpha(theme.palette.text.secondary, 0.7),
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
                color: theme.palette.success.main, 
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
                color: alpha(theme.palette.text.secondary, 0.7),
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
                color: cierresSinValidar > 0 ? theme.palette.warning.main : theme.palette.success.main, 
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
                color: alpha(theme.palette.text.secondary, 0.7),
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
          <Box sx={{ borderTop: `1px solid ${alpha(getAccentColor(), 0.2)}`, pt: 1, mt: 1, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: totalDiferencia > 0 ? theme.palette.negative.main : theme.palette.positive.main,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Diferencia Total
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: totalDiferencia > 0 ? theme.palette.negative.main : theme.palette.positive.main,
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
                    color: alpha(theme.palette.text.secondary, 0.8),
                    fontSize: '0.7rem',
                  }}
                >
                  Sin validar
                </Typography>
                <Typography 
                  variant="caption"
                  sx={{ color: theme.palette.warning.main, fontWeight: 700, fontSize: '0.8rem' }}
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
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <Checkbox
            size="small"
            checked={isSelected}
            onChange={(e) => handleCheckboxChange(cierre.id, e.target.checked)}
            disabled={false}
          />
        </TableCell>
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            disabled={numJustificaciones === 0}
            sx={{ 
              color: numJustificaciones > 0 ? theme.palette.success.main : theme.palette.text.disabled,
              '&:disabled': { color: alpha(theme.palette.text.disabled, 0.3) }
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {cierre.id}
          </Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <Typography variant="body2">{cierre.fecha.format('DD/MM/YYYY')}</Typography>
        </TableCell>
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>{cierre.usuario}</TableCell>
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
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
        <TableCell sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
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
        <TableCell align="right" sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <ExactValue value={diferencia} />
        </TableCell>
        <TableCell align="right" sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <ExactValue value={diferenciaJustificada} />
        </TableCell>
        <TableCell align="right" sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <ExactValue value={saldoSinJustificar} />
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={numJustificaciones} 
              size="small"
              sx={{
                backgroundColor: numJustificaciones > 0 ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.text.disabled, 0.2),
                color: numJustificaciones > 0 ? theme.palette.success.main : theme.palette.text.disabled,
                fontWeight: 'bold',
              }}
            />
            {numJustificaciones > 0 && (
              <Typography variant="caption" sx={{ color: theme.palette.success.main, fontSize: '0.7rem' }}>
                justif.
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: `1px solid ${theme.palette.custom.tableBorder}` }}>
          <IconButton size="small" onClick={() => setModalDetalle(cierre)}>
            <VisibilityIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: alpha(theme.palette.background.paper, 0.6), borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ color: theme.palette.text.primary, fontSize: '1rem' }}>
                Justificaciones ({numJustificaciones})
              </Typography>
              {numJustificaciones > 0 ? (
                <Table size="small" aria-label="justificaciones">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>Fecha</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>Usuario</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>Cliente</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>Orden</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>Medio de Pago</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>Motivo</TableCell>
                      <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }} align="right">Ajuste</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cierre.justificaciones.map((justificacion, index) => (
                      <TableRow key={justificacion.id || index}>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {justificacion.fecha ? moment(justificacion.fecha).format('DD/MM/YYYY') : '-'}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{justificacion.usuario || '-'}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{justificacion.cliente || '-'}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{justificacion.orden || '-'}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{justificacion.medio_pago || '-'}</TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {justificacion.motivo || 'Sin motivo'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.custom.accent, fontWeight: 'bold' }}>
                          {formatMoney(justificacion.ajuste || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
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

// Vista agrupada por usuarios
const VistaAgrupadaUsuarios = React.memo(function VistaAgrupadaUsuarios({ allCierres, theme, onUsuarioClick }) {
  // Agrupar cierres por usuario
  const datosAgrupados = useMemo(() => {
    const grupos = {};
    
    allCierres.forEach(cierre => {
      const usuario = cierre.usuario;
      if (!grupos[usuario]) {
        grupos[usuario] = {
          nombre: usuario,
          total: 0,
          correctos: 0,
          menores: 0,
          graves: 0,
          validados: 0,
          sinValidar: 0,
          diferenciaTotal: 0,
        };
      }
      
      grupos[usuario].total += 1;
      const estado = getEstado(cierre);
      if (estado === ESTADOS_CIERRE.CORRECTO) grupos[usuario].correctos += 1;
      else if (estado === ESTADOS_CIERRE.DIFERENCIA_MENOR) grupos[usuario].menores += 1;
      else grupos[usuario].graves += 1;
      
      if (cierre.validado) grupos[usuario].validados += 1;
      else grupos[usuario].sinValidar += 1;
      
      grupos[usuario].diferenciaTotal += Math.abs(Number(cierre.grand_difference_total) || 0);
    });
    
    return Object.values(grupos).sort((a, b) => b.diferenciaTotal - a.diferenciaTotal);
  }, [allCierres]);

  if (datosAgrupados.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <InfoIcon sx={{ fontSize: 60, mb: 2, color: theme.palette.text.secondary }} />
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }} gutterBottom>
          No se encontraron resultados
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {datosAgrupados.map((grupo, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
          <Paper
            elevation={2}
            onClick={() => onUsuarioClick && onUsuarioClick(grupo.nombre)}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <PersonIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {grupo.nombre}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Total cierres:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {grupo.total}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ESTADOS_CIERRE.CORRECTO.color }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                    Correctos:
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: ESTADOS_CIERRE.CORRECTO.color }}>
                  {grupo.correctos}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ESTADOS_CIERRE.DIFERENCIA_MENOR.color }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                    Menores:
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: ESTADOS_CIERRE.DIFERENCIA_MENOR.color }}>
                  {grupo.menores}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ESTADOS_CIERRE.DIFERENCIA_GRAVE.color }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.85rem' }}>
                    Graves:
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: ESTADOS_CIERRE.DIFERENCIA_GRAVE.color }}>
                  {grupo.graves}
                </Typography>
              </Box>

              <Divider sx={{ my: 0.5 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: theme.palette.success.main, fontSize: '0.85rem' }}>
                  Validados:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  {grupo.validados}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: theme.palette.warning.main, fontSize: '0.85rem' }}>
                  Sin validar:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                  {grupo.sinValidar}
                </Typography>
              </Box>
              
              <Box 
                sx={{ 
                  mt: 1, 
                  pt: 1, 
                  borderTop: `1px solid ${theme.palette.divider}`,
                  display: 'flex', 
                  justifyContent: 'space-between' 
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 'bold' }}>
                  Diferencia total:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                  {formatCurrency(grupo.diferenciaTotal)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
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
  const [showValidados, setShowValidados] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  // Estados para ordenamiento
  const [orderBy, setOrderBy] = useState('fecha'); // 'fecha', 'usuario', 'estado', 'validacion', 'diferencia'
  const [orderDirection, setOrderDirection] = useState('desc'); // 'asc' o 'desc'
  // Estados para filtros específicos
  const [estadoFilter, setEstadoFilter] = useState('todos'); // 'todos', 'correcto', 'menor', 'grave'
  const [validacionFilter, setValidacionFilter] = useState('todos'); // 'todos', 'validado', 'sin_validar', 'revisar'
  const [vistaAgrupada, setVistaAgrupada] = useState('tiendas'); // 'tiendas', 'usuarios', 'lista'

  // Función para transformar datos de cierre al formato de impresión
  const transformarDatosParaImprimir = (cierre) => {
    if (!cierre) return {};
    
    // Formatear medios de pago
    const mediosPago = cierre.medios_pago?.map(m => ({
      medio: m.medio,
      facturado: m.facturado,
      facturadoVal: m.facturado,
      cobrado: m.cobrado,
      cobradoVal: m.cobrado,
      difference: m.differenceVal,
      differenceVal: m.differenceVal
    })) || [];

    // Calcular totales
    const granTotalMedios = mediosPago.reduce((sum, m) => sum + (parseFloat(m.facturado) || 0), 0);
    const granTotalMediosCobrado = mediosPago.reduce((sum, m) => sum + (parseFloat(m.cobrado) || 0), 0);
    const balanceSinJustificar = cierre.grand_difference_total || 0;

    return {
      fecha: cierre.fecha ? cierre.fecha.format('DD/MM/YYYY') : moment().format('DD/MM/YYYY'),
      tienda: cierre.tienda || 'N/A',
      usuario: cierre.usuario || 'N/A',
      responsable: cierre.usuario || 'N/A',
      mediosPago: mediosPago,
      granTotalMedios: granTotalMedios,
      granTotalMediosCobrado: granTotalMediosCobrado,
      balanceSinJustificar: balanceSinJustificar,
      justificaciones: cierre.justificaciones?.map(j => ({
        fecha: j.fecha || cierre.fecha?.format('DD/MM/YYYY') || '',
        usuario: j.usuario || cierre.usuario || '',
        cliente: j.cliente || '',
        orden: j.orden || '',
        medio_pago: j.medio_pago || '',
        motivo: j.motivo || '',
        ajuste: j.monto_dif || j.ajuste || 0
      })) || [],
      validado: cierre.validado || false,
      usuario_validacion: cierre.usuario_validacion || '',
      fecha_validacion: cierre.fecha_validacion || '',
      comentarios: cierre.comentarios || ''
    };
  };

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

  // Efecto para aplicar filtros cuando cambian los filtros, la tienda seleccionada o la vista
  useEffect(() => {
    // Si está en vista lista, mostrar todos los cierres
    if (vistaAgrupada === 'lista') {
      console.log('📋 Vista lista: mostrando todos los cierres');
      let cierresFiltrados = allCierres;

      // Filtro por estado
      if (estadoFilter !== 'todos') {
        cierresFiltrados = cierresFiltrados.filter(cierre => {
          const estado = getEstado(cierre);
          switch (estadoFilter) {
            case 'correcto':
              return estado.label === ESTADOS_CIERRE.CORRECTO.label;
            case 'menor':
              return estado.label === ESTADOS_CIERRE.DIFERENCIA_MENOR.label;
            case 'grave':
              return estado.label === ESTADOS_CIERRE.DIFERENCIA_GRAVE.label;
            default:
              return true;
          }
        });
      }

      // Filtro por validación
      if (validacionFilter !== 'todos') {
        cierresFiltrados = cierresFiltrados.filter(cierre => {
          switch (validacionFilter) {
            case 'validado':
              return cierre.validado === true || cierre.validado === 1;
            case 'sin_validar':
              return !cierre.validado || cierre.validado === false || cierre.validado === 0;
            case 'revisar':
              return cierre.estado === 'revisar' || cierre.revisar === true || cierre.revisar === 1;
            default:
              return true;
          }
        });
      }

      setSelectedCierres(cierresFiltrados);
      setSelectedCierresIds(new Set());
    }
    // Si hay tienda seleccionada, filtrar por tienda
    else if (selectedTienda && estadisticasPorTienda.length > 0) {
      const tiendaStats = estadisticasPorTienda.find(stats => stats.tienda === selectedTienda);
      if (tiendaStats) {
        console.log('🔍 Aplicando filtros:', { estadoFilter, validacionFilter });
        console.log('📊 Total de cierres antes de filtrar:', tiendaStats.todosCierres.length);
        
        // Filtrar según los nuevos filtros
        let cierresFiltrados = tiendaStats.todosCierres;

        // Filtro por estado
        if (estadoFilter !== 'todos') {
          cierresFiltrados = cierresFiltrados.filter(cierre => {
            const estado = getEstado(cierre);
            switch (estadoFilter) {
              case 'correcto':
                return estado.label === ESTADOS_CIERRE.CORRECTO.label;
              case 'menor':
                return estado.label === ESTADOS_CIERRE.DIFERENCIA_MENOR.label;
              case 'grave':
                return estado.label === ESTADOS_CIERRE.DIFERENCIA_GRAVE.label;
              default:
                return true;
            }
          });
          console.log(`✅ Después de filtrar por estado "${estadoFilter}":`, cierresFiltrados.length);
        }

        // Filtro por validación
        if (validacionFilter !== 'todos') {
          cierresFiltrados = cierresFiltrados.filter(cierre => {
            switch (validacionFilter) {
              case 'validado':
                return cierre.validado === true || cierre.validado === 1;
              case 'sin_validar':
                return !cierre.validado || cierre.validado === false || cierre.validado === 0;
              case 'revisar':
                return cierre.estado === 'revisar' || cierre.revisar === true || cierre.revisar === 1;
              default:
                return true;
            }
          });
          console.log(`✅ Después de filtrar por validación "${validacionFilter}":`, cierresFiltrados.length);
        }

        console.log('📈 Total de cierres después de filtrar:', cierresFiltrados.length);
        setSelectedCierres(cierresFiltrados);
        setSelectedCierresIds(new Set());
      }
    }
  }, [selectedTienda, estadoFilter, validacionFilter, estadisticasPorTienda, vistaAgrupada, allCierres]);

  const handleTiendaClick = (tienda) => {
    // Si hacemos clic en la misma tienda, toggle la selección
    if (selectedCard === tienda) {
      setSelectedCard(null);
      setSelectedTienda(null);
      setSelectedCierres([]);
    } else {
      setSelectedCard(tienda);
      setSelectedTienda(tienda);
      // El useEffect se encargará de aplicar los filtros
    }
  };

  // Función para manejar el ordenamiento
  const handleSort = (column) => {
    if (orderBy === column) {
      // Si ya estamos ordenando por esta columna, invertir dirección
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nueva columna, empezar con descendente
      setOrderBy(column);
      setOrderDirection('desc');
    }
  };

  // Funciones para manejar los filtros
  const handleEstadoFilter = (value) => {
    setEstadoFilter(value);
  };

  const handleValidacionFilter = (value) => {
    setValidacionFilter(value);
  };

  // Ordenar los cierres seleccionados
  const sortedCierres = useMemo(() => {
    if (!selectedCierres || selectedCierres.length === 0) return [];
    
    const sorted = [...selectedCierres].sort((a, b) => {
      let compareA, compareB;
      
      switch (orderBy) {
        case 'fecha':
          compareA = a.fecha ? a.fecha.valueOf() : 0;
          compareB = b.fecha ? b.fecha.valueOf() : 0;
          break;
        case 'usuario':
          compareA = (a.usuario || '').toLowerCase();
          compareB = (b.usuario || '').toLowerCase();
          break;
        case 'estado':
          const estadoA = getEstado(a);
          const estadoB = getEstado(b);
          // Orden: CORRECTO < DIFERENCIA_MENOR < DIFERENCIA_GRAVE
          const estadoOrder = { 
            [ESTADOS_CIERRE.CORRECTO.label]: 0, 
            [ESTADOS_CIERRE.DIFERENCIA_MENOR.label]: 1, 
            [ESTADOS_CIERRE.DIFERENCIA_GRAVE.label]: 2 
          };
          compareA = estadoOrder[estadoA.label] || 0;
          compareB = estadoOrder[estadoB.label] || 0;
          break;
        case 'validacion':
          compareA = a.validado ? 1 : 0;
          compareB = b.validado ? 1 : 0;
          break;
        case 'diferencia':
          compareA = Math.abs(Number(a.grand_difference_total) || 0);
          compareB = Math.abs(Number(b.grand_difference_total) || 0);
          break;
        default:
          return 0;
      }
      
      if (compareA < compareB) return orderDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return orderDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [selectedCierres, orderBy, orderDirection]);

  // Función para determinar el tab activo basado en los filtros actuales
  const getCurrentTabValue = () => {
    if (showTodos) return 'todos';
    if (!showWithoutErrors && !showValidados) return 'atencion'; // Con errores, sin validar
    if (!showWithoutErrors && showValidados) return 'validados'; // Con errores, validados
    if (showWithoutErrors && !showValidados) return 'pendientes'; // Sin errores, sin validar
    return 'todos'; // Default
  };

  // Función para manejar cambios en los tabs
  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 'todos':
        setShowTodos(true);
        setShowWithoutErrors(false);
        setShowValidados(false);
        break;
      case 'atencion':
        setShowTodos(false);
        setShowWithoutErrors(false);
        setShowValidados(false);
        break;
      case 'pendientes':
        setShowTodos(false);
        setShowWithoutErrors(true);
        setShowValidados(false);
        break;
      case 'validados':
        setShowTodos(false);
        setShowWithoutErrors(false);
        setShowValidados(true);
        break;
      default:
        break;
    }
  };

  // Función para obtener el label del ordenamiento actual
  const getOrderLabel = () => {
    const labels = {
      fecha: 'Fecha',
      usuario: 'Usuario',
      estado: 'Estado',
      validacion: 'Validación',
      diferencia: 'Diferencia'
    };
    return labels[orderBy] || 'Fecha';
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
        {/* Mensajes de error primero */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* PANEL DE CONTROL - STICKY Y LIMPIO */}
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
          {/* Fila 1: Período y Actualizar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Período */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DateRangeIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>Año</InputLabel>
                <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} label="Año">
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Mes</InputLabel>
                <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} label="Mes">
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Botón Actualizar */}
            <Button
              variant="contained"
              size="small"
              onClick={fetchCierres}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>

            {/* Espaciador */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Acciones Rápidas */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                color="success"
                onClick={handleValidarDiferencias}
                disabled={selectedCierresIds.size === 0}
                startIcon={<CheckCircleIcon />}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Validar ({selectedCierresIds.size})
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handlePasarRevision}
                disabled={selectedCierresIds.size === 0}
                startIcon={<WarningIcon />}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Revisar ({selectedCierresIds.size})
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Fila 2: Filtros Específicos del Controlador */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            {/* Filtro por Estado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mr: 0.5 }}>
                Estado:
              </Typography>
              <Button
                variant={estadoFilter === 'todos' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleEstadoFilter('todos')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(estadoFilter === 'todos' && {
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                  })
                }}
              >
                Todos
              </Button>
              <Button
                variant={estadoFilter === 'correcto' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleEstadoFilter('correcto')}
                startIcon={<CheckCircleIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(estadoFilter === 'correcto' && {
                    backgroundColor: theme.palette.success.main,
                    color: '#fff',
                  })
                }}
              >
                Correcto
              </Button>
              <Button
                variant={estadoFilter === 'menor' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleEstadoFilter('menor')}
                startIcon={<WarningIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(estadoFilter === 'menor' && {
                    backgroundColor: theme.palette.warning.main,
                    color: '#fff',
                  })
                }}
              >
                Dif. Menor
              </Button>
              <Button
                variant={estadoFilter === 'grave' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleEstadoFilter('grave')}
                startIcon={<ErrorIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(estadoFilter === 'grave' && {
                    backgroundColor: theme.palette.error.main,
                    color: '#fff',
                  })
                }}
              >
                Dif. Grave
              </Button>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Filtro por Validación */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mr: 0.5 }}>
                Validación:
              </Typography>
              <Button
                variant={validacionFilter === 'todos' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleValidacionFilter('todos')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(validacionFilter === 'todos' && {
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                  })
                }}
              >
                Todos
              </Button>
              <Button
                variant={validacionFilter === 'validado' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleValidacionFilter('validado')}
                startIcon={<CheckCircleIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(validacionFilter === 'validado' && {
                    backgroundColor: theme.palette.success.main,
                    color: '#fff',
                  })
                }}
              >
                Validado
              </Button>
              <Button
                variant={validacionFilter === 'sin_validar' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleValidacionFilter('sin_validar')}
                startIcon={<InfoIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(validacionFilter === 'sin_validar' && {
                    backgroundColor: theme.palette.warning.main,
                    color: '#fff',
                  })
                }}
              >
                Sin Validar
              </Button>
              <Button
                variant={validacionFilter === 'revisar' ? "contained" : "outlined"}
                size="small"
                onClick={() => handleValidacionFilter('revisar')}
                startIcon={<AssignmentIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(validacionFilter === 'revisar' && {
                    backgroundColor: theme.palette.info.main,
                    color: '#fff',
                  })
                }}
              >
                Revisar Boutique
              </Button>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Filtro de Vista */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mr: 0.5 }}>
                Vista:
              </Typography>
              <Button
                variant={vistaAgrupada === 'tiendas' ? "contained" : "outlined"}
                size="small"
                onClick={() => setVistaAgrupada('tiendas')}
                startIcon={<StoreIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(vistaAgrupada === 'tiendas' && {
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                  })
                }}
              >
                Tiendas
              </Button>
              <Button
                variant={vistaAgrupada === 'usuarios' ? "contained" : "outlined"}
                size="small"
                onClick={() => setVistaAgrupada('usuarios')}
                startIcon={<PersonIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(vistaAgrupada === 'usuarios' && {
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                  })
                }}
              >
                Usuarios
              </Button>
              <Button
                variant={vistaAgrupada === 'lista' ? "contained" : "outlined"}
                size="small"
                onClick={() => setVistaAgrupada('lista')}
                startIcon={<ReceiptIcon />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 'auto',
                  px: 1.5,
                  fontSize: '0.8rem',
                  ...(vistaAgrupada === 'lista' && {
                    backgroundColor: theme.palette.primary.main,
                    color: '#fff',
                  })
                }}
              >
                Lista
              </Button>
            </Box>
          </Box>

          {/* Indicador de resultados */}
          {(selectedCierres.length > 0 || allCierres.length > 0) && (
            <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                {selectedCierres.length > 0
                  ? `📊 ${selectedCierres.length} cierres de ${selectedTienda || 'todas las tiendas'}`
                  : `📊 ${allCierres.length} cierres totales en ${months[selectedMonth]} ${selectedYear}`
                }
                {selectedCierresIds.size > 0 && ` • ✓ ${selectedCierresIds.size} seleccionados`}
              </Typography>

              {/* Exportación */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportCSV}
                  sx={{ textTransform: 'none', minWidth: 'auto', fontWeight: 600 }}
                >
                  CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExportPDF}
                  sx={{ textTransform: 'none', minWidth: 'auto', fontWeight: 600 }}
                >
                  PDF
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Mostrar loading o contenido */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : (
          <>
        {/* Vistas condicionales según selección */}
        {vistaAgrupada === 'usuarios' ? (
          // Vista agrupada por usuarios
          <VistaAgrupadaUsuarios 
            allCierres={allCierres}
            theme={theme}
            onUsuarioClick={(usuario) => {
              // Opcional: implementar filtrado por usuario
              console.log('Usuario seleccionado:', usuario);
            }}
          />
        ) : vistaAgrupada === 'tiendas' ? (
          // Vista agrupada por tiendas (original)
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
        ) : null}

        {/* Mensaje si no hay tiendas */}
        {tiendas.length === 0 && vistaAgrupada !== 'lista' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
              No se encontraron tiendas configuradas
            </Typography>
          </Box>
        )}

        {/* Mensaje si no hay tiendas con errores */}
        {tiendas.length > 0 && tiendasAMostrar.length === 0 && vistaAgrupada !== 'lista' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
              No se encontraron tiendas en el período seleccionado
            </Typography>
          </Box>
        )}

        {/* Tabla de cierres: mostrar si hay tienda seleccionada O si está en vista lista */}
        {(selectedTienda || vistaAgrupada === 'lista') && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                {vistaAgrupada === 'lista' 
                  ? `Todos los cierres de ${months[selectedMonth]} ${selectedYear}`
                  : `Cierres de ${selectedTienda}`
                }
              </Typography>
              {selectedTienda && (
                <Button
                  variant="text"
                  onClick={() => setSelectedTienda(null)}
                  sx={{ color: theme.palette.text.secondary, minWidth: 'auto' }}
                >
                  <KeyboardArrowUpIcon />
                </Button>
              )}
            </Box>
            

            
            <TableContainer component={Paper} sx={{ 
              bgcolor: theme.palette.custom.tableRow, 
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.custom.tableBorder}`
            }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{
                    bgcolor: theme.palette.custom.tableRowHover,
                    '& th': {
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                      borderBottom: `2px solid ${theme.palette.success.main}`
                    }
                  }}>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary, width: 50 }}>
                      <Checkbox 
                        sx={{ 
                          color: theme.palette.success.main, 
                          '&.Mui-checked': { color: theme.palette.success.main } 
                        }} 
                        checked={selectedCierres.length > 0 && selectedCierresIds.size === selectedCierres.filter(c => !c.validado).length} 
                        indeterminate={selectedCierresIds.size > 0 && selectedCierresIds.size < selectedCierres.filter(c => !c.validado).length} 
                        onChange={(e) => handleSelectAll(e.target.checked)} 
                      />
                    </TableCell>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary, width: 50 }}>Ver</TableCell>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary }}>ID</TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: theme.palette.custom.tableRowHover, 
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                      onClick={() => handleSort('fecha')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Fecha
                        {orderBy === 'fecha' ? (
                          orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                        ) : (
                          <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: theme.palette.custom.tableRowHover, 
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                      onClick={() => handleSort('usuario')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Usuario
                        {orderBy === 'usuario' ? (
                          orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                        ) : (
                          <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: theme.palette.custom.tableRowHover, 
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                      onClick={() => handleSort('estado')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Estado
                        {orderBy === 'estado' ? (
                          orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                        ) : (
                          <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: theme.palette.custom.tableRowHover, 
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                      onClick={() => handleSort('validacion')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Validación
                        {orderBy === 'validacion' ? (
                          orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                        ) : (
                          <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: theme.palette.custom.tableRowHover, 
                        color: theme.palette.text.primary,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                      onClick={() => handleSort('diferencia')}
                    >
                      <Tooltip title="Diferencia total del cierre antes de ajustes" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>Diferencia Total</span>
                          {orderBy === 'diferencia' ? (
                            orderDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                          ) : (
                            <UnfoldMoreIcon fontSize="small" sx={{ opacity: 0.5 }} />
                          )}
                          <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.7rem', color: theme.palette.info.main }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary }}>
                      <Tooltip title="Total de todas las justificaciones realizadas" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span>Diferencia Justificada</span>
                          <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.7rem', color: theme.palette.info.main }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary }}>
                      <Tooltip title="Saldo sin justificar (Diferencia Total - Justificaciones)" arrow>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span>Saldo Sin Justificar</span>
                          <InfoIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.7rem', color: theme.palette.info.main }} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary }} align="center">Justif.</TableCell>
                    <TableCell sx={{ bgcolor: theme.palette.custom.tableRowHover, color: theme.palette.text.primary }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedCierres.map((cierre) => (
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
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                  No se encontraron cierres {!showWithoutErrors ? 'con errores ' : ''}para esta tienda en el período seleccionado
                </Typography>
              </Box>
            )}
          </Box>
        )}
          </>
        )}
      </Paper>

      {/* Modal de detalle usando el componente DetallesCierre */}
      <DetallesCierre 
        resumenData={transformarDatosParaImprimir(modalDetalle)}
        onClose={() => { setModalDetalle(null); setTabValue(0); }}
        open={!!modalDetalle}
      />

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