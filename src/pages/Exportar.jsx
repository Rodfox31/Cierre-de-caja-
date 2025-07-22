import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Autocomplete,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  GetApp as GetAppIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/es';
import { axiosWithFallback } from '../config';

// Configurar locale de moment
moment.locale('es');

const Exportar = () => {
  // Estados principales
  const [year, setYear] = useState(moment().year());
  const [month, setMonth] = useState(moment().month() + 1);
  const [tiendas, setTiendas] = useState([]);
  const [selectedTienda, setSelectedTienda] = useState('');
  const [cierres, setCierres] = useState([]);
  const [filteredCierres, setFilteredCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para filtros
  const [searchText, setSearchText] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [validacionFilter, setValidacionFilter] = useState('');
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Estados para UI
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [exportDialog, setExportDialog] = useState(false);

  // Datos crudos de la respuesta de la API (para debug)
  const [responseRaw, setResponseRaw] = useState(null);

  // Funciones utilitarias
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const processNumericValue = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    const cleanValue = value.toString().replace(/[^0-9.-]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
  };

  const getEstado = (diferencia) => {
    const diff = processNumericValue(diferencia);
    if (diff === 0) return { label: 'Cuadrado', color: 'success' };
    if (diff > 0) return { label: 'Sobrante', color: 'warning' };
    return { label: 'Faltante', color: 'error' };
  };

  // Cargar configuración desde localStorage
  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.tiendas && Array.isArray(config.tiendas)) {
          setTiendas(config.tiendas);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      showMessage('Error cargando configuración de tiendas');
    }
  };  // Función para obtener cierres
  const fetchCierres = async () => {
    setLoading(true);
    setError('');
    try {
      // Si quieres todos los datos, usa fechas amplias y no envíes tienda
      const fechaDesdeStr = '01/01/2000';
      const fechaHastaStr = moment().format('DD/MM/YYYY');
      const params = {
        fechaDesde: fechaDesdeStr,
        fechaHasta: fechaHastaStr
        // No enviar tienda
      };
      console.log('Solicitando cierres (toda la DB):', params);
      const response = await axiosWithFallback('/api/cierres-completo', { params });
      console.log('Respuesta cierres:', response);
      setResponseRaw(response.data);
      if (response && response.data) {
        const cierresData = Array.isArray(response.data) ? response.data : [];
        // Procesar datos igual que antes
        const processedCierres = cierresData.map(cierre => {
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
          } catch (parseErr) {
            console.error('Error parseando medios de pago:', parseErr);
            mediosPago = [];
          }
          const fechaFormateada = typeof cierre.fecha === 'string' 
            ? cierre.fecha 
            : moment(cierre.fecha).format('DD/MM/YYYY');
          return {
            ...cierre,
            fecha: fechaFormateada,
            medios_pago: mediosPago,
            justificaciones: cierre.justificaciones || [],
            ventas_efectivo: mediosPago.find(m => m.medio === 'Efectivo')?.facturado || 0,
            ventas_datafono: mediosPago.find(m => m.medio === 'Datáfono')?.facturado || 0,
            ventas_transferencias: mediosPago.find(m => m.medio === 'Transferencias')?.facturado || 0,
            total_ventas: mediosPago.reduce((sum, m) => sum + (processNumericValue(m.facturado) || 0), 0),
            deposito_banco: 0,
            gastos: 0,
            retiros: 0,
            diferencia: processNumericValue(cierre.grand_difference_total || 0),
            estado: getEstado(cierre.grand_difference_total || 0)
          };
        });
        setCierres(processedCierres);
        setFilteredCierres(processedCierres);
        setPage(0);
        showMessage(`Se cargaron ${processedCierres.length} registros`);
      }
    } catch (error) {
      console.error('Error fetching cierres:', error);
      setError('Error al cargar los datos de cierres');
      showMessage('Error al cargar los datos de cierres');
      setCierres([]);
      setFilteredCierres([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar mensajes
  const showMessage = (message) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };
  // Aplicar filtros
  useEffect(() => {
    let filtered = [...cierres];
    
    // Filtro por texto de búsqueda
    if (searchText) {
      filtered = filtered.filter(cierre =>
        (cierre.fecha && cierre.fecha.toLowerCase().includes(searchText.toLowerCase())) ||
        (cierre.tienda && cierre.tienda.toLowerCase().includes(searchText.toLowerCase())) ||
        (cierre.usuario && cierre.usuario.toLowerCase().includes(searchText.toLowerCase())) ||
        (cierre.responsable && cierre.responsable.toLowerCase().includes(searchText.toLowerCase())) ||
        (cierre.comentarios && cierre.comentarios.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // Filtro por estado
    if (estadoFilter) {
      filtered = filtered.filter(cierre => cierre.estado.label === estadoFilter);
    }
    
    // Filtro por validación
    if (validacionFilter) {
      filtered = filtered.filter(cierre => {
        if (validacionFilter === 'validado') return cierre.validado === 1 || cierre.validado === true;
        if (validacionFilter === 'no_validado') return cierre.validado === 0 || cierre.validado === false || !cierre.validado;
        return true;
      });
    }
    
    setFilteredCierres(filtered);
    setPage(0);
  }, [cierres, searchText, estadoFilter, validacionFilter]);
  // Función para exportar a CSV
  const exportToCSV = () => {
    if (filteredCierres.length === 0) {
      showMessage('No hay datos para exportar');
      return;
    }

    const headers = [
      'Fecha',
      'Tienda',
      'Usuario',
      'Ventas Efectivo',
      'Ventas Datáfono',
      'Ventas Transferencias',
      'Total Ventas',
      'Total Billetes',
      'Balance Final',
      'Brinks Total',
      'Diferencia Total',
      'Balance Sin Justificar',
      'Responsable',
      'Comentarios',
      'Estado',
      'Validado',
      'Usuario Validación',
      'Fecha Validación'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredCierres.map(cierre => [
        cierre.fecha || '',
        cierre.tienda || '',
        cierre.usuario || '',
        processNumericValue(cierre.ventas_efectivo),
        processNumericValue(cierre.ventas_datafono),
        processNumericValue(cierre.ventas_transferencias),
        processNumericValue(cierre.total_ventas),
        processNumericValue(cierre.total_billetes),
        processNumericValue(cierre.final_balance),
        processNumericValue(cierre.brinks_total),
        processNumericValue(cierre.grand_difference_total),
        processNumericValue(cierre.balance_sin_justificar),
        cierre.responsable || '',
        (cierre.comentarios || '').replace(/,/g, ';'),
        cierre.estado?.label || '',
        cierre.validado ? 'Sí' : 'No',
        cierre.usuario_validacion || '',
        cierre.fecha_validacion || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const tiendaName = tiendas.find(t => t.id === selectedTienda)?.nombre || selectedTienda;
    const fileName = `cierres_${tiendaName}_${year}_${month.toString().padStart(2, '0')}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage(`Archivo ${fileName} descargado exitosamente`);
    setExportDialog(false);
  };

  // Cargar configuración al montar el componente
  useEffect(() => {
    loadConfig();
  }, []);

  // Seleccionar tienda automáticamente si hay tiendas
  useEffect(() => {
    if (tiendas.length > 0 && !selectedTienda) {
      setSelectedTienda(tiendas[0].id);
    }
  }, [tiendas, selectedTienda]);

  // Datos paginados
  const paginatedCierres = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredCierres.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredCierres, page, rowsPerPage]);

  // Generar opciones de años
  const yearOptions = useMemo(() => {
    const currentYear = moment().year();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Generar opciones de meses
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: moment().month(i).format('MMMM').charAt(0).toUpperCase() + moment().month(i).format('MMMM').slice(1)
    }));
  }, []);

  // Mostrar siempre el total al cargar la página
  useEffect(() => {
    fetchCierres();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TableChartIcon color="primary" />
        Exportar Datos de Cierres
      </Typography>

      {/* Controles principales: Eliminar Tienda, Año, Mes */}
      {/* Filtros útiles */}
      {cierres.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon />
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar por fecha, tienda, usuario, responsable o comentarios..."
                  InputProps={{
                    endAdornment: searchText && (
                      <IconButton onClick={() => setSearchText('')} size="small">
                        <ClearIcon />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={estadoFilter}
                    onChange={(e) => setEstadoFilter(e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="Cuadrado">Cuadrado</MenuItem>
                    <MenuItem value="Sobrante">Sobrante</MenuItem>
                    <MenuItem value="Faltante">Faltante</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Validación</InputLabel>
                  <Select
                    value={validacionFilter}
                    onChange={(e) => setValidacionFilter(e.target.value)}
                    label="Validación"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="validado">Validado</MenuItem>
                    <MenuItem value="no_validado">No Validado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Mostrar loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Mostrar error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Tabla de resultados */}
      {filteredCierres.length > 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>              <TableHead>
                <TableRow>
                  <TableCell>FECHA</TableCell>
                  <TableCell>USUARIO</TableCell>
                  <TableCell>NÚMERO DE CLIENTE</TableCell>
                  <TableCell>N PEDIDO</TableCell>
                  <TableCell>MODO DE PAGO</TableCell>
                  <TableCell>MOTIVO</TableCell>
                  <TableCell>DIFERENCIA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCierres.map((cierre, index) => (
                  <TableRow key={`${cierre.id || index}-${cierre.fecha}`} hover>
                    <TableCell>{cierre.fecha || 'N/A'}</TableCell>
                    <TableCell>{cierre.usuario || 'N/A'}</TableCell>
                    <TableCell>{cierre.numero_cliente || cierre.cliente || 'N/A'}</TableCell>
                    <TableCell>{cierre.numero_pedido || cierre.n_pedido || 'N/A'}</TableCell>
                    <TableCell>{Array.isArray(cierre.medios_pago) ? cierre.medios_pago.map(mp => mp.medio).join(', ') : (cierre.modo_pago || 'N/A')}</TableCell>
                    <TableCell>{Array.isArray(cierre.justificaciones) && cierre.justificaciones.length > 0 ? cierre.justificaciones.map(j => j.motivo).join('; ') : 'Sin justificación'}</TableCell>
                    <TableCell>{typeof cierre.diferencia !== 'undefined' ? cierre.diferencia : (typeof cierre.grand_difference_total !== 'undefined' ? cierre.grand_difference_total : 'N/A')}</TableCell>
                  </TableRow>
                ))}
                {/* Fila de total de diferencia */}
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>TOTAL DIFERENCIA</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {(() => {
                      const total = filteredCierres.reduce((sum, cierre) => {
                        const val = typeof cierre.diferencia !== 'undefined' ? cierre.diferencia : cierre.grand_difference_total;
                        return sum + (parseFloat(val) || 0);
                      }, 0);
                      return total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredCierres.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}

      {/* Mensaje cuando no hay datos */}
      {!loading && filteredCierres.length === 0 && selectedTienda && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No se encontraron registros para los criterios seleccionados
          </Typography>
        </Paper>
      )}

      {/* Diálogo de confirmación de exportación */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 18, py: 1 }}>Confirmar Exportación</DialogTitle>
        <DialogContent sx={{ fontSize: 14, py: 1 }}>
          <Typography>
            ¿Exportar {filteredCierres.length} registros a CSV?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ py: 1 }}>
          <Button onClick={() => setExportDialog(false)} size="small">Cancelar</Button>
          <Button onClick={exportToCSV} variant="contained" startIcon={<FileDownloadIcon />} size="small">
            Exportar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Exportar;
