// Diferencias.jsx

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import moment from 'moment';
import { fetchWithFallback, axiosWithFallback } from '../config';
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Tooltip,
  CircularProgress,
  IconButton,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Tabs,
  Tab,
  Skeleton,
  useTheme,
  TableSortLabel,
  TablePagination,
  Fade,
  Checkbox,
  FormControlLabel,
  Collapse,
  Slide,
  Snackbar,
  Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Modificar from './Modificar';
import DetallesCierre from './DetallesCierre';

////////////////////////////////////////////////////////////////////////
// CONSTANTES Y FUNCIONES AUXILIARES
////////////////////////////////////////////////////////////////////////

const styles = {
  tableHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    bgcolor: 'background.paper',
    transition: 'background-color 0.3s ease',
  },
  row: {
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      backgroundColor: 'action.hover',
      boxShadow: 1,
    },
    cursor: 'pointer',
  },
  exactValue: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
  },
};

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

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value || 0);
}

function getEstado(cierre) {
  const diffVal = Number(cierre.grand_difference_total) || 0;
  if (diffVal === 0) return ESTADOS_CIERRE.CORRECTO;
  if (diffVal > 10000 || diffVal < -10000) return ESTADOS_CIERRE.DIFERENCIA_GRAVE;
  return ESTADOS_CIERRE.DIFERENCIA_MENOR;
}

const filtrarCierres = ({ cierres, fechaDesde, fechaHasta, tienda, usuario, motivo, buscador }) => {
  return cierres.filter((cierre) => {
    const fechaCierre = moment(cierre.fecha);
    const cumpleFecha =
      (!fechaDesde || fechaCierre.isSameOrAfter(fechaDesde, 'day')) &&
      (!fechaHasta || fechaCierre.isSameOrBefore(fechaHasta, 'day'));
    const cumpleTienda = !tienda || cierre.tienda === tienda;
    const cumpleUsuario = !usuario || cierre.usuario === usuario;
    const cumpleMotivo =
      !motivo ||
      (cierre.justificaciones && cierre.justificaciones.some((j) => j.motivo === motivo));
    const textoBusqueda = buscador.toLowerCase().trim();
    const cumpleBusqueda =
      !textoBusqueda ||
      cierre.usuario.toLowerCase().includes(textoBusqueda) ||
      cierre.tienda.toLowerCase().includes(textoBusqueda);

    return (
      cumpleFecha &&
      cumpleTienda &&
      cumpleUsuario &&
      cumpleMotivo &&
      cumpleBusqueda
    );
  });
};

const ordenarCierres = ({ cierres, order, orderBy }) => {
  return [...cierres].sort((a, b) => {
    if (orderBy === 'fecha') {
      return order === 'asc'
        ? moment(a.fecha).valueOf() - moment(b.fecha).valueOf()
        : moment(b.fecha).valueOf() - moment(a.fecha).valueOf();
    }
    if (orderBy === 'tienda') {
      return order === 'asc'
        ? a.tienda.localeCompare(b.tienda)
        : b.tienda.localeCompare(a.tienda);
    }
    if (orderBy === 'usuario') {
      return order === 'asc'
        ? a.usuario.localeCompare(b.usuario)
        : b.usuario.localeCompare(a.usuario);
    }
    return 0;
  });
};

const calcularEstadisticas = (cierres) => {
  let correctos = 0;
  let advertencias = 0;
  let errores = 0;
  let diferenciaTotal = 0;

  cierres.forEach((c) => {
    const estado = getEstado(c);
    if (estado === ESTADOS_CIERRE.CORRECTO) correctos += 1;
    else if (estado === ESTADOS_CIERRE.DIFERENCIA_MENOR) advertencias += 1;
    else errores += 1;

    diferenciaTotal += Math.abs(c.grand_difference_total || 0);
  });

  return {
    total: cierres.length,
    correctos,
    advertencias,
    errores,
    diferenciaTotal,
  };
};

