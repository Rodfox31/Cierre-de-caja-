import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Fade,
  Slide,
  useTheme,
  alpha,
  Collapse,
  Alert,
  AlertTitle,
  Snackbar,
  Skeleton,
  Container,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  LinearProgress,
  TablePagination,
  Checkbox
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Assessment as AssessmentIcon, 
  ClearAll as ClearAllIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  GetApp as GetAppIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Store as StoreIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import moment from 'moment';
import * as XLSX from 'xlsx';

// Configuración de momento.js
moment.locale('es');

// Constantes y funciones auxiliares
const EXPORT_FORMATS = {
  XLSX: 'xlsx',
  CSV: 'csv',
  JSON: 'json'
};

const ESTADOS_DIFERENCIA = {
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
    icon: <WarningIcon color="error" />,
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)',
  },
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
};

const getEstadoDiferencia = (diferencia) => {
  const diff = Number(diferencia) || 0;
  if (diff === 0) return ESTADOS_DIFERENCIA.CORRECTO;
  if (Math.abs(diff) < 1000) return ESTADOS_DIFERENCIA.DIFERENCIA_MENOR;
  return ESTADOS_DIFERENCIA.DIFERENCIA_GRAVE;
};

function Exportar() {
  const theme = useTheme();
  
  // Estados principales
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados de filtros
  const [tiendaFiltro, setTiendaFiltro] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [diferenciaFiltro, setDiferenciaFiltro] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de ordenamiento y paginación
  const [orden, setOrden] = useState('desc');
  const [ordenarPor, setOrdenarPor] = useState('fecha');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Estados de UI
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS.XLSX);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [compactView, setCompactView] = useState(false);
  
  // Función para mostrar notificaciones
  const showNotification = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  
  // Función para cerrar notificaciones
  const closeNotification = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Función para cargar datos
  const fetchCierres = useCallback(async (showProgress = true) => {
    if (showProgress) setLoading(true);
    setRefreshing(!showProgress);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cierres-completo`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCierres(data);
      setError(null);
      
      if (!showProgress) {
        showNotification('Datos actualizados correctamente', 'success');
      }
    } catch (err) {
      console.error('Error fetching cierres:', err);
      setError(err);
      showNotification(`Error al cargar datos: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showNotification]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchCierres();
  }, [fetchCierres]);

  // Procesamiento de justificaciones mejorado
  const justificaciones = useMemo(() => {
    const flatJustificaciones = [];
    
    cierres.forEach(cierre => {
      if (cierre.justificaciones && cierre.justificaciones.length > 0) {
        cierre.justificaciones.forEach(just => {
          flatJustificaciones.push({
            id: just.id,
            tienda: cierre.tienda,
            fecha: cierre.fecha,
            usuario: cierre.usuario,
            // Campos de justificación
            orden: just.orden,
            cliente: just.cliente,
            monto_dif: just.monto_dif,
            ajuste: just.ajuste,
            motivo: just.motivo,
            // Campos de cierre
            diferencia: cierre.grand_difference_total,
            balance_sin_justificar: cierre.balance_sin_justificar,
            responsable: cierre.responsable,
            comentarios_cierre: cierre.comentarios,
            fondo: cierre.fondo,
            brinks_total: cierre.brinks_total,
            // Campos adicionales para análisis
            estado_diferencia: getEstadoDiferencia(cierre.grand_difference_total),
            fecha_formateada: moment(cierre.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY'),
            mes_anio: moment(cierre.fecha, 'YYYY-MM-DD').format('YYYY-MM'),
            mes_nombre: moment(cierre.fecha, 'YYYY-MM-DD').format('MMMM YYYY'),
          });
        });
      }
    });
    
    return flatJustificaciones;
  }, [cierres]);

  // Obtener listas únicas para filtros
  const tiendasUnicas = useMemo(() => 
    [...new Set(cierres.map(c => c.tienda).filter(Boolean))].sort(), 
    [cierres]
  );
  
  const usuariosUnicos = useMemo(() => 
    [...new Set(cierres.map(c => c.usuario).filter(Boolean))].sort(), 
    [cierres]
  );
  
  const mesesUnicos = useMemo(() => {
    const meses = new Set();
    justificaciones.forEach(j => {
      if (j.mes_anio) {
        meses.add(j.mes_anio);
      }
    });
    return Array.from(meses).sort().reverse();
  }, [justificaciones]);

  // Filtrado mejorado de justificaciones
  const justificacionesFiltradas = useMemo(() => {
    let result = justificaciones;
    
    // Filtro por tienda
    if (tiendaFiltro) {
      result = result.filter(j => j.tienda === tiendaFiltro);
    }
    
    // Filtro por mes
    if (mesFiltro) {
      result = result.filter(j => j.mes_anio === mesFiltro);
    }
    
    // Filtro por usuario
    if (usuarioFiltro) {
      result = result.filter(j => j.usuario === usuarioFiltro);
    }
    
    // Filtro por tipo de diferencia
    if (diferenciaFiltro === 'positiva') {
      result = result.filter(j => Number(j.diferencia) > 0);
    } else if (diferenciaFiltro === 'negativa') {
      result = result.filter(j => Number(j.diferencia) < 0);
    } else if (diferenciaFiltro === 'cero') {
      result = result.filter(j => Number(j.diferencia) === 0);
    }
    
    // Filtro de búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(j =>
        (j.motivo && j.motivo.toLowerCase().includes(searchLower)) ||
        (j.orden && j.orden.toLowerCase().includes(searchLower)) ||
        (j.cliente && j.cliente.toLowerCase().includes(searchLower)) ||
        (j.usuario && j.usuario.toLowerCase().includes(searchLower)) ||
        (j.tienda && j.tienda.toLowerCase().includes(searchLower)) ||
        (j.responsable && j.responsable.toLowerCase().includes(searchLower))
      );
    }
    
    return result;
  }, [justificaciones, tiendaFiltro, mesFiltro, usuarioFiltro, diferenciaFiltro, search]);

  // Ordenamiento mejorado
  const justificacionesOrdenadas = useMemo(() => {
    if (!Array.isArray(justificacionesFiltradas)) return [];
    
    return [...justificacionesFiltradas].sort((a, b) => {
      let valA = a[ordenarPor];
      let valB = b[ordenarPor];

      // Ordenamiento por fecha
      if (ordenarPor === 'fecha') {
        const dateA = moment(valA, 'YYYY-MM-DD');
        const dateB = moment(valB, 'YYYY-MM-DD');
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        return orden === 'asc' ? dateA.diff(dateB) : dateB.diff(dateA);
      }
      
      // Ordenamiento numérico
      if (['monto_dif', 'ajuste', 'diferencia', 'balance_sin_justificar', 'fondo', 'brinks_total'].includes(ordenarPor)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      
      // Ordenamiento de texto
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      
      if (valA < valB) return orden === 'asc' ? -1 : 1;
      if (valA > valB) return orden === 'asc' ? 1 : -1;
      return 0;
    });
  }, [justificacionesFiltradas, orden, ordenarPor]);

  // Paginación mejorada
  const paginatedJustificaciones = useMemo(() => {
    const start = page * rowsPerPage;
    return justificacionesOrdenadas.slice(start, start + rowsPerPage);
  }, [justificacionesOrdenadas, page, rowsPerPage]);

  // Funciones de control
  const handleSort = useCallback((property) => {
    const isAsc = ordenarPor === property && orden === 'asc';
    setOrden(isAsc ? 'desc' : 'asc');
    setOrdenarPor(property);
  }, [ordenarPor, orden]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSelectRow = useCallback((id) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginatedJustificaciones.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedJustificaciones.map(j => j.id)));
    }
  }, [paginatedJustificaciones, selectedRows.size]);

  // Estadísticas mejoradas
  const resumen = useMemo(() => {
    const totalJustificaciones = justificacionesFiltradas.length;
    const montoTotalDif = justificacionesFiltradas.reduce((acc, curr) => acc + (Number(curr.monto_dif) || 0), 0);
    const ajusteTotal = justificacionesFiltradas.reduce((acc, curr) => acc + (Number(curr.ajuste) || 0), 0);
    const diferenciasPositivas = justificacionesFiltradas.filter(j => Number(j.diferencia) > 0).length;
    const diferenciasNegativas = justificacionesFiltradas.filter(j => Number(j.diferencia) < 0).length;
    const diferenciasCorrectas = justificacionesFiltradas.filter(j => Number(j.diferencia) === 0).length;
    const tiendasUnicas = new Set(justificacionesFiltradas.map(j => j.tienda)).size;
    const motivosUnicos = new Set(justificacionesFiltradas.map(j => j.motivo)).size;
    const usuariosUnicos = new Set(justificacionesFiltradas.map(j => j.usuario)).size;
    const diferenciaPromedio = totalJustificaciones > 0 ? 
      justificacionesFiltradas.reduce((acc, curr) => acc + (Number(curr.diferencia) || 0), 0) / totalJustificaciones : 0;

    return {
      totalJustificaciones,
      montoTotalDif,
      ajusteTotal,
      diferenciasPositivas,
      diferenciasNegativas,
      diferenciasCorrectas,
      tiendasUnicas,
      motivosUnicos,
      usuariosUnicos,
      diferenciaPromedio,
      efectividad: totalJustificaciones > 0 ? (diferenciasCorrectas / totalJustificaciones) * 100 : 0
    };
  }, [justificacionesFiltradas]);

  // Función de exportación mejorada
  const handleExport = useCallback(async () => {
    setExportLoading(true);
    
    try {
      const dataToExport = (selectedRows.size > 0 
        ? justificacionesOrdenadas.filter(j => selectedRows.has(j.id))
        : justificacionesOrdenadas
      ).map(j => ({
        'Tienda': j.tienda,
        'Fecha': j.fecha_formateada,
        'Usuario': j.usuario,
        'Responsable': j.responsable || '',
        'Orden': j.orden || '',
        'Cliente': j.cliente || '',
        'Monto Diferencia': j.monto_dif || 0,
        'Ajuste': j.ajuste || 0,
        'Motivo': j.motivo || '',
        'Diferencia Total Cierre': j.diferencia || 0,
        'Balance Sin Justificar': j.balance_sin_justificar || 0,
        'Fondo': j.fondo || 0,
        'Brinks Total': j.brinks_total || 0,
        'Comentarios Cierre': j.comentarios_cierre || '',
        'Estado': j.estado_diferencia.label,
        'Mes': j.mes_nombre
      }));

      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const filename = `Justificaciones_${timestamp}`;

      if (exportFormat === EXPORT_FORMATS.XLSX) {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Justificaciones');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else if (exportFormat === EXPORT_FORMATS.CSV) {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      } else if (exportFormat === EXPORT_FORMATS.JSON) {
        const json = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.json`;
        link.click();
      }

      showNotification(
        `Exportación completada: ${dataToExport.length} registros exportados`,
        'success'
      );
      setExportDialog(false);
    } catch (error) {
      showNotification(`Error al exportar: ${error.message}`, 'error');
    } finally {
      setExportLoading(false);
    }
  }, [justificacionesOrdenadas, selectedRows, exportFormat, showNotification]);

  const handleClearFilters = useCallback(() => {
    setTiendaFiltro('');
    setMesFiltro('');
    setUsuarioFiltro('');
    setDiferenciaFiltro('');
    setSearch('');
    setPage(0);
    setSelectedRows(new Set());
    showNotification('Filtros limpiados', 'info');
  }, [showNotification]);

  // Definición de columnas de la tabla
  const columns = [
    { id: 'tienda', label: 'Tienda', icon: <StoreIcon />, minWidth: 120 },
    { id: 'fecha', label: 'Fecha', icon: <DateRangeIcon />, minWidth: 100 },
    { id: 'usuario', label: 'Usuario', icon: <PersonIcon />, minWidth: 120 },
    { id: 'orden', label: 'Orden', icon: <ReceiptIcon />, minWidth: 120 },
    { id: 'cliente', label: 'Cliente', minWidth: 150 },
    { id: 'monto_dif', label: 'Monto Dif.', align: 'right', minWidth: 120 },
    { id: 'ajuste', label: 'Ajuste', align: 'right', minWidth: 120 },
    { id: 'motivo', label: 'Motivo', minWidth: 200 },
    { id: 'diferencia', label: 'Diferencia Total', align: 'right', minWidth: 140 },
    { id: 'responsable', label: 'Responsable', minWidth: 120 },
  ];

  // Componente de carga
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Cargando datos de justificaciones...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Componente de error
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error al cargar los datos</AlertTitle>
          {error.message}
        </Alert>
        <Button
          variant="contained"
          onClick={() => fetchCierres()}
          startIcon={<RefreshIcon />}
        >
          Reintentar
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header con título y controles principales */}
      <Fade in timeout={800}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                <AssessmentIcon sx={{ color: 'white', fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  Reporte de Justificaciones
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Análisis detallado de diferencias y ajustes
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Actualizar datos">
                <IconButton 
                  onClick={() => fetchCierres(false)}
                  disabled={refreshing}
                  sx={{ 
                    bgcolor: alpha(theme.palette.action.hover, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.2) }
                  }}
                >
                  <RefreshIcon sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                  }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Configurar vista">
                <IconButton 
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ 
                    bgcolor: showFilters ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.action.hover, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <FilterListIcon color={showFilters ? 'primary' : 'inherit'} />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                startIcon={<GetAppIcon />}
                onClick={() => setExportDialog(true)}
                disabled={justificacionesOrdenadas.length === 0}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }
                }}
              >
                Exportar
              </Button>
            </Stack>
          </Stack>

          {/* Indicador de progreso */}
          {refreshing && (
            <LinearProgress 
              sx={{ 
                borderRadius: 1,
                height: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }} 
            />
          )}
        </Paper>
      </Fade>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Slide in direction="up" timeout={600}>
            <Card 
              elevation={4} 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.success.main, 0.1) 
                  }}>
                    <ReceiptIcon color="success" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {resumen.totalJustificaciones.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Justificaciones
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Slide in direction="up" timeout={700}>
            <Card 
              elevation={4} 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.warning.main, 0.1) 
                  }}>
                    <TrendingUpIcon color="warning" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {formatCurrency(resumen.montoTotalDif)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monto Diferencias
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Slide in direction="up" timeout={800}>
            <Card 
              elevation={4} 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.info.main, 0.1) 
                  }}>
                    <ShowChartIcon color="info" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {formatCurrency(resumen.ajusteTotal)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Ajustes
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Slide>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Slide in direction="up" timeout={900}>
            <Card 
              elevation={4} 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.1) 
                  }}>
                    <StoreIcon color="primary" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {resumen.tiendasUnicas}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tiendas Afectadas
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Slide>
        </Grid>
      </Grid>

      {/* Panel de filtros */}
      <Collapse in={showFilters} timeout={600}>
        <Paper 
          elevation={4} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            Filtros de Búsqueda
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tienda</InputLabel>
                <Select
                  value={tiendaFiltro}
                  label="Tienda"
                  onChange={(e) => setTiendaFiltro(e.target.value)}
                  startAdornment={<StoreIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value=""><em>Todas las tiendas</em></MenuItem>
                  {tiendasUnicas.map(tienda => (
                    <MenuItem key={tienda} value={tienda}>{tienda}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={mesFiltro}
                  label="Mes"
                  onChange={(e) => setMesFiltro(e.target.value)}
                  startAdornment={<DateRangeIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value=""><em>Todos los meses</em></MenuItem>
                  {mesesUnicos.map(mes => (
                    <MenuItem key={mes} value={mes}>
                      {moment(mes).format('MMMM YYYY')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Usuario</InputLabel>
                <Select
                  value={usuarioFiltro}
                  label="Usuario"
                  onChange={(e) => setUsuarioFiltro(e.target.value)}
                  startAdornment={<PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value=""><em>Todos los usuarios</em></MenuItem>
                  {usuariosUnicos.map(usuario => (
                    <MenuItem key={usuario} value={usuario}>{usuario}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Diferencia</InputLabel>
                <Select
                  value={diferenciaFiltro}
                  label="Tipo de Diferencia"
                  onChange={(e) => setDiferenciaFiltro(e.target.value)}
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  <MenuItem value="positiva">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingUpIcon color="success" fontSize="small" />
                      <span>Positivas</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="negativa">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingDownIcon color="error" fontSize="small" />
                      <span>Negativas</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="cero">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <span>Sin diferencia</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Buscar en orden, cliente, motivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} height="100%" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={compactView}
                      onChange={(e) => setCompactView(e.target.checked)}
                    />
                  }
                  label="Vista compacta"
                />
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<ClearAllIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* Tabla de datos */}
      <Paper 
        elevation={4} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        {justificaciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No se encontraron justificaciones
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      '& th': {
                        fontWeight: 'bold',
                        color: 'text.primary',
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedJustificaciones.length}
                        checked={paginatedJustificaciones.length > 0 && selectedRows.size === paginatedJustificaciones.length}
                        onChange={handleSelectAll}
                        color="primary"
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        style={{ minWidth: column.minWidth }}
                        sortDirection={ordenarPor === column.id ? orden : false}
                      >
                        <TableSortLabel
                          active={ordenarPor === column.id}
                          direction={ordenarPor === column.id ? orden : 'asc'}
                          onClick={() => handleSort(column.id)}
                          sx={{
                            '& .MuiTableSortLabel-icon': {
                              color: `${theme.palette.primary.main} !important`,
                            },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {column.icon}
                            <span>{column.label}</span>
                          </Stack>
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedJustificaciones.map((row, index) => {
                    const isSelected = selectedRows.has(row.id);
                    const estadoDif = getEstadoDiferencia(row.diferencia);
                    
                    return (
                      <TableRow
                        hover
                        key={row.id || index}
                        selected={isSelected}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.04)
                          },
                          ...(Number(row.diferencia) !== 0 && {
                            bgcolor: alpha(estadoDif.color, 0.02),
                            borderLeft: `3px solid ${estadoDif.color}`
                          })
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectRow(row.id)}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.tienda}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {row.fecha_formateada}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {row.usuario}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {row.orden || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.cliente || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace"
                            color={Number(row.monto_dif) !== 0 ? 'warning.main' : 'text.secondary'}
                          >
                            {row.monto_dif ? formatCurrency(row.monto_dif) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace"
                            color={Number(row.ajuste) !== 0 ? 'info.main' : 'text.secondary'}
                          >
                            {row.ajuste ? formatCurrency(row.ajuste) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {row.motivo || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" alignItems="center" spacing={1} justifyContent="flex-end">
                            {estadoDif.icon}
                            <Typography 
                              variant="body2" 
                              fontFamily="monospace"
                              color={estadoDif.color}
                              fontWeight="bold"
                            >
                              {formatCurrency(row.diferencia)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.responsable || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Paginación */}
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={justificacionesOrdenadas.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '& .MuiTablePagination-toolbar': {
                  px: 3
                }
              }}
            />
          </>
        )}
      </Paper>

      {/* Diálogo de exportación */}
      <Dialog
        open={exportDialog}
        onClose={() => setExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GetAppIcon color="primary" />
            <Typography variant="h6">Exportar Datos</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="info">
              {selectedRows.size > 0 ? (
                <>Se exportarán <strong>{selectedRows.size}</strong> registros seleccionados</>
              ) : (
                <>Se exportarán <strong>{justificacionesOrdenadas.length}</strong> registros</>
              )}
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Formato de exportación</InputLabel>
              <Select
                value={exportFormat}
                label="Formato de exportación"
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <MenuItem value={EXPORT_FORMATS.XLSX}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GetAppIcon fontSize="small" />
                    <span>Excel (.xlsx)</span>
                  </Stack>
                </MenuItem>
                <MenuItem value={EXPORT_FORMATS.CSV}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GetAppIcon fontSize="small" />
                    <span>CSV (.csv)</span>
                  </Stack>
                </MenuItem>
                <MenuItem value={EXPORT_FORMATS.JSON}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <GetAppIcon fontSize="small" />
                    <span>JSON (.json)</span>
                  </Stack>
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {exportLoading ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeNotification} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Exportar;

