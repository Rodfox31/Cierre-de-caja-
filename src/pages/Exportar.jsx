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
const processNumericValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '.').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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

// NUEVO: función para mostrar estado de validación
function getValidacionInfo(cierre) {
  if (cierre.validado) {
    return {
      label: 'Validado',
      icon: <CheckCircleIcon color="success" fontSize="small" />,
      color: 'success.main',
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

export default function ControlMensual() {
  const theme = useTheme();
  
  // Estados
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [tiendas, setTiendas] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [allJustificaciones, setAllJustificaciones] = useState([]);
  const [filteredJustificaciones, setFilteredJustificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [selectedMotivo, setSelectedMotivo] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [tabValue, setTabValue] = useState(0);

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

  // Función para cargar justificaciones del mes seleccionado
  const fetchJustificaciones = useCallback(async () => {
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
      
      console.log('Solicitando cierres completos para extraer justificaciones:', params);
      const response = await axiosWithFallback('/api/cierres-completo', { params });
      console.log('Respuesta cierres completos:', response);
      
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
      
      showSnackbar('Datos cargados exitosamente.', 'success');
    } catch (err) {
      console.error('Error al cargar justificaciones:', err);
      setError(`Error al cargar los datos. Intente nuevamente.\n${err?.message || ''}\n${err?.response?.data ? JSON.stringify(err.response.data) : ''}`);
      showSnackbar('Error al cargar los datos.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, showSnackbar]);

  // Cargar datos cuando cambian mes/año (actualización automática)
  useEffect(() => {
    if (tiendas.length > 0) {
      fetchJustificaciones();
    }
  }, [selectedMonth, selectedYear, tiendas.length, fetchJustificaciones]);

  // Filtrar justificaciones según la tienda y motivo seleccionados
  useEffect(() => {
    let filtered = allJustificaciones;
    
    if (selectedTienda) {
      filtered = filtered.filter(justificacion => justificacion.tienda === selectedTienda);
    }
    
    if (selectedMotivo) {
      filtered = filtered.filter(justificacion => justificacion.motivo === selectedMotivo);
    }
    
    setFilteredJustificaciones(filtered);
  }, [selectedTienda, selectedMotivo, allJustificaciones]);
  // Nombres de meses
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const years = useMemo(() => {
    const currentYear = moment().year();
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  // Handlers para exportar datos
  // Utilidad para exportar CSV
  const handleExportCSV = () => {
    if (!filteredJustificaciones || filteredJustificaciones.length === 0) {
      showSnackbar('No hay datos para exportar.', 'warning');
      return;
    }
    // Definir columnas a exportar
    const columns = [
      'ID', 'Fecha', 'Tienda', 'Usuario', 'Cliente', 'Orden', 'Motivo', 'Ajuste ($)', 'Validado'
    ];
    // Mapear datos
    const rows = filteredJustificaciones.map(justificacion => {
      return [
        justificacion.id || '',
        justificacion.fecha ? justificacion.fecha.format('DD/MM/YYYY') : '',
        justificacion.tienda || '',
        justificacion.usuario || '',
        justificacion.cliente || '',
        justificacion.orden || '',
        justificacion.motivo || '',
        processAjusteValue(justificacion.ajuste, justificacion.monto_dif),
        justificacion.validado ? 'Sí' : 'No'
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
    link.setAttribute('download', `justificaciones_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Utilidad para exportar Excel (XLSX)
  const handleExportXLSX = () => {
    if (!filteredJustificaciones || filteredJustificaciones.length === 0) {
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
      
      const rows = filteredJustificaciones.map(justificacion => {
        return {
          ID: justificacion.id || '',
          Fecha: justificacion.fecha ? justificacion.fecha.format('DD/MM/YYYY') : '',
          Tienda: justificacion.tienda || '',
          Usuario: justificacion.usuario || '',
          Cliente: justificacion.cliente || '',
          Orden: justificacion.orden || '',
          Motivo: justificacion.motivo || '',
          'Ajuste ($)': processAjusteValue(justificacion.ajuste, justificacion.monto_dif),
          Validado: justificacion.validado ? 'Sí' : 'No'
        };
      });
      
      // @ts-ignore
      const ws = window.XLSX.utils.json_to_sheet(rows);
      // @ts-ignore
      const wb = window.XLSX.utils.book_new();
      // @ts-ignore
      window.XLSX.utils.book_append_sheet(wb, ws, 'Justificaciones');
      // @ts-ignore
      window.XLSX.writeFile(wb, `justificaciones_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.xlsx`);
    } catch (err) {
      showSnackbar('Error al exportar a Excel.', 'error');
    }
  };

  // Utilidad para exportar PDF
  const handleExportPDF = () => {
    if (!filteredJustificaciones || filteredJustificaciones.length === 0) {
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
        { header: 'Tienda', dataKey: 'tienda' },
        { header: 'Usuario', dataKey: 'usuario' },
        { header: 'Cliente', dataKey: 'cliente' },
        { header: 'Orden', dataKey: 'orden' },
        { header: 'Motivo', dataKey: 'motivo' },
        { header: 'Ajuste ($)', dataKey: 'ajuste' },
        { header: 'Validado', dataKey: 'validado' }
      ];
      
      const rows = filteredJustificaciones.map(justificacion => {
        return {
          id: justificacion.id || '',
          fecha: justificacion.fecha ? justificacion.fecha.format('DD/MM/YYYY') : '',
          tienda: justificacion.tienda || '',
          usuario: justificacion.usuario || '',
          cliente: justificacion.cliente || '',
          orden: justificacion.orden || '',
          motivo: justificacion.motivo || '',
          ajuste: processAjusteValue(justificacion.ajuste, justificacion.monto_dif),
          validado: justificacion.validado ? 'Sí' : 'No'
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
      doc.save(`justificaciones_${selectedTienda || 'todas'}_${months[selectedMonth]}_${selectedYear}.pdf`);
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
        {/* Filtros */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small" sx={{ minHeight: 32 }}>
                <InputLabel sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', top: '-4px' }}>Mes</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Mes"
                  sx={{
                    color: theme.palette.text.primary,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.tableBorder },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.primary },
                    borderRadius: 2,
                    minHeight: 32,
                    fontSize: '0.9rem',
                    height: 36,
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {months.map((month, index) => (
                    <MenuItem key={index} value={index} sx={{ fontSize: '0.9rem', minHeight: 32 }}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small" sx={{ minHeight: 32 }}>
                <InputLabel sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', top: '-4px' }}>Año</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Año"
                  sx={{
                    color: theme.palette.text.primary,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.tableBorder },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.primary },
                    borderRadius: 2,
                    minHeight: 32,
                    fontSize: '0.9rem',
                    height: 36,
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year} sx={{ fontSize: '0.9rem', minHeight: 32 }}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl fullWidth size="small" sx={{ minHeight: 32 }}>
                <InputLabel sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', top: '-4px' }}>Tienda</InputLabel>
                <Select
                  value={selectedTienda || ''}
                  onChange={(e) => setSelectedTienda(e.target.value || null)}
                  label="Tienda"
                  sx={{
                    color: theme.palette.text.primary,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.tableBorder },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.primary },
                    borderRadius: 2,
                    minHeight: 32,
                    fontSize: '0.9rem',
                    height: 36,
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.9rem', minHeight: 32 }}>
                    Todas las tiendas
                  </MenuItem>
                  {tiendas.map((tienda) => (
                    <MenuItem key={tienda} value={tienda} sx={{ fontSize: '0.9rem', minHeight: 32 }}>
                      {tienda}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <FormControl fullWidth size="small" sx={{ minHeight: 32 }}>
                <InputLabel sx={{ color: theme.palette.text.primary, fontSize: '0.9rem', top: '-4px' }}>Motivo</InputLabel>
                <Select
                  value={selectedMotivo || ''}
                  onChange={(e) => setSelectedMotivo(e.target.value || null)}
                  label="Motivo"
                  sx={{
                    color: theme.palette.text.primary,
                    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.tableBorder },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
                    '.MuiSvgIcon-root': { color: theme.palette.text.primary },
                    borderRadius: 2,
                    minHeight: 32,
                    fontSize: '0.9rem',
                    height: 36,
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.9rem', minHeight: 32 }}>
                    Todos los motivos
                  </MenuItem>
                  {motivos.map((motivo) => (
                    <MenuItem key={motivo} value={motivo} sx={{ fontSize: '0.9rem', minHeight: 32 }}>
                      {motivo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                onClick={fetchJustificaciones}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{
                  color: theme.palette.text.primary,
                  borderColor: theme.palette.custom.tableBorder,
                  '&:hover': { borderColor: theme.palette.text.secondary },
                  height: '36px',
                  width: '100%',
                  fontSize: '0.8rem',
                  borderRadius: 2,
                  px: 1,
                }}
              >
                {loading ? 'Cargando...' : 'Actualizar'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center', height: '36px' }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    borderRadius: 2, 
                    minWidth: 35, 
                    px: 0.5, 
                    fontSize: '0.75rem', 
                    color: theme.palette.text.primary, 
                    borderColor: theme.palette.custom.tableBorder, 
                    bgcolor: theme.palette.background.paper, 
                    '&:hover': { bgcolor: theme.palette.custom.tableRowHover, borderColor: theme.palette.text.primary } 
                  }} 
                  onClick={handleExportCSV}
                >
                  CSV
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    borderRadius: 2, 
                    minWidth: 35, 
                    px: 0.5, 
                    fontSize: '0.75rem', 
                    color: theme.palette.error.main, 
                    borderColor: theme.palette.error.main, 
                    bgcolor: theme.palette.background.paper, 
                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1), borderColor: theme.palette.error.main } 
                  }} 
                  onClick={handleExportPDF}
                >
                  PDF
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    borderRadius: 2, 
                    minWidth: 35, 
                    px: 0.5, 
                    fontSize: '0.75rem', 
                    color: theme.palette.success.main, 
                    borderColor: theme.palette.success.main, 
                    bgcolor: theme.palette.background.paper, 
                    '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1), borderColor: theme.palette.success.main } 
                  }} 
                  onClick={handleExportXLSX}
                >
                  Excel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 3, borderColor: theme.palette.custom.tableBorder }} />

        {/* Mensaje de error */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* Tabla de justificaciones */}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              Justificaciones {selectedTienda ? `de ${selectedTienda}` : 'de todas las tiendas'}
            </Typography>
          </Box>
          
          <TableContainer component={Paper} sx={{ 
            bgcolor: theme.palette.background.paper, 
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.custom.tableBorder}`
          }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{
                  bgcolor: theme.palette.custom.tableRow,
                  '& th': {
                    fontWeight: 'bold',
                    color: theme.palette.text.primary,
                    borderBottom: `2px solid ${theme.palette.success.main}`
                  }
                }}>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>ID</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Fecha</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Tienda</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Usuario</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Cliente</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Orden</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Motivo</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Ajuste ($)</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Medio de Pago</TableCell>
                  <TableCell sx={{ bgcolor: theme.palette.custom.tableRow, color: theme.palette.text.primary }}>Validado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredJustificaciones.map((justificacion, index) => (
                  <TableRow 
                    key={justificacion.id || index} 
                    sx={{ 
                      '&:hover': { bgcolor: theme.palette.custom.tableRowHover },
                      bgcolor: theme.palette.background.paper
                    }}
                  >
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {justificacion.id || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {justificacion.fecha ? justificacion.fecha.format('DD/MM/YYYY') : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {justificacion.tienda || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {justificacion.usuario || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {justificacion.cliente || '-'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {justificacion.orden || '-'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, maxWidth: 300 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {justificacion.motivo || 'Sin motivo'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      color: theme.palette.warning.main,
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}>
                      {formatCurrency(processAjusteValue(justificacion.ajuste, justificacion.monto_dif))}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {justificacion.medio_pago || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      <Chip
                        label={justificacion.validado ? 'Validado' : 'Sin validar'}
                        size="small"
                        sx={{
                          backgroundColor: justificacion.validado ? theme.palette.success.main : theme.palette.error.main,
                          color: theme.palette.text.primary,
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                {filteredJustificaciones.length > 0 && (
                  <TableRow sx={{ 
                    bgcolor: theme.palette.custom.tableRow,
                    borderTop: `2px solid ${theme.palette.success.main}`
                  }}>
                    <TableCell sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }} colSpan={7}>
                      TOTAL
                    </TableCell>
                    <TableCell sx={{ 
                      color: filteredJustificaciones.reduce((total, justificacion) => 
                        total + processAjusteValue(justificacion.ajuste, justificacion.monto_dif), 0
                      ) >= 0 ? theme.palette.success.main : theme.palette.error.main,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      fontSize: '1rem'
                    }}>
                      {formatCurrency(
                        filteredJustificaciones.reduce((total, justificacion) => 
                          total + processAjusteValue(justificacion.ajuste, justificacion.monto_dif), 0
                        )
                      )}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>
                      {/* Celda vacía para alinear con la columna "Validado" */}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredJustificaciones.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                No se encontraron justificaciones para el período seleccionado
              </Typography>
            </Box>
          )}
        </Box>
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