const StatsCard = React.memo(function StatsCard({ title, value, color, tooltip }) {
  const theme = useTheme();
  return (
    <Tooltip title={tooltip} arrow>
      <Paper
        elevation={1}
        sx={{
          borderLeft: `3px solid ${color}`,
          py: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background-color 0.2s, box-shadow 0.2s',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            boxShadow: 2,
          },
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          height: '60px',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
            {title}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
      </Paper>
    </Tooltip>
  );
});

const ExactValue = React.memo(function ExactValue({ value, currency = true }) {
  return (
    <Typography component="span" sx={styles.exactValue}>
      {currency ? formatCurrency(value) : value.toFixed(4)}
    </Typography>
  );
});

function LoadingSkeleton({ columns }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {columns.map((column) => (
            <TableCell key={`${column.id}-${index}`}>
              <Skeleton variant="text" width="80%" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState() {
  const theme = useTheme();
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <InfoIcon sx={{ fontSize: 60, mb: 2, color: theme.palette.text.secondary }} />
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }} gutterBottom>
        No se encontraron resultados
      </Typography>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
        Intenta ajustar los filtros o actualizar los datos
      </Typography>
    </Box>
  );
}

const HeaderControls = React.memo(function HeaderControls({
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  tiendaSeleccionada,
  setTiendaSeleccionada,
  usuarioSeleccionado,
  setUsuarioSeleccionado,
  motivoSeleccionado,
  setMotivoSeleccionado,
  tiendas,
  usuarios,
  motivos,
  buscador,
  setBuscador,
  fetchData,
  loading,
  handleDownloadCSV,
  handleOpenColumnModal,
  selectedDatePreset,
  setSelectedDatePreset,
  selectedId,
  onDeleteSelected,
  showCorrectos,
  setShowCorrectos,
  showDiferenciasMenores,
  setShowDiferenciasMenores,
  showDiferenciasGraves,
  setShowDiferenciasGraves,
  setPage,
  selectedMonth,
  setSelectedMonth,
  handleMonthChange,
}) {
  const theme = useTheme();
  const sharedSelectSx = {
    backgroundColor: alpha(theme.palette.background.paper, 0.85),
    borderRadius: 2,
    color: theme.palette.text.primary,
    '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom?.tableBorder || theme.palette.divider },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
    '.MuiSvgIcon-root': { color: theme.palette.text.primary },
    transition: 'background-color 0.3s ease, border-color 0.3s ease',
  };
  const sharedLabelSx = { color: theme.palette.text.secondary };
  const sharedDateFieldSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: alpha(theme.palette.background.paper, 0.85),
      color: theme.palette.text.primary,
      borderRadius: 2,
      '& fieldset': { borderColor: theme.palette.custom?.tableBorder || theme.palette.divider },
      '&:hover fieldset': { borderColor: theme.palette.primary.main },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& .MuiInputLabel-root': sharedLabelSx,
  };

  const handleDatePresetChange = useCallback(
    (event) => {
      const preset = event.target.value;
      setSelectedDatePreset(preset);
      setPage(0); // Resetear página al cambiar filtros

      const today = moment();
      let newFechaDesde = null;
      let newFechaHasta = null;

      switch (preset) {
        case 'last7days':
          newFechaDesde = moment().subtract(6, 'days').startOf('day');
          newFechaHasta = today.endOf('day');
          break;
        case 'last30days':
          newFechaDesde = moment().subtract(29, 'days').startOf('day');
          newFechaHasta = today.endOf('day');
          break;
        case 'thisMonth':
          newFechaDesde = moment().startOf('month').startOf('day');
          newFechaHasta = today.endOf('day');
          break;
        case 'lastMonth':
          newFechaDesde = moment().subtract(1, 'month').startOf('month').startOf('day');
          newFechaHasta = moment().subtract(1, 'month').endOf('month').endOf('day');
          break;
        default:
          break;
      }
      setFechaDesde(newFechaDesde);
      setFechaHasta(newFechaHasta);
    },
    [setFechaDesde, setFechaHasta, setSelectedDatePreset, setPage]
  );
  const handleFechaDesdeChange = useCallback(
    (event) => {
      setFechaDesde(event.target.value ? moment(event.target.value) : null);
      setSelectedDatePreset('custom');
      setPage(0); // Resetear página al cambiar filtros
    },
    [setFechaDesde, setSelectedDatePreset, setPage]
  );

  const handleFechaHastaChange = useCallback(
    (event) => {
      setFechaHasta(event.target.value ? moment(event.target.value) : null);
      setSelectedDatePreset('custom');
      setPage(0); // Resetear página al cambiar filtros
    },
    [setFechaHasta, setSelectedDatePreset, setPage]
  );

  return (
    <Box mb={3}>
      {/* Filtros principales en una sola fila */}
      <Grid container spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: 'nowrap', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* PERIODO */}
        <Grid item sx={{ flex: '1 1 120px', minWidth: 120 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={sharedLabelSx}>Período</InputLabel>
            <Select
              label="Período"
              value={selectedDatePreset}
              onChange={handleDatePresetChange}
              variant="outlined"
              sx={sharedSelectSx}
            >
              <MenuItem value="custom">Personalizado</MenuItem>
              <MenuItem value="last7days">Últimos 7 días</MenuItem>
              <MenuItem value="last30days">Últimos 30 días</MenuItem>
              <MenuItem value="thisMonth">Este mes</MenuItem>
              <MenuItem value="lastMonth">Mes anterior</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {/* MES SOLO DEL AÑO ACTUAL */}
        <Grid item sx={{ flex: '1 1 110px', minWidth: 110 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={sharedLabelSx}>Mes</InputLabel>
            <Select
              label="Mes"
              value={selectedMonth}
              onChange={handleMonthChange}
              variant="outlined"
              sx={sharedSelectSx}
            >
              <MenuItem value="">Todos</MenuItem>
              {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((mes, idx) => {
                const value = `${moment().year()}-${String(idx+1).padStart(2,'0')}`;
                return (
                  <MenuItem key={value} value={value}>{mes}</MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
        {/* DESDE */}
        <Grid item sx={{ flex: '1 1 110px', minWidth: 110 }}>
          <TextField
            fullWidth
            size="small"
            label="Desde"
            type="date"
            variant="outlined"
            value={fechaDesde ? fechaDesde.format('YYYY-MM-DD') : ''}
            onChange={handleFechaDesdeChange}
            InputLabelProps={{ shrink: true }}
            disabled={selectedDatePreset !== 'custom'}
            sx={sharedDateFieldSx}
          />
        </Grid>
        {/* HASTA */}
        <Grid item sx={{ flex: '1 1 110px', minWidth: 110 }}>
          <TextField
            fullWidth
            size="small"
            label="Hasta"
            type="date"
            variant="outlined"
            value={fechaHasta ? fechaHasta.format('YYYY-MM-DD') : ''}
            onChange={handleFechaHastaChange}
            InputLabelProps={{ shrink: true }}
            disabled={selectedDatePreset !== 'custom'}
            sx={sharedDateFieldSx}
          />
        </Grid>
        {/* TIENDA */}
        <Grid item sx={{ flex: '1 1 110px', minWidth: 110 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={sharedLabelSx}>Tienda</InputLabel>
            <Select
              label="Tienda"
              value={tiendaSeleccionada}
              onChange={(e) => { setTiendaSeleccionada(e.target.value); setPage(0); }}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              variant="outlined"
              sx={sharedSelectSx}
            >
              <MenuItem value="">Todas</MenuItem>
              {tiendas.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* USUARIO */}
        <Grid item sx={{ flex: '1 1 110px', minWidth: 110 }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={sharedLabelSx}>Usuario</InputLabel>
            <Select
              label="Usuario"
              value={usuarioSeleccionado}
              onChange={(e) => { setUsuarioSeleccionado(e.target.value); setPage(0); }}
              disabled={!tiendaSeleccionada}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              variant="outlined"
              sx={sharedSelectSx}
            >
              <MenuItem value="">Todos</MenuItem>
              {usuarios.map((u) => (
                <MenuItem key={u} value={u}>{u}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {/* Segunda fila: Filtros por tipo y botones de acción */}
      <Grid container spacing={2} alignItems="center">
        {/* FILTROS POR TIPO DE DIFERENCIA */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showCorrectos} 
                  onChange={e => { setShowCorrectos(e.target.checked); setPage(0); }}
                  sx={{ color: theme.palette.success.main, '&.Mui-checked': { color: theme.palette.success.main }, p: 0.5 }}
                  size="small"
                />
              }
              label={<Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Correctos</Typography>}
              sx={{ mr: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showDiferenciasMenores} 
                  onChange={e => { setShowDiferenciasMenores(e.target.checked); setPage(0); }}
                  sx={{ color: theme.palette.warning.main, '&.Mui-checked': { color: theme.palette.warning.main }, p: 0.5 }}
                  size="small"
                />
              }
              label={<Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Menores</Typography>}
              sx={{ mr: 1 }}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={showDiferenciasGraves} 
                  onChange={e => { setShowDiferenciasGraves(e.target.checked); setPage(0); }}
                  sx={{ color: theme.palette.error.main, '&.Mui-checked': { color: theme.palette.error.main }, p: 0.5 }}
                  size="small"
                />
              }
              label={<Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Graves</Typography>}
              sx={{ mr: 1 }}
            />
          </Box>
        </Grid>

        {/* BOTONES DE ACCIÓN */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={fetchData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              size="small"
              sx={{ 
                minWidth: 100,
                color: theme.palette.text.primary,
                borderColor: theme.palette.custom?.tableBorder || theme.palette.divider,
                '&:hover': { borderColor: theme.palette.primary.main }
              }}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleDownloadCSV}
              startIcon={<DownloadIcon />}
              size="small"
              sx={{ 
                minWidth: 100,
                color: theme.palette.text.primary,
                borderColor: theme.palette.custom?.tableBorder || theme.palette.divider,
                '&:hover': { borderColor: theme.palette.primary.main }
              }}
            >
              CSV
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenColumnModal}
              startIcon={<TuneIcon />}
              size="small"
              sx={{ 
                minWidth: 100,
                color: theme.palette.text.primary,
                borderColor: theme.palette.custom?.tableBorder || theme.palette.divider,
                '&:hover': { borderColor: theme.palette.primary.main }
              }}
            >
              Columnas
            </Button>
            <Button
              variant="outlined"
              onClick={onDeleteSelected}
              disabled={!selectedId}
              startIcon={<DeleteIcon />}
              size="small"
              sx={{ 
                minWidth: 100,
                color: !selectedId ? theme.palette.text.disabled : theme.palette.error.main,
                borderColor: !selectedId ? theme.palette.action.disabledBackground : theme.palette.error.main,
                '&:hover': { borderColor: !selectedId ? theme.palette.action.disabledBackground : theme.palette.error.light }
              }}
            >
              Eliminar
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

export default function Diferencias() {
  const theme = useTheme();

  const [allCierres, setAllCierres] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedId, setSelectedId] = useState(null);

  const [fechaDesde, setFechaDesde] = useState(moment().subtract(1, 'month'));
  const [fechaHasta, setFechaHasta] = useState(moment());
  const [selectedDatePreset, setSelectedDatePreset] = useState('custom');

  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [mediosPagoConfig, setMediosPagoConfig] = useState([]);

  const [buscador, setBuscador] = useState('');

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('fecha');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalDetalle, setModalDetalle] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);

  const [showCorrectos, setShowCorrectos] = useState(true);
  const [showDiferenciasMenores, setShowDiferenciasMenores] = useState(true);
  const [showDiferenciasGraves, setShowDiferenciasGraves] = useState(true);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCierre, setEditCierre] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(''); // formato 'YYYY-MM'

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Función para transformar datos de cierre al formato de DetallesCierre
  const transformarDatosParaDetalles = (cierre) => {
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
      fecha: cierre.fecha ? moment(cierre.fecha).format('DD/MM/YYYY') : moment().format('DD/MM/YYYY'),
      tienda: cierre.tienda || 'N/A',
      usuario: cierre.usuario || 'N/A',
      responsable: cierre.usuario || 'N/A',
      mediosPago: mediosPago,
      granTotalMedios: granTotalMedios,
      granTotalMediosCobrado: granTotalMediosCobrado,
      balanceSinJustificar: balanceSinJustificar,
      justificaciones: cierre.justificaciones?.map(j => ({
        fecha: j.fecha || cierre.fecha ? moment(cierre.fecha).format('DD/MM/YYYY') : '',
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

  const handleCloseSnackbar = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchCierres = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // console.log('Fetching cierres from:', API_BASE_URL); // Remove, not needed
      // Enviar fechas en formato DD/MM/YYYY
      const pad = (n) => n.toString().padStart(2, '0');
      const fechaDesdeStr = fechaDesde ? `${pad(fechaDesde.date())}/${pad(fechaDesde.month() + 1)}/${fechaDesde.year()}` : '';
      const fechaHastaStr = fechaHasta ? `${pad(fechaHasta.date())}/${pad(fechaHasta.month() + 1)}/${fechaHasta.year()}` : '';
      const params = {
        fechaDesde: fechaDesdeStr,
        fechaHasta: fechaHastaStr,
        page: page + 1, // Backend usa 1-based index
        limit: rowsPerPage === -1 ? 1000 : rowsPerPage, // Si "Todas", usar un límite alto
        sortBy: orderBy,
        sortOrder: order,
      };
      if (tiendaSeleccionada) params.tienda = tiendaSeleccionada;
      if (usuarioSeleccionado) params.usuario = usuarioSeleccionado;
      // console.log('Request params:', params); // Optional: keep for debugging
      const response = await axiosWithFallback('/api/cierres-completo', { params: params });
      const data = response.data;
      // console.log('Response received:', response.status); // Optional: keep for debugging
      // console.log('Response data structure:', data); // Optional: keep for debugging
      
      // Manejar diferentes estructuras de respuesta del servidor
      let cierresData;
      let total;
      
      if (data && typeof data === 'object') {
        // Si la respuesta tiene la estructura esperada: { data: [...], total: number }
        if (data.data && Array.isArray(data.data)) {
          cierresData = data.data;
          total = data.total || data.data.length;
        }
        // Si la respuesta es directamente un array
        else if (Array.isArray(data)) {
          cierresData = data;
          total = data.length;
        }
        // Si la respuesta tiene otra estructura
        else {
          console.warn('Unexpected response structure:', data);
          cierresData = [];
          total = 0;
        }
      } else {
        console.warn('Invalid response data:', data);
        cierresData = [];
        total = 0;
      }
      
      setTotalRecords(total);
      
      const mapped = cierresData.map((cierre) => {
        let mediosPago = [];
        try {
          const mp = typeof cierre.medios_pago === 'string'
            ? JSON.parse(cierre.medios_pago)
            : cierre.medios_pago || {};
          
          // Función para procesar valores numéricos con comas
          const processNumericValue = (value) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              // Convertir comas a puntos decimales y eliminar espacios
              const cleaned = value.replace(/,/g, '.').trim();
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          };
          
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
        // Asegurar que la fecha recibida esté en formato DD/MM/YYYY
        let fechaFormateada = cierre.fecha;
        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaFormateada)) {
          // Si viene en formato YYYY-MM-DD, convertir
          const [y, m, d] = fechaFormateada.split('-');
          fechaFormateada = `${pad(d)}/${pad(m)}/${y}`;
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(fechaFormateada)) {
          // Si viene en formato DD-MM-YYYY, convertir a DD/MM/YYYY
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
      console.error('Error fetching cierres:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: '/api/cierres-completo'
      });
      const errorMessage = err.response?.data?.message || err.message || 'Error al cargar los datos';
      setError(`Error al cargar los datos: ${errorMessage}`);
      showSnackbar(`Error al cargar los datos: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, tiendaSeleccionada, usuarioSeleccionado, page, rowsPerPage, orderBy, order, showSnackbar]);

  // DELETE usando el id en la URL RESTful
  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) {
      showSnackbar('No hay nada seleccionado para eliminar.', 'warning');
      return;
    }
    setConfirmDeleteOpen(true);
  }, [selectedId, showSnackbar]);

  // Ejecuta el borrado real tras confirmar
  const confirmDelete = useCallback(async () => {
    setConfirmDeleteOpen(false);
    try {
      await axiosWithFallback(`/api/cierres-completo/${selectedId}`, { method: 'delete' });
      showSnackbar('Entrada eliminada exitosamente.', 'success');
      setSelectedId(null);
      fetchCierres();
    } catch (err) {
      console.error(err);
      showSnackbar('Error al eliminar la entrada.', 'error');
    }
  }, [selectedId, fetchCierres, showSnackbar]);

  useEffect(() => {
    fetchCierres();
  }, [fetchCierres]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosWithFallback('/localStorage');
        const configData = res.data;
        setMotivos(configData.motivos_error_pago || []);
        setTiendas(configData.tiendas || []);
        setMediosPagoConfig(configData.medios_pago || []);
      } catch (err) {
        console.error(err);
        showSnackbar('Error al cargar la configuración inicial.', 'error');
      }
    })();
  }, [showSnackbar]);

  useEffect(() => {
    // Incluir 'id' como primera columna visible por defecto
    setVisibleColumns([
      'id',
      'fecha',
      'tienda',
      'usuario',
      'efectivo_facturado',
      'efectivo_cobrado',
      'tarjetas_facturado',
      'tarjetas_cobrado',
      'gran_total',
      'total_ajustado',
      'balance_sin_justificar',
      'motivos',
      'estado',
      'acciones',
    ]);
  }, []);

  useEffect(() => {
    if (tiendaSeleccionada) {
      const us = [
        ...new Set(
          allCierres
            .filter((item) => item.tienda === tiendaSeleccionada)
            .map((item) => item.usuario)
        ),
      ];
      setUsuarios(us);
      if (usuarioSeleccionado && !us.includes(usuarioSeleccionado)) {
        setUsuarioSeleccionado('');
      }
    } else {
      setUsuarios([...new Set(allCierres.map((item) => item.usuario))]);
    }
  }, [tiendaSeleccionada, allCierres, usuarioSeleccionado]);

  const cierresFiltrados = useMemo(
    () =>
      allCierres.filter((c) => {
        const estado = getEstado(c);
        if (estado === ESTADOS_CIERRE.CORRECTO && !showCorrectos) return false;
        if (estado === ESTADOS_CIERRE.DIFERENCIA_MENOR && !showDiferenciasMenores) return false;
        if (estado === ESTADOS_CIERRE.DIFERENCIA_GRAVE && !showDiferenciasGraves) return false;
        return true;
      }),
    [
      allCierres,
      showCorrectos,
      showDiferenciasMenores,
      showDiferenciasGraves,
    ]
  );

  const sortedCierres = useMemo(
    () => cierresFiltrados, // Ya vienen ordenados del servidor
    [cierresFiltrados]
  );

  const paginatedCierres = useMemo(
    () => sortedCierres, // Ya vienen paginados del servidor
    [sortedCierres]
  );

  const estadisticas = useMemo(
    () => calcularEstadisticas(cierresFiltrados),
    [cierresFiltrados]
  );

  const allPossibleColumns = useMemo(() => {
    const baseColumns = [
      {
        id: 'id',
        label: 'ID',
        width: 50,
        sortable: true,
        format: (v) => v,
      },
      {
        id: 'fecha',
        label: 'Fecha',
        width: 85,
        sortable: true,
        format: (v) => moment(v).format('DD/MM/YYYY'),
      },
      { id: 'tienda', label: 'Tienda', width: 70, sortable: true },
      { id: 'usuario', label: 'Usuario', width: 70, sortable: true },
    ];

    // Columnas sintetizadas para medios de pago
    const mediosSintetizadosColumns = [
      {
        id: 'efectivo_facturado',
        label: 'Efectivo Fact.',
        width: 85,
        align: 'right',
        format: (_, row) => {
          const efectivo = row.medios_pago.find((x) => x.medio.toLowerCase().includes('efectivo'));
          return efectivo ? <ExactValue value={efectivo.facturado} /> : '-';
        },
        exportId: 'efectivo_facturado',
      },
      {
        id: 'efectivo_cobrado',
        label: 'Efectivo Cobr.',
        width: 85,
        align: 'right',
        format: (_, row) => {
          const efectivo = row.medios_pago.find((x) => x.medio.toLowerCase().includes('efectivo'));
          return efectivo ? <ExactValue value={efectivo.cobrado} /> : '-';
        },
        exportId: 'efectivo_cobrado',
      },
      {
        id: 'tarjetas_facturado',
        label: 'Tarjetas Fact.',
        width: 85,
        align: 'right',
        format: (_, row) => {
          const tarjetas = row.medios_pago.filter((x) => !x.medio.toLowerCase().includes('efectivo'));
          const sum = tarjetas.reduce((s, x) => s + (x.facturado || 0), 0);
          return <ExactValue value={sum} />;
        },
        exportId: 'tarjetas_facturado',
      },
      {
        id: 'tarjetas_cobrado',
        label: 'Tarjetas Cobr.',
        width: 85,
        align: 'right',
        format: (_, row) => {
          const tarjetas = row.medios_pago.filter((x) => !x.medio.toLowerCase().includes('efectivo'));
          const sum = tarjetas.reduce((s, x) => s + (x.cobrado || 0), 0);
          return <ExactValue value={sum} />;
        },
        exportId: 'tarjetas_cobrado',
      },
    ];

    const totalColumn = {
      id: 'gran_total',
      label: 'Diferencia Total',
      width: 85,
      align: 'right',
      format: (_, row) => {
        const sum = row.medios_pago.reduce(
          (s, x) => s + (x.differenceVal || 0),
          0
        );
        return <ExactValue value={sum} />;
      },
      exportId: 'grand_total_difference',
    };

    const ajustesColumns = [
      {
        id: 'total_ajustado',
        label: 'Total Ajustado',
        width: 85,
        align: 'right',
        format: (_, row) => {
          const sum = row.justificaciones.reduce(
            (s, j) => s + (j.ajuste || 0),
            0
          );
          return <ExactValue value={sum} />;
        },
        exportId: 'total_ajustado',
      },
      {
        id: 'balance_sin_justificar',
        label: 'Balance Final',
        width: 85,
        align: 'right',
        format: (v) => <ExactValue value={v} />,
        exportId: 'grand_difference_total_after_justification',
      },
      {
        id: 'motivos',
        label: 'Motivos',
        width: 80,
        format: (_, row) => {
          const uniq = [
            ...new Set(row.justificaciones.map((j) => j.motivo)),
          ];
          return uniq.length ? (
            <Box>
              {uniq.map((mot, idx) => (
                <Typography
                  key={idx}
                  variant="body2"
                  component="span"
                  display="block"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {mot.length > 12 ? mot.substring(0, 12) + '...' : mot}
                </Typography>
              ))}
            </Box>
          ) : (
            '-'
          );
        },
        exportId: 'motivos_justificacion',
      },
    ];

    const estadoColumn = {
      id: 'estado',
      label: 'Estado',
      width: 70,
      format: (_, row) => {
        const e = getEstado(row);
        return (
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                mr: 1,
                backgroundColor: e.color,
              }}
            />
            <Typography variant="body2">{e.label}</Typography>
          </Box>
        );
      },
      exportId: 'estado',
    };

    const actionsColumn = {
      id: 'acciones',
      label: 'Acciones',
      width: 80,
      format: (_, row) => (
        <Box display="flex" flexDirection="row" alignItems="center" gap={0.5}>
          <Tooltip title="Ver detalles" arrow>
            <IconButton
              size="small"
              onClick={() => setModalDetalle(row)}
              color="primary"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar cierre" arrow>
            <IconButton
              size="small"
              onClick={() => { setEditCierre(row); setEditModalOpen(true); }}
              sx={{ color: '#0d47a1' }} // Azul más oscuro
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
      exportable: false,
    };

    return [
      ...baseColumns,
      ...mediosSintetizadosColumns,
      totalColumn,
      ...ajustesColumns,
      estadoColumn,
      actionsColumn,
    ];
  }, [mediosPagoConfig]);

  const displayedColumns = useMemo(
    () => allPossibleColumns.filter((col) => visibleColumns.includes(col.id)),
    [allPossibleColumns, visibleColumns]
  );

  const handleRequestSort = useCallback(
    (property) => {
      const isAsc = orderBy === property && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(property);
      setPage(0); // Resetear página al cambiar ordenamiento
    },
    [order, orderBy]
  );

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  const handleDownloadCSV = useCallback(() => {
    const exportableColumns = allPossibleColumns.filter(
      (col) => col.exportable !== false && visibleColumns.includes(col.id)
    );

    const headers = exportableColumns.map((col) => col.label).join(',');
    const rows = sortedCierres.map((row) => {
      return exportableColumns
        .map((col) => {
          let value;
          if (col.id === 'fecha') {
            value = moment(row.fecha).format('DD-MM-YYYY');
          } else if (col.id === 'efectivo_facturado') {
            const efectivo = row.medios_pago.find((x) => x.medio.toLowerCase().includes('efectivo'));
            value = efectivo ? efectivo.facturado : 0;
          } else if (col.id === 'efectivo_cobrado') {
            const efectivo = row.medios_pago.find((x) => x.medio.toLowerCase().includes('efectivo'));
            value = efectivo ? efectivo.cobrado : 0;
          } else if (col.id === 'tarjetas_facturado') {
            const tarjetas = row.medios_pago.filter((x) => !x.medio.toLowerCase().includes('efectivo'));
            value = tarjetas.reduce((s, x) => s + (x.facturado || 0), 0);
          } else if (col.id === 'tarjetas_cobrado') {
            const tarjetas = row.medios_pago.filter((x) => !x.medio.toLowerCase().includes('efectivo'));
            value = tarjetas.reduce((s, x) => s + (x.cobrado || 0), 0);
          } else if (col.id === 'gran_total') {
            value = row.medios_pago.reduce(
              (s, x) => s + (x.differenceVal || 0),
              0
            );
          } else if (col.id === 'total_ajustado') {
            value = row.justificaciones.reduce(
              (s, j) => s + (j.ajuste || 0),
              0
            );
          } else if (col.id === 'balance_sin_justificar') {
            value = row.grand_difference_total_after_justification || 0;
          } else if (col.id === 'motivos') {
            value = row.justificaciones
              .map((j) => j.motivo)
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(';');
          } else if (col.id === 'estado') {
            value = getEstado(row).label;
          } else {
            value = row[col.id];
          }
          const str = String(value || '').replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'cierres_caja.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSnackbar('Datos exportados exitosamente.', 'success');
  }, [sortedCierres, allPossibleColumns, visibleColumns, showSnackbar]);

  function formatFecha(fecha) {
    // Intenta formatear como YYYY-MM-DD, si no es válido, muestra 'Fecha inválida'
    const m = moment(fecha, 'YYYY-MM-DD', true);
    return m.isValid() ? m.format('DD/MM/YYYY') : 'Fecha inválida';
  }

  const handleMonthChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedMonth(value);
    if (value) {
      const [year, month] = value.split('-');
      const firstDay = moment(`${year}-${month}-01`);
      const lastDay = moment(firstDay).endOf('month');
      setFechaDesde(firstDay);
      setFechaHasta(lastDay);
      setSelectedDatePreset('custom');
      setPage(0);
    }
  }, [setSelectedMonth, setFechaDesde, setFechaHasta, setSelectedDatePreset, setPage]);

  return (
    <Box
      p={3}
      sx={{
        fontFamily: theme.typography.fontFamily,
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        minHeight: '100vh',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        <HeaderControls
          fechaDesde={fechaDesde}
          setFechaDesde={setFechaDesde}
          fechaHasta={fechaHasta}
          setFechaHasta={setFechaHasta}
          selectedDatePreset={selectedDatePreset}
          setSelectedDatePreset={setSelectedDatePreset}
          tiendaSeleccionada={tiendaSeleccionada}
          setTiendaSeleccionada={setTiendaSeleccionada}
          usuarioSeleccionado={usuarioSeleccionado}
          setUsuarioSeleccionado={setUsuarioSeleccionado}
          motivoSeleccionado={motivoSeleccionado}
          setMotivoSeleccionado={setMotivoSeleccionado}
          tiendas={tiendas}
          usuarios={usuarios}
          motivos={motivos}
          buscador={buscador}
          setBuscador={setBuscador}
          fetchData={fetchCierres}
          loading={loading}
          handleDownloadCSV={handleDownloadCSV}
          handleOpenColumnModal={() => setColumnModalOpen(true)}
          selectedId={selectedId}
          onDeleteSelected={handleDeleteSelected}
          showCorrectos={showCorrectos}
          setShowCorrectos={setShowCorrectos}
          showDiferenciasMenores={showDiferenciasMenores}
          setShowDiferenciasMenores={setShowDiferenciasMenores}
          showDiferenciasGraves={showDiferenciasGraves}
          setShowDiferenciasGraves={setShowDiferenciasGraves}
          setPage={setPage}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          handleMonthChange={handleMonthChange}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        <Collapse in={!loading} timeout={600}>
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {[
              {
                title: 'Total Cierres',
                value: estadisticas.total,
                color: theme.palette.info.main,
                tooltip: 'Total de cierres en el período seleccionado',
              },
              {
                title: 'Correctos',
                value: estadisticas.correctos,
                color: ESTADOS_CIERRE.CORRECTO.color,
                tooltip: 'Cierres sin diferencias',
              },
              {
                title: 'Diferencias menores',
                value: estadisticas.advertencias,
                color: ESTADOS_CIERRE.DIFERENCIA_MENOR.color,
                tooltip: 'Diferencias en rango -$10.000 a $10.000 (excluye 0)',
              },
              {
                title: 'Diferencias graves',
                value: estadisticas.errores,
                color: ESTADOS_CIERRE.DIFERENCIA_GRAVE.color,
                tooltip: 'Diferencias > $10.000 o < -$10.000',
              },
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} md={3} key={i}>
                <StatsCard {...stat} />
              </Grid>
            ))}
          </Grid>
        </Collapse>

        <Collapse in={!loading} timeout={600}>
          <Paper
            elevation={2}
            sx={{
              overflowX: 'auto',
              mb: 3,
              position: 'relative',
              scrollBehavior: 'smooth',
              borderRadius: 1,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  {displayedColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align || 'left'}
                      sortDirection={orderBy === col.id ? order : false}
                      sx={{ 
                        color: theme.palette.text.primary, 
                        backgroundColor: theme.palette.custom?.tableRow || theme.palette.background.default, 
                        borderBottom: `1px solid ${theme.palette.custom?.tableBorder || theme.palette.divider}`,
                        width: col.width,
                        minWidth: col.width,
                        fontWeight: 'bold'
                      }}
                    >
                      {col.sortable ? (
                        <TableSortLabel
                          active={orderBy === col.id}
                          direction={orderBy === col.id ? order : 'asc'}
                          onClick={() => handleRequestSort(col.id)}
                          sx={{
                            color: `${theme.palette.text.primary} !important`,
                            '& .MuiTableSortLabel-icon': {
                              color: `${theme.palette.text.primary} !important`,
                            },
                          }}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <LoadingSkeleton columns={displayedColumns} />
                ) : cierresFiltrados.length > 0 ? (
                  paginatedCierres.map((cierre) => {
                    const estado = getEstado(cierre);
                    return (
                      <TableRow
                        key={cierre.id}
                        hover
                        selected={selectedId === cierre.id}
                        onClick={() => setSelectedId(cierre.id)}
                        sx={{
                          cursor: 'pointer',
                          ...(selectedId === cierre.id
                            ? { backgroundColor: alpha(theme.palette.primary.main, 0.14) }
                            : {}),
                        }}
                      >
                        {displayedColumns.map((col) => (
                          <TableCell key={col.id} align={col.align || 'left'}>
                            {col.format ? col.format(cierre[col.id], cierre) : cierre[col.id]}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={displayedColumns.length}
                      align="center"
                      sx={{ py: 4 }}
                    >
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'Todas', value: -1 }]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={rowsPerPage === -1 ? 0 : page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              sx={{ borderTop: `1px solid ${theme.palette.divider}` }}
            />
          </Paper>
        </Collapse>

        {/* Modal de detalle usando el componente DetallesCierre */}
        <DetallesCierre 
          resumenData={transformarDatosParaDetalles(modalDetalle)}
          onClose={() => { setModalDetalle(null); setTabValue(0); }}
          open={modalDetalle !== null}
        />

        <Modal open={columnModalOpen} onClose={() => setColumnModalOpen(false)}>
        <Fade in={columnModalOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: 400 },
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 3,
              borderRadius: 2,
              outline: 'none',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Typography variant="h6" gutterBottom>Ajustar Visibilidad de Columnas</Typography>
            <Box sx={{ mb: 2 }}>
              <Button size="small" onClick={() => setVisibleColumns(allPossibleColumns.map((c) => c.id))} sx={{ mr: 1 }} variant="outlined">Seleccionar Todo</Button>
              <Button size="small" onClick={() => setVisibleColumns([])} variant="outlined">Deseleccionar Todo</Button>
            </Box>
            <Grid container spacing={1}>
              {allPossibleColumns.filter((c) => c.id !== 'acciones').map((col) => (
                <Grid item xs={6} key={col.id}>
                  <FormControlLabel
                    control={<Checkbox checked={visibleColumns.includes(col.id)} onChange={() => {
                      setVisibleColumns((prev) =>
                        prev.includes(col.id)
                          ? prev.filter((id) => id !== col.id)
                          : [...prev, col.id]
                      );
                    }} />}
                    label={col.label}
                  />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => setColumnModalOpen(false)} sx={{ borderRadius: 1 }}>Cerrar</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar este cierre? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición (usa Modificar.jsx) */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditCierre(null); }}>
        <Fade in={editModalOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              // El modal de edición ahora deja que el propio contenido (Modificar.jsx) defina el ancho
              width: 'auto',
              minWidth: { xs: '95vw', sm: 500 },
              maxWidth: 'none',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 3,
              borderRadius: 2,
              outline: 'none',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {editCierre && (
              <Modificar
                cierre={editCierre}
                onClose={() => { setEditModalOpen(false); setEditCierre(null); }}
                onSave={() => {
                  setEditModalOpen(false);
                  setEditCierre(null);
                  fetchCierres();
                  showSnackbar('Cierre actualizado correctamente.', 'success');
                }}
              />
            )}
          </Box>
        </Fade>
      </Modal>

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
      </Paper>
    </Box>
  );
}
