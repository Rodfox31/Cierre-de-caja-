import React, { useEffect, useState, useMemo, useCallback } from 'react';
import moment from 'moment';
import { API_BASE_URL } from '../config';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import axios from 'axios';
import { 
  CheckCircle as CheckCircleIcon, 
  Warning as WarningIcon, 
  Error as ErrorIcon,
  AttachMoney as AttachMoneyIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  ListAlt as ListAltIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
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
  Chip,
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
  Slide
} from '@mui/material';

////////////////////////////////////////////////////////////////////////
// CONSTANTES
////////////////////////////////////////////////////////////////////////

const styles = {
  tableHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    bgcolor: 'background.paper',
    transition: 'background-color 0.3s ease'
  },
  row: {
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      backgroundColor: 'action.hover',
      boxShadow: 1
    }
  },
  exactValue: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    whiteSpace: 'nowrap'
  }
};

const ESTADOS_CIERRE = {
  CORRECTO: { 
    label: 'Correcto', 
    icon: <CheckCircleIcon color="success" />, 
    color: '#4caf50',
    bgColor: 'rgba(76, 175, 80, 0.1)'
  },
  DIFERENCIA_MENOR: { 
    label: 'Diferencia menor', 
    icon: <WarningIcon color="warning" />, 
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.1)'
  },
  DIFERENCIA_GRAVE: { 
    label: 'Diferencia grave', 
    icon: <ErrorIcon color="error" />, 
    color: '#f44336',
    bgColor: 'rgba(244, 67, 54, 0.1)'
  }
};

////////////////////////////////////////////////////////////////////////
// FUNCIONES AUXILIARES
////////////////////////////////////////////////////////////////////////

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value || 0);
}

// Umbral ±10.000 para diferenciar graves/menores
function getEstado(cierre) {
  const diffVal = Number(cierre.grand_difference_total) || 0;
  if (diffVal === 0) return ESTADOS_CIERRE.CORRECTO;
  if (diffVal > 10000 || diffVal < -10000) return ESTADOS_CIERRE.DIFERENCIA_GRAVE;
  return ESTADOS_CIERRE.DIFERENCIA_MENOR;
}

function filtrarCierres({
  cierres,
  fechaDesde,
  fechaHasta,
  tienda,
  usuario,
  motivo,
  buscador,
  conDiferencias
}) {
  return cierres.filter((cierre) => {
    const fechaCierre = moment(cierre.fecha);
    const cumpleFecha = (
      (!fechaDesde || fechaCierre.isSameOrAfter(fechaDesde)) &&
      (!fechaHasta || fechaCierre.isSameOrBefore(fechaHasta))
    );
    const cumpleTienda = !tienda || cierre.tienda === tienda;
    const cumpleUsuario = !usuario || cierre.usuario === usuario;
    const cumpleMotivo = !motivo ||
      (cierre.justificaciones && cierre.justificaciones.some(j => j.motivo === motivo));
    const textoBusqueda = buscador.toLowerCase().trim();
    const cumpleBusqueda = !textoBusqueda || (
      cierre.usuario.toLowerCase().includes(textoBusqueda) ||
      cierre.tienda.toLowerCase().includes(textoBusqueda)
    );
    const cumpleDiferencias = !conDiferencias ||
      Math.abs(Number(cierre.grand_difference_total)) > 0;

    return (
      cumpleFecha &&
      cumpleTienda &&
      cumpleUsuario &&
      cumpleMotivo &&
      cumpleBusqueda &&
      cumpleDiferencias
    );
  });
}

