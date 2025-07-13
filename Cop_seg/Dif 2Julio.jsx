// Diferencias.jsx

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import moment from 'moment';
import axios from 'axios';
import { API_BASE_URL } from '../config';
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
} from '@mui/icons-material';

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
  return (
    <Tooltip title={tooltip} arrow>
      <Paper
        elevation={2}
        sx={{
          borderBottom: `2px solid ${color}`,
          py: 2,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          transition: 'background-color 0.2s, box-shadow 0.2s',
          '&:hover': { backgroundColor: 'action.hover', boxShadow: 4 },
          borderRadius: 2,
          backgroundColor: 'background.paper',
          height: '100%',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: color }}>
          {value}
        </Typography>
      </Paper>
    </Tooltip>
  );
});

const ExactValue = React.memo(function ExactValue({ value, currency = true }) {
  return (
    <Typography sx={styles.exactValue}>
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
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <InfoIcon color="disabled" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No se encontraron resultados
      </Typography>
      <Typography variant="body2" color="text.secondary">
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
}) {
  const theme = useTheme();

  const handleDatePresetChange = useCallback(
    (event) => {
      const preset = event.target.value;
      setSelectedDatePreset(preset);

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
    [setFechaDesde, setFechaHasta, setSelectedDatePreset]
  );

  const handleFechaDesdeChange = useCallback(
    (event) => {
      setFechaDesde(event.target.value ? moment(event.target.value) : null);
      setSelectedDatePreset('custom');
    },
    [setFechaDesde, setSelectedDatePreset]
  );

  const handleFechaHastaChange = useCallback(
    (event) => {
      setFechaHasta(event.target.value ? moment(event.target.value) : null);
      setSelectedDatePreset('custom');
    },
    [setFechaHasta, setSelectedDatePreset]
  );

  return (
    <Box mb={3}>
      <Grid container spacing={2} alignItems="center" wrap="wrap">
        {/* SELECTOR DE PRESETS */}
        <Grid item xs={12} sm={6} md={2} lg={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Rango</InputLabel>
            <Select
              label="Rango"
              value={selectedDatePreset}
              onChange={handleDatePresetChange}
              variant="outlined"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="custom">Rango Personalizado</MenuItem>
              <MenuItem value="last7days">Últimos 7 días</MenuItem>
              <MenuItem value="last30days">Últimos 30 días</MenuItem>
              <MenuItem value="thisMonth">Este mes</MenuItem>
              <MenuItem value="lastMonth">Mes anterior</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* FECHA DESDE */}
        <Grid item xs={12} sm={6} md={2.5} lg={2.5}>
          <TextField
            fullWidth
            size="small"
            label="Fecha Desde"
            type="date"
            variant="outlined"
            value={fechaDesde ? fechaDesde.format('YYYY-MM-DD') : ''}
            onChange={handleFechaDesdeChange}
            InputLabelProps={{ shrink: true }}
            disabled={selectedDatePreset !== 'custom'}
            sx={{ borderRadius: 1 }}
          />
        </Grid>

        {/* FECHA HASTA */}
        <Grid item xs={12} sm={6} md={2.5} lg={2.5}>
          <TextField
            fullWidth
            size="small"
            label="Fecha Hasta"
            type="date"
            variant="outlined"
            value={fechaHasta ? fechaHasta.format('YYYY-MM-DD') : ''}
            onChange={handleFechaHastaChange}
            InputLabelProps={{ shrink: true }}
            disabled={selectedDatePreset !== 'custom'}
            sx={{ borderRadius: 1 }}
          />
        </Grid>

        {/* SELECT TIENDA */}
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Tienda</InputLabel>
            <Select
              label="Tienda"
              value={tiendaSeleccionada}
              onChange={(e) => setTiendaSeleccionada(e.target.value)}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              variant="outlined"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {tiendas.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* SELECT USUARIO */}
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Usuario</InputLabel>
            <Select
              label="Usuario"
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              disabled={!tiendaSeleccionada}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              variant="outlined"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {usuarios.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* SELECT MOTIVO */}
        <Grid item xs={12} sm={6} md={3} lg={1.5}>
          <FormControl fullWidth size="small">
            <InputLabel>Motivo</InputLabel>
            <Select
              label="Motivo"
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
              variant="outlined"
              sx={{ borderRadius: 1 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {motivos.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* BUSCADOR */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <TextField
            fullWidth
            size="small"
            label="Buscar..."
            variant="outlined"
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
        </Grid>

        {/* BOTONES */}
        <Grid item xs={12} sm={6} md={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={fetchData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            sx={{ height: '40px', borderRadius: 1 }}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleDownloadCSV}
            startIcon={<DownloadIcon />}
            sx={{ height: '40px', borderRadius: 1 }}
          >
            CSV
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleOpenColumnModal}
            startIcon={<TuneIcon />}
            sx={{ height: '40px', borderRadius: 1 }}
          >
            Columnas
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={1}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onDeleteSelected}
            disabled={!selectedId}
            startIcon={<DeleteIcon />}
            sx={{ height: '40px', borderRadius: 1 }}
          >
            Eliminar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
});

export default function Diferencias() {
  const theme = useTheme();

  const [allCierres, setAllCierres] = useState([]);
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

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback((_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const fetchCierres = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        fechaDesde: fechaDesde ? fechaDesde.format('DD-MM-YYYY') : '',
        fechaHasta: fechaHasta ? fechaHasta.format('DD-MM-YYYY') : '',
      };
      if (tiendaSeleccionada) params.tienda = tiendaSeleccionada;
      if (usuarioSeleccionado) params.usuario = usuarioSeleccionado;

      const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`, { params });
      const mapped = response.data.map((cierre) => {
        let mediosPago = [];
        try {
          const mp = typeof cierre.medios_pago === 'string'
            ? JSON.parse(cierre.medios_pago)
            : cierre.medios_pago || {};
          mediosPago = Array.isArray(mp)
            ? mp
            : Object.keys(mp).map((key) => ({
                medio: key,
                facturado: mp[key].facturado,
                cobrado: mp[key].cobrado,
                differenceVal: mp[key].differenceVal,
              }));
        } catch {
          mediosPago = [];
        }
        return {
          ...cierre,
          fecha: moment(cierre.fecha, 'DD-MM-YYYY'),
          medios_pago: mediosPago,
          justificaciones: cierre.justificaciones || [],
        };
      });
      setAllCierres(mapped);
      showSnackbar('Datos cargados exitosamente.', 'success');
    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos. Intente nuevamente.');
      showSnackbar('Error al cargar los datos. Intente nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, tiendaSeleccionada, usuarioSeleccionado, showSnackbar]);

  // DELETE con id como query param
  const handleDeleteSelected = useCallback(async () => {
    if (!selectedId) {
      showSnackbar('No hay nada seleccionado para eliminar.', 'warning');
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/api/cierres-completo`, {
        params: { id: selectedId },
      });
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
        const res = await axios.get(`${API_BASE_URL}/localStorage`);
        setMotivos(res.data.motivos_error_pago || []);
        setTiendas(res.data.tiendas || []);
        setMediosPagoConfig(res.data.medios_pago || []);
      } catch (err) {
        console.error(err);
        showSnackbar('Error al cargar la configuración inicial.', 'error');
      }
    })();
  }, [showSnackbar]);

  useEffect(() => {
    if (mediosPagoConfig.length) {
      setVisibleColumns([
        'fecha',
        'tienda',
        'usuario',
        ...mediosPagoConfig.map((m) => `medio_${m}`),
        'gran_total',
        'total_ajustado',
        'balance_sin_justificar',
        'motivos',
        'estado',
        'acciones',
      ]);
    }
  }, [mediosPagoConfig]);

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
      filtrarCierres({
        cierres: allCierres,
        fechaDesde,
        fechaHasta,
        tienda: tiendaSeleccionada,
        usuario: usuarioSeleccionado,
        motivo: motivoSeleccionado,
        buscador,
      }),
    [
      allCierres,
      fechaDesde,
      fechaHasta,
      tiendaSeleccionada,
      usuarioSeleccionado,
      motivoSeleccionado,
      buscador,
    ]
  );

  const sortedCierres = useMemo(
    () => ordenarCierres({ cierres: cierresFiltrados, order, orderBy }),
    [cierresFiltrados, order, orderBy]
  );

  const paginatedCierres = useMemo(
    () =>
      sortedCierres.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedCierres, page, rowsPerPage]
  );

  const estadisticas = useMemo(
    () => calcularEstadisticas(cierresFiltrados),
    [cierresFiltrados]
  );

  const allPossibleColumns = useMemo(() => {
    const baseColumns = [
      {
        id: 'fecha',
        label: 'Fecha',
        width: 100,
        sortable: true,
        format: (v) => moment(v).format('DD-MM-YYYY'),
      },
      { id: 'tienda', label: 'Tienda', width: 80, sortable: true },
      { id: 'usuario', label: 'Usuario', width: 80, sortable: true },
    ];

    const mediosColumns = mediosPagoConfig.map((medio) => ({
      id: `medio_${medio}`,
      label: medio,
      width: 80,
      align: 'right',
      format: (_, row) => {
        const m = row.medios_pago.find((x) => x.medio === medio);
        return m ? <ExactValue value={m.differenceVal} /> : '-';
      },
      exportId: `medio_${medio}_difference`,
    }));

    const totalColumn = {
      id: 'gran_total',
      label: 'Gran Total',
      width: 80,
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
        width: 80,
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
        label: 'Balance sin Justificar',
        width: 80,
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
                >
                  {mot}
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
      width: 80,  
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
      width: 100,  
      format: (_, row) => (  
        <Tooltip title="Ver detalles" arrow>  
          <IconButton  
            size="small"  
            onClick={() => setModalDetalle(row)}  
            color="primary"  
          >  
            <VisibilityIcon fontSize="small" />  
          </IconButton>  
        </Tooltip>  
      ),  
      exportable: false,  
    };  
  
    return [  
      ...baseColumns,  
      ...mediosColumns,  
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
    if (!sortedCierres.length) {  
      showSnackbar('No hay datos para exportar.', 'warning');  
      return;  
    }  
  
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
          } else if (col.id.startsWith('medio_')) {  
            const medioName = col.id.replace('medio_', '');  
            const m = row.medios_pago.find((x) => x.medio === medioName);  
            value = m ? m.differenceVal : 0;  
          } else if (col.id === 'gran_total') {  
            value = row.medios_pago.reduce(  
              (s, x) => s + (x.differenceVal || 0),  
              0  
            );  
          } else if (  
            col.id === 'total_ajustado'  
          ) {  
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
  
  return (  
    <Box  
      p={3}  
      sx={{  
        fontFamily: 'Inter',  
        backgroundColor: theme.palette.background.default,  
        minHeight: '100vh',  
      }}  
    >  
      <Paper  
        elevation={3}  
        sx={{  
          p: 4,  
          borderRadius: 2,  
          backgroundColor: theme.palette.background.paper,  
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
        />  
  
        {error && (  
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>  
            {error}  
          </Alert>  
        )}  
  
        <Collapse in={!loading} timeout={600}>  
          <Grid container spacing={2} sx={{ mb: 3 }}>  
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
              <Grid item xs={6} sm={6} md={3} key={i}>  
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
            }}  
          >  
            <Table size="small" sx={{ minWidth: 800 }}>  
              <TableHead>  
                <TableRow sx={styles.tableHeader}>  
                  {displayedColumns.map((col) => (  
                    <TableCell  
                      key={col.id}  
                      align={col.align || 'left'}  
                      sx={{  
                        color: 'text.primary',  
                        width: col.width,  
                        minWidth: col.width,  
                        backgroundColor: 'background.paper',  
                        fontWeight: 'bold',  
                        transition: 'background-color 0.3s ease',  
                      }}  
                      sortDirection={orderBy === col.id ? order : false}  
                    >  
                      {col.sortable ? (  
                        <TableSortLabel  
                          active={orderBy === col.id}  
                          direction={orderBy === col.id ? order : 'asc'}  
                          onClick={() => handleRequestSort(col.id)}  
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
                          ...styles.row,  
                          borderLeft: `4px solid ${estado.color}`,  
                        }}  
                      >  
                        {displayedColumns.map((col) => {  
                          const cellValue = cierre[col.id];  
                          return (  
                            <TableCell  
                              key={col.id}  
                              align={col.align || 'left'}  
                              sx={{ width: col.width }}  
                            >  
                              {col.format  
                                ? col.format(cellValue, cierre)  
                                : cellValue}  
                            </TableCell>  
                          );  
                        })}  
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
            <Slide  
              direction="up"  
              in={cierresFiltrados.length > 0}  
              mountOnEnter  
              unmountOnExit  
            >  
              <TablePagination  
                rowsPerPageOptions={[5, 10, 25]}  
                component="div"  
                count={cierresFiltrados.length}  
                rowsPerPage={rowsPerPage}  
                page={page}  
                onPageChange={handleChangePage}  
                onRowsPerPageChange={handleChangeRowsPerPage}  
                labelRowsPerPage="Filas por página:"  
                sx={{ borderTop: `1px solid ${theme.palette.divider}` }}  
              />  
            </Slide>  
          </Paper>  
        </Collapse>  
      </Paper>  
  
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
              bgcolor: 'background.paper',  
              boxShadow: 24,  
              p: 3,  
              borderRadius: 2,  
              outline: 'none',  
              maxHeight: '90vh',  
              overflowY: 'auto',  
              transition: 'transform 0.3s ease',  
            }}  
          >  
            <Typography variant="h5" gutterBottom>  
              Detalle completo del cierre – {moment(modalDetalle?.fecha).format('DD/MM/YYYY')}  
            </Typography>  
            <Tabs  
              value={tabValue}  
              onChange={(_, nv) => setTabValue(nv)}  
              sx={{ mb: 3 }}  
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
                  <Typography variant="h6" sx={{ mb: 2 }}>Información básica</Typography>  
                  <Typography variant="body1"><strong>Tienda:</strong> {modalDetalle.tienda}</Typography>  
                  <Typography variant="body1"><strong>Usuario:</strong> {modalDetalle.usuario}</Typography>  
                  <Typography variant="body1"><strong>Estado:</strong> {getEstado(modalDetalle).label}</Typography>  
                </Grid>  
                <Grid item xs={12} md={6}>  
                  <Typography variant="h6" sx={{ mb: 2 }}>Totales</Typography>  
                  <Typography variant="body1"><strong>Facturado:</strong> <ExactValue value={modalDetalle.total_facturado} /></Typography>  
                  <Typography variant="body1"><strong>Cobrado:</strong> <ExactValue value={modalDetalle.total_cobrado} /></Typography>  
                  <Typography variant="body1"><strong>Diferencia:</strong> <ExactValue value={modalDetalle.grand_difference_total} /></Typography>  
                </Grid>  
              </Grid>  
            )}  
  
            {tabValue === 1 && modalDetalle && (  
              <>  
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Medios de pago</Typography>  
                <Table size="small">  
                  <TableHead>  
                    <TableRow>  
                      <TableCell>Medio</TableCell>  
                      <TableCell align="right">Facturado</TableCell>  
                      <TableCell align="right">Cobrado</TableCell>  
                      <TableCell align="right">Diferencia</TableCell>  
                    </TableRow>  
                  </TableHead>  
                  <TableBody>  
                    {modalDetalle.medios_pago.map((m, i) => (  
                      <TableRow key={i}>  
                        <TableCell>{m.medio}</TableCell>  
                        <TableCell align="right"><ExactValue value={m.facturado} /></TableCell>  
                        <TableCell align="right"><ExactValue value={m.cobrado} /></TableCell>  
                        <TableCell align="right"><ExactValue value={m.differenceVal} /></TableCell>  
                      </TableRow>  
                    ))}  
                  </TableBody>  
                </Table>  
              </>  
            )}  
  
            {tabValue === 2 && modalDetalle?.justificaciones?.length > 0 && (  
              <>  
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Justificaciones</Typography>  
                <Table size="small">  
                  <TableHead>  
                    <TableRow>  
                      <TableCell>Motivo</TableCell>  
                      <TableCell align="right">Monto</TableCell>  
                      <TableCell>Cliente</TableCell>  
                      <TableCell>Orden</TableCell>  
                    </TableRow>  
                  </TableHead>  
                  <TableBody>  
                    {modalDetalle.justificaciones.map((j, i) => (  
                      <TableRow key={i}>  
                        <TableCell><Typography variant="body2">{j.motivo}</Typography></TableCell>  
                        <TableCell align="right"><ExactValue value={j.monto_dif} /></TableCell>  
                        <TableCell>{j.cliente || '-'}</TableCell>  
                        <TableCell>{j.orden || '-'}</TableCell>  
                      </TableRow>  
                    ))}  
                  </TableBody>  
                </Table>  
              </>  
            )}  
  
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>  
              <Button variant="contained" onClick={() => { setModalDetalle(null); setTabValue(0); }} sx={{ borderRadius: 1 }}>Cerrar</Button>  
            </Box>  
          </Box>  
        </Fade>  
      </Modal>  
  
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
