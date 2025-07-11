import React, { useEffect, useState, useMemo } from 'react';
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
  Stack
} from '@mui/material';
import { Download as DownloadIcon, Assessment as AssessmentIcon, ClearAll as ClearAllIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import moment from 'moment';
import * as XLSX from 'xlsx';
import SearchIcon from '@mui/icons-material/Search';
import Pagination from '@mui/material/Pagination';

function Exportar() {
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tiendaFiltro, setTiendaFiltro] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [orden, setOrden] = useState('asc');
  const [ordenarPor, setOrdenarPor] = useState('fecha');
  const [search, setSearch] = useState('');
  const [diferenciaFiltro, setDiferenciaFiltro] = useState(''); // '', 'positiva', 'negativa'
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/cierres-completo`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        setCierres(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching cierres:', err);
        setError(err);
        setLoading(false);
      });
  }, []);

  const justificaciones = useMemo(() => {
    let flatJustificaciones = [];
    cierres.forEach(cierre => {
      if (cierre.justificaciones && cierre.justificaciones.length > 0) {
        cierre.justificaciones.forEach(just => {
          flatJustificaciones.push({
            id: just.id,
            tienda: cierre.tienda,
            fecha: cierre.fecha,
            monto: just.monto,
            comentario: just.comentario,
            usuario: just.usuario,
            diferencia: cierre.diferencia,
          });
        });
      }
    });
    return flatJustificaciones;
  }, [cierres]);

  const tiendasUnicas = useMemo(() => [...new Set(cierres.map(c => c.tienda).filter(Boolean))], [cierres]);
  const mesesUnicos = useMemo(() => {
    const meses = new Set();
    justificaciones.forEach(j => {
      if (moment(j.fecha).isValid()) {
        meses.add(moment(j.fecha).format('YYYY-MM'));
      }
    });
    return Array.from(meses).sort().reverse();
  }, [justificaciones]);

  const justificacionesFiltradas = useMemo(() => {
    let result = justificaciones
      .filter(j => !tiendaFiltro || j.tienda === tiendaFiltro)
      .filter(j => !mesFiltro || (moment(j.fecha, 'YYYY-MM-DD', true).isValid() && moment(j.fecha, 'YYYY-MM-DD', true).format('YYYY-MM') === mesFiltro));
    if (diferenciaFiltro === 'positiva') result = result.filter(j => Number(j.diferencia) > 0);
    if (diferenciaFiltro === 'negativa') result = result.filter(j => Number(j.diferencia) < 0);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(j =>
        (j.comentario && j.comentario.toLowerCase().includes(s)) ||
        (j.usuario && j.usuario.toLowerCase().includes(s)) ||
        (j.tienda && j.tienda.toLowerCase().includes(s))
      );
    }
    return result || [];
  }, [justificaciones, tiendaFiltro, mesFiltro, diferenciaFiltro, search]);

  const justificacionesOrdenadas = useMemo(() => {
    if (!Array.isArray(justificacionesFiltradas)) return [];
    return [...justificacionesFiltradas].sort((a, b) => {
      let valA = a[ordenarPor];
      let valB = b[ordenarPor];

      if (ordenarPor === 'fecha') {
        const dateA = moment(valA, 'YYYY-MM-DD', true);
        const dateB = moment(valB, 'YYYY-MM-DD', true);
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        return orden === 'asc' ? dateA.diff(dateB) : dateB.diff(dateA);
      }
      if (ordenarPor === 'monto' || ordenarPor === 'diferencia') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      if (valA < valB) return orden === 'asc' ? -1 : 1;
      if (valA > valB) return orden === 'asc' ? 1 : -1;
      return 0;
    });
  }, [justificacionesFiltradas, orden, ordenarPor]);

  const paginatedJustificaciones = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return Array.isArray(justificacionesOrdenadas) ? justificacionesOrdenadas.slice(start, start + rowsPerPage) : [];
  }, [justificacionesOrdenadas, page]);

  const handleSort = (property) => {
    const isAsc = ordenarPor === property && orden === 'asc';
    setOrden(isAsc ? 'desc' : 'asc');
    setOrdenarPor(property);
  };

  const resumen = useMemo(() => {
    return {
      totalJustificaciones: justificacionesFiltradas.length,
      montoTotal: justificacionesFiltradas.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)
    };
  }, [justificacionesFiltradas]);

  const handleExport = () => {
    const dataToExport = justificacionesOrdenadas.map(j => ({
      'Tienda': j.tienda,
      'Fecha': moment(j.fecha).isValid() ? moment(j.fecha).format('DD/MM/YYYY') : 'Fecha inválida',
      'Monto Justificado': j.monto,
      'Comentario': j.comentario,
      'Usuario': j.usuario,
      'Diferencia del Cierre': j.diferencia
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Justificaciones');
    XLSX.writeFile(workbook, 'Justificaciones.xlsx');
  };

  const handleClearFilters = () => {
    setTiendaFiltro('');
    setMesFiltro('');
    setDiferenciaFiltro('');
    setSearch('');
    setPage(1);
  };

  const headers = [
    { id: 'tienda', label: 'Tienda' },
    { id: 'fecha', label: 'Fecha' },
    { id: 'monto', label: 'Monto Justificado' },
    { id: 'comentario', label: 'Comentario' },
    { id: 'usuario', label: 'Usuario' },
    { id: 'diferencia', label: 'Diferencia del Cierre' },
  ];

  return (
    <Box
      p={3}
      sx={{
        bgcolor: '#121212',
        color: '#ffffff',
        minHeight: '100vh'
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <AssessmentIcon sx={{ color: '#ffffff', fontSize: 40 }} />
        <Typography variant="h4" gutterBottom sx={{ color: '#ffffff', mb: 0 }}>
          Reporte de Justificaciones
        </Typography>
      </Stack>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#1e1e1e', color: '#ffffff' }}>
            <CardContent>
              <Typography variant="h6">Total Justificaciones</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{resumen.totalJustificaciones}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: '#1e1e1e', color: '#ffffff' }}>
            <CardContent>
              <Typography variant="h6">Monto Total Justificado</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {`$${resumen.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          bgcolor: '#1e1e1e',
          color: '#ffffff'
        }}
      >
        <Grid container spacing={2} p={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id="tienda-filter-label" sx={{ color: '#ffffff' }}>Filtrar por Tienda</InputLabel>
              <Select
                labelId="tienda-filter-label"
                value={tiendaFiltro}
                label="Filtrar por Tienda"
                onChange={(e) => setTiendaFiltro(e.target.value)}
                sx={{ color: '#ffffff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' }, '.MuiSvgIcon-root': { color: '#ffffff' } }}
              >
                <MenuItem value=""><em>Todas</em></MenuItem>
                {tiendasUnicas.map(tienda => <MenuItem key={tienda} value={tienda}>{tienda}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel id="mes-filter-label" sx={{ color: '#ffffff' }}>Filtrar por Mes</InputLabel>
              <Select
                labelId="mes-filter-label"
                value={mesFiltro}
                label="Filtrar por Mes"
                onChange={(e) => setMesFiltro(e.target.value)}
                sx={{ color: '#ffffff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' }, '.MuiSvgIcon-root': { color: '#ffffff' } }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {mesesUnicos.map(mes => <MenuItem key={mes} value={mes}>{moment(mes).format('MMMM YYYY')}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5} md={3}>
            <FormControl fullWidth>
              <InputLabel id="diferencia-filter-label" sx={{ color: '#ffffff' }}>Diferencia</InputLabel>
              <Select
                labelId="diferencia-filter-label"
                value={diferenciaFiltro}
                label="Diferencia"
                onChange={(e) => setDiferenciaFiltro(e.target.value)}
                sx={{ color: '#ffffff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#888' }, '.MuiSvgIcon-root': { color: '#ffffff' } }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                <MenuItem value="positiva">Solo positivas</MenuItem>
                <MenuItem value="negativa">Solo negativas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#242424', borderRadius: 2, px: 2 }}>
              <SearchIcon sx={{ color: '#888', mr: 1 }} />
              <input
                type="text"
                placeholder="Buscar comentario, usuario o tienda..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  width: '100%',
                  fontSize: '1rem',
                  padding: '8px 0',
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<ClearAllIcon />}
              sx={{ color: '#9e9e9e', borderColor: '#9e9e9e', height: '100%' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end" p={2}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading || justificacionesOrdenadas.length === 0}
            sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
          >
            Exportar a Excel
          </Button>
        </Stack>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress color="inherit" />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            Error cargando datos: {error.message}
          </Box>
        ) : justificaciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            No se encontraron justificaciones.
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableCell
                        key={header.id}
                        sortDirection={ordenarPor === header.id ? orden : false}
                        sx={{ color: '#ffffff', backgroundColor: '#242424', borderBottom: '1px solid #333' }}
                      >
                        <TableSortLabel
                          active={ordenarPor === header.id}
                          direction={ordenarPor === header.id ? orden : 'asc'}
                          onClick={() => handleSort(header.id)}
                          sx={{
                            color: '#ffffff !important',
                            '& .MuiTableSortLabel-icon': {
                              color: '#ffffff !important',
                            },
                          }}
                        >
                          {header.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedJustificaciones.map((row, i) => (
                    <TableRow
                      key={row.id || i}
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: row.diferencia < 0 ? '#2a1e1e' : '#1e1e1e' },
                        '&:nth-of-type(even)': { backgroundColor: row.diferencia < 0 ? '#3a2323' : '#2a2a2a' },
                        boxShadow: row.diferencia < 0 ? 2 : 0,
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333' }}>{row.tienda}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333' }}>
                        {moment(row.fecha, 'YYYY-MM-DD', true).isValid() ? moment(row.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY') : 'Fecha inválida'}
                      </TableCell>
                      <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333' }}>{`$${Number(row.monto).toLocaleString('es-AR')}`}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333' }}>{row.comentario}</TableCell>
                      <TableCell sx={{ color: '#ffffff', borderBottom: '1px solid #333' }}>{row.usuario}</TableCell>
                      <TableCell sx={{ color: row.diferencia < 0 ? '#ff7961' : '#a5d6a7', borderBottom: '1px solid #333' }}>
                        {`$${Number(row.diferencia).toLocaleString('es-AR')}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination
                count={Math.ceil(justificacionesOrdenadas.length / rowsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                sx={{ '& .MuiPaginationItem-root': { color: '#fff' } }}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default Exportar;