function ordenarCierres({ cierres, order, orderBy }) {
  return [...cierres].sort((a, b) => {
    if (orderBy === 'fecha') {
      return order === 'asc' 
        ? new Date(a.fecha) - new Date(b.fecha) 
        : new Date(b.fecha) - new Date(a.fecha);
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
}

function calcularEstadisticas(cierres) {
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
    diferenciaTotal
  };
}

////////////////////////////////////////////////////////////////////////
// COMPONENTES REUTILIZABLES
////////////////////////////////////////////////////////////////////////

const StatsCard = React.memo(function StatsCard({ title, value, color, tooltip }) {
  return (
    <Tooltip title={tooltip} arrow>
      <Box
        sx={{
          borderBottom: `2px solid ${color}`,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.2s',
          '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        <Typography variant="body2">{title}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      </Box>
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
  conDiferencias,
  setConDiferencias
}) {
  return (
    <Box mb={3}>
      <Grid container spacing={2} alignItems="center" wrap="nowrap">
        {/* PICKER DE FECHAS */}
        <Grid item>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateRangePicker
              calendars={1}
              value={[fechaDesde, fechaHasta]}
              onChange={(newValue) => {
                const [start, end] = newValue;
                setFechaDesde(start);
                setFechaHasta(end);
              }}
              renderInput={(startProps, endProps) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField size="small" {...startProps} />
                  <Box sx={{ mx: 1 }}>→</Box>
                  <TextField size="small" {...endProps} />
                </Box>
              )}
            />
          </LocalizationProvider>
        </Grid>

        {/* SELECT DE TIENDA */}
        <Grid item>
          <FormControl fullWidth size="small" sx={{ minWidth: '120px' }}>
            <InputLabel>Tienda</InputLabel>
            <Select
              label="Tienda"
              value={tiendaSeleccionada}
              onChange={(e) => setTiendaSeleccionada(e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
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

        {/* SELECT DE USUARIO */}
        <Grid item>
          <FormControl fullWidth size="small" sx={{ minWidth: '120px' }}>
            <InputLabel>Usuario</InputLabel>
            <Select
              label="Usuario"
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              disabled={!tiendaSeleccionada}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
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

        {/* SELECT DE MOTIVO */}
        <Grid item>
          <FormControl fullWidth size="small" sx={{ minWidth: '120px' }}>
            <InputLabel>Motivo</InputLabel>
            <Select
              label="Motivo"
              value={motivoSeleccionado}
              onChange={(e) => setMotivoSeleccionado(e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
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

        {/* CHECKBOX DE DIFERENCIAS */}
        <Grid item>
          <FormControlLabel
            control={
              <Checkbox
                checked={conDiferencias}
                onChange={(e) => setConDiferencias(e.target.checked)}
                color="primary"
              />
            }
            label="Con diferencias"
            sx={{ whiteSpace: 'nowrap' }}
          />
        </Grid>

        {/* TEXTFIELD DE BÚSQUEDA */}
        <Grid item>
          <TextField
            fullWidth
            size="small"
            label="Buscar..."
            variant="outlined"
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
        </Grid>

        {/* BOTÓN DE ACTUALIZAR */}
        <Grid item>
          <Button
            fullWidth
            variant="contained"
            onClick={fetchData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            sx={{ height: '40px', borderRadius: 1 }} 
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
});

////////////////////////////////////////////////////////////////////////
// COMPONENTE PRINCIPAL
////////////////////////////////////////////////////////////////////////

function ControlCajas() {
  const theme = useTheme();

  const [allCierres, setAllCierres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fechaDesde, setFechaDesde] = useState(moment().subtract(1, 'month'));
  const [fechaHasta, setFechaHasta] = useState(moment());

  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [mediosPagoColumns, setMediosPagoColumns] = useState([]);

  const [buscador, setBuscador] = useState('');
  const [conDiferencias, setConDiferencias] = useState(false);

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('fecha');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalDetalle, setModalDetalle] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchCierres = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        fechaDesde: fechaDesde.format('DD-MM-YYYY'),
        fechaHasta: fechaHasta.format('DD-MM-YYYY'),
      };
      if (tiendaSeleccionada) params.tienda = tiendaSeleccionada;
      if (usuarioSeleccionado) params.usuario = usuarioSeleccionado;

      const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`, { params });
      const cierresData = response.data.map((cierre) => {
        let mediosPago = [];
        try {
          const mp = typeof cierre.medios_pago === 'string'
            ? JSON.parse(cierre.medios_pago)
            : cierre.medios_pago || {};
          mediosPago = Array.isArray(mp) ? mp : Object.values(mp);
        } catch {
          mediosPago = [];
        }
        return {
          ...cierre,
          fecha: moment(cierre.fecha, 'DD-MM-YYYY').toDate(),
          medios_pago: mediosPago,
          justificaciones: cierre.justificaciones || []
        };
      });
      setAllCierres(cierresData);
      setError('');
    } catch {
      setError('Error al cargar los datos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, tiendaSeleccionada, usuarioSeleccionado]);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await axios.get(`${API_BASE_URL}/localStorage`);
        setMotivos(response.data.motivos_error_pago || []);
        setTiendas(response.data.tiendas || []);
        setMediosPagoColumns(response.data.medios_pago || []);
      } catch {
        // ignore
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    fetchCierres();
  }, [fetchCierres]);

  useEffect(() => {
    if (tiendaSeleccionada) {
      const usuariosFiltrados = [...new Set(
        allCierres
          .filter(item => item.tienda === tiendaSeleccionada)
          .map(item => item.usuario)
      )];
      setUsuarios(usuariosFiltrados);
      if (usuarioSeleccionado && !usuariosFiltrados.includes(usuarioSeleccionado)) {
        setUsuarioSeleccionado('');
      }
    } else {
      setUsuarios([...new Set(allCierres.map(item => item.usuario))]);
    }
  }, [tiendaSeleccionada, allCierres, usuarioSeleccionado]);

  const cierresFiltrados = useMemo(() => filtrarCierres({
    cierres: allCierres,
    fechaDesde,
    fechaHasta,
    tienda: tiendaSeleccionada,
    usuario: usuarioSeleccionado,
    motivo: motivoSeleccionado,
    buscador,
    conDiferencias
  }), [allCierres, fechaDesde, fechaHasta, tiendaSeleccionada, usuarioSeleccionado, motivoSeleccionado, buscador, conDiferencias]);

  const sortedCierres = useMemo(() => ordenarCierres({
    cierres: cierresFiltrados,
    order,
    orderBy
  }), [cierresFiltrados, order, orderBy]);

  const paginatedCierres = useMemo(() =>
    sortedCierres.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedCierres, page, rowsPerPage]
  );

  const estadisticas = useMemo(() => calcularEstadisticas(cierresFiltrados), [cierresFiltrados]);

  const columns = useMemo(() => {
    const baseColumns = [
      { id: 'fecha', label: 'Fecha', width: 100, sortable: true, format: v => moment(v).format('DD-MM-YYYY') },
      { id: 'tienda', label: 'Tienda', width: 80, sortable: true },
      { id: 'usuario', label: 'Usuario', width: 80, sortable: true }
    ];
    const mediosColumns = mediosPagoColumns.map(medio => ({
      id: `medio_${medio}`,
      label: medio,
      width: 80,
      align: 'right',
      format: (_, row) => {
        const md = (row.medios_pago || []).find(m => m.medio === medio);
        return md ? <ExactValue value={md.differenceVal} /> : '-';
      }
    }));
    const totalColumn = {
      id: 'gran_total',
      label: 'Gran Total',
      width: 80,
      align: 'right',
      format: (_, row) => {
        const tot = (row.medios_pago || []).reduce((sum, m) => sum + (m.differenceVal || 0), 0);
        return <ExactValue value={tot} />;
      }
    };
    const ajustesColumns = [
      {
        id: 'total_ajustado',
        label: 'Total Ajustado',
        width: 80,
        align: 'right',
        format: (_, row) => {
          const sum = row.justificaciones?.reduce((s, j) => s + (j.ajuste || 0), 0) || 0;
          return <ExactValue value={sum} />;
        }
      },
      {
        id: 'balance_sin_justificar',
        label: 'Balance sin Justificar',
        width: 80,
        align: 'right',
        format: v => <ExactValue value={v} />
      },
      {
        id: 'motivos',
        label: 'Motivos',
        width: 80,
        format: (_, row) => {
          const uniq = [...new Set(row.justificaciones?.map(j => j.motivo) || [])];
          return uniq.length > 0
            ? <Tooltip title={uniq.join(', ')} arrow><span>{uniq.length} motivo{uniq.length !== 1 ? 's' : ''}</span></Tooltip>
            : '-';
        }
      }
    ];
    const estadoColumn = {
      id: 'estado',
      label: 'Estado',
      width: 80,
      format: (_, row) => {
        const e = getEstado(row);
        return (
          <Box display="flex" alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', mr: 1, backgroundColor: e.color }} />
            <Typography variant="body2">{e.label}</Typography>
          </Box>
        );
      }
    };
    const actionsColumn = {
      id: 'acciones',
      label: 'Acciones',
      width: 100,
      format: (_, row) => (
        <Tooltip title="Ver detalles" arrow>
          <IconButton size="small" onClick={() => setModalDetalle(row)} color="primary">
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    };
    return [
      ...baseColumns,
      ...mediosColumns,
      totalColumn,
      ...ajustesColumns,
      estadoColumn,
      actionsColumn
    ];
  }, [mediosPagoColumns]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={3}>
      <HeaderControls
        fechaDesde={fechaDesde}
        setFechaDesde={setFechaDesde}
        fechaHasta={fechaHasta}
        setFechaHasta={setFechaHasta}
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
        conDiferencias={conDiferencias}
        setConDiferencias={setConDiferencias}
      />

      {error && (
        <Typography variant="body1" color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <Collapse in={!loading} timeout={600}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              title: 'Total Cierres',
              value: estadisticas.total,
              color: theme.palette.info.main,
              tooltip: 'Total de cierres en el período seleccionado'
            },
            {
              title: 'Correctos',
              value: estadisticas.correctos,
              color: ESTADOS_CIERRE.CORRECTO.color,
              tooltip: 'Cierres sin diferencias'
            },
            {
              title: 'Diferencias menores',
              value: estadisticas.advertencias,
              color: ESTADOS_CIERRE.DIFERENCIA_MENOR.color,
              tooltip: 'Diferencias en rango -$10.000 a $10.000 (excluye 0)'
            },
            {
              title: 'Diferencias graves',
              value: estadisticas.errores,
              color: ESTADOS_CIERRE.DIFERENCIA_GRAVE.color,
              tooltip: 'Diferencias > $10.000 o < -$10.000'
            }
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
            scrollBehavior: 'smooth'
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={styles.tableHeader}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{
                      color: 'text.primary',
                      width: column.width,
                      minWidth: column.width,
                      backgroundColor: 'background.paper',
                      fontWeight: 'bold',
                      transition: 'background-color 0.3s ease'
                    }}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <LoadingSkeleton columns={columns} />
              ) : cierresFiltrados.length > 0 ? (
                paginatedCierres.map((cierre) => {
                  const estado = getEstado(cierre);
                  return (
                    <TableRow
                      key={cierre.id}
                      hover
                      sx={{
                        ...styles.row,
                        borderLeft: `4px solid ${estado.color}`
                      }}
                    >
                      {columns.map((column) => {
                        const cellValue = cierre[column.id];
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align || 'left'}
                            sx={{ width: column.width, transition: 'all 0.3s ease' }}
                          >
                            {column.format
                              ? column.format(cellValue, cierre)
                              : cellValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Slide direction="up" in={cierresFiltrados.length > 0} mountOnEnter unmountOnExit>
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

      <Modal open={!!modalDetalle} onClose={() => setModalDetalle(null)}>
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
              borderRadius: 1,
              outline: 'none',
              maxHeight: '90vh',
              overflowY: 'auto',
              transition: 'transform 0.3s ease'
            }}
          >
            {modalDetalle && (
              <>
                <Typography variant="h5" gutterBottom>
                  Detalle completo del cierre – {moment(modalDetalle.fecha).format('DD/MM/YYYY')}
                </Typography>

                <Tabs
                  value={tabValue}
                  onChange={(_, newValue) => setTabValue(newValue)}
                  sx={{ mb: 3 }}
                >
                  <Tab label="Información" />
                  <Tab label="Medios de pago" />
                  {modalDetalle.justificaciones?.length > 0 && <Tab label="Justificaciones" />}
                </Tabs>

                {tabValue === 0 && (
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

                {tabValue === 1 && (
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
                        {modalDetalle.medios_pago.map((medio, i) => (
                          <TableRow key={i}>
                            <TableCell>{medio.medio}</TableCell>
                            <TableCell align="right"><ExactValue value={medio.facturado} /></TableCell>
                            <TableCell align="right"><ExactValue value={medio.cobrado} /></TableCell>
                            <TableCell align="right"><ExactValue value={medio.differenceVal} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}

                {tabValue === 2 && modalDetalle.justificaciones?.length > 0 && (
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
                            <TableCell>{j.motivo}</TableCell>
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
                  <Button variant="contained" onClick={() => setModalDetalle(null)}>
                    Cerrar
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default ControlCajas;
