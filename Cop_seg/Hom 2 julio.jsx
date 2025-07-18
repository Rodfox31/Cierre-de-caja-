import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../src/config';
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Fade,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from '@mui/material';
import {
  Storefront,
  WarningAmber,
  CheckCircleOutline,
  EmojiEvents,
  TrendingDown,
  Timeline,
  FilterList,
  InfoOutlined,
} from '@mui/icons-material';

// --- COMPONENTES DE UI (Sin cambios) ---

const StatCard = ({ title, value, icon, subtitle }) => {
  const theme = useTheme();
  return (
    <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: `${theme.palette.primary.main}20`, color: 'primary.main', mr: 2 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

const PrecisionPodium = ({ users }) => {
  const theme = useTheme();
  const podiumColors = {
    0: theme.palette.warning.main,
    1: '#C0C0C0',
    2: '#CD7F32',
  };
  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        🏆 Podio de Precisión
      </Typography>
      <List dense>
        {users.slice(0, 3).map((user, index) => (
          <ListItem key={user.usuario} sx={{ py: 1 }}>
            <ListItemIcon>
              <EmojiEvents style={{ color: podiumColors[index] }} />
            </ListItemIcon>
            <ListItemText
              primary={user.usuario}
              secondary={`Promedio Diferencia: $${user.promedioDiferencia.toFixed(2)}`}
            />
            <Chip label={`#${index + 1}`} size="small" sx={{ backgroundColor: podiumColors[index], color: 'white' }} />
          </ListItem>
        ))}
      </List>
    </Card>
  );
};

const CriticalAnomalies = ({ anomalies }) => (
  <Card sx={{ p: 3, backgroundColor: 'error.lightest', height: '100%' }}>
    <Typography variant="h6" gutterBottom fontWeight="bold" color="error.dark">
      <WarningAmber sx={{ verticalAlign: 'middle', mr: 1 }} />
      Anomalías Críticas
    </Typography>
    {anomalies.length > 0 ? (
      <List dense>
        {anomalies.map((cierre) => (
          <ListItem key={cierre.id}>
            <ListItemText
              primary={`Diferencia de $${parseFloat(cierre.grand_difference_total).toFixed(2)}`}
              secondary={`En ${cierre.tienda} por ${cierre.usuario} el ${parseFecha(cierre.fecha).toLocaleDateString(
                'es-CL'
              )}`}
            />
          </ListItem>
        ))}
      </List>
    ) : (
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <CheckCircleOutline sx={{ color: 'success.main', mr: 1 }} />
        <Typography color="text.secondary">¡Sin anomalías importantes!</Typography>
      </Box>
    )}
  </Card>
);

const RecentClosures = ({ closures }) => (
  <Card sx={{ p: 3, height: '100%' }}>
    <Typography variant="h6" gutterBottom fontWeight="bold">
      <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
      Actividad Reciente
    </Typography>
    <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
      {closures.slice(0, 10).map((cierre) => {
        const isNegative = cierre.grand_difference_total < 0;
        const difference = Math.abs(parseFloat(cierre.grand_difference_total) || 0);
        const parsed = parseFecha(cierre.fecha);
        const isInvalid = isNaN(parsed.getTime());
        return (
          <ListItem key={cierre.id} sx={{ my: 1 }}>
            <ListItemText
              primary={`${cierre.tienda} - ${cierre.usuario}`}
              secondary={
                isInvalid
                  ? `Cierre del Invalid date (${cierre.fecha})`
                  : `Cierre del ${parsed.toLocaleDateString('es-CL')}`
              }
            />
            <Chip
              label={`${isNegative ? '-' : ''}$${difference.toFixed(2)}`}
              color={difference > 0 ? (isNegative ? 'error' : 'warning') : 'success'}
              size="small"
              variant="outlined"
            />
          </ListItem>
        );
      })}
    </List>
  </Card>
);

// --- COMPONENTE PRINCIPAL ---

const HomePage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [allClosures, setAllClosures] = useState([]);
  const [stats, setStats] = useState({ totalDiferencias: 0, totalTiendas: 0, promedioDiferencias: 0 });
  const [podiumUsers, setPodiumUsers] = useState([]);
  const [criticalAnomalies, setCriticalAnomalies] = useState([]);
  const [recentClosures, setRecentClosures] = useState([]);

  // Estados para los filtros
  const [availableStores, setAvailableStores] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  // Función de fetch con filtros como params
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;
      if (selectedStores.length > 0) params.stores = selectedStores.join(',');
      const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`, { params });
      const data = response.data.map(cierre => ({
        ...cierre,
        fecha: cierre.fecha,
      }));
      setAllClosures(data);

      // Si es la primera vez, llenamos availableStores/Years
      if (availableStores.length === 0) {
        const stores = [...new Set(data.map(c => c.tienda))].sort();
        const years = [...new Set(data.map(c => parseFecha(c.fecha).getFullYear()))]
          .sort((a, b) => b - a);
        setAvailableStores(stores);
        setAvailableYears(years);
        setSelectedStores(stores);
        if (years.length > 0) {
          setSelectedYear(years[0]);
          const mostRecent = parseFecha(data[0].fecha);
          setSelectedMonth(mostRecent.getMonth() + 1);
        }
      }

      procesarDatos(data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cada vez que cambian los filtros, volvemos a llamar a la API
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStores, selectedYear, selectedMonth]);

  // Lógica de procesamiento
  const procesarDatos = (data) => {
    const totalCierres = data.length;
    if (totalCierres === 0) {
      setStats({ totalDiferencias: 0, totalTiendas: 0, promedioDiferencias: 0 });
      setPodiumUsers([]);
      setCriticalAnomalies([]);
      setRecentClosures([]);
      return;
    }

    const totalDiferencias = data.reduce(
      (acc, c) => acc + Math.abs(parseFloat(c.grand_difference_total) || 0), 0
    );
    const totalTiendas = new Set(data.map(c => c.tienda)).size;
    const promedioDiferencias = totalDiferencias / totalCierres;
    setStats({ totalDiferencias, totalTiendas, promedioDiferencias });

    const ANOMALY_THRESHOLD = 500;
    setCriticalAnomalies(
      data.filter(c => Math.abs(parseFloat(c.grand_difference_total) || 0) > ANOMALY_THRESHOLD)
    );

    const userStats = data.reduce((acc, c) => {
      if (!c.usuario) return acc;
      if (!acc[c.usuario]) acc[c.usuario] = { totalDiferencia: 0, count: 0 };
      acc[c.usuario].totalDiferencia += Math.abs(parseFloat(c.grand_difference_total) || 0);
      acc[c.usuario].count++;
      return acc;
    }, {});
    const usersForPodium = Object.entries(userStats)
      .map(([usuario, d]) => ({
        usuario,
        promedioDiferencia: d.totalDiferencia / d.count,
      }))
      .sort((a, b) => a.promedioDiferencia - b.promedioDiferencia);
    setPodiumUsers(usersForPodium);

    setRecentClosures(data);
  };

  // DEBUG: Mostrar datos crudos y procesados
  useEffect(() => {
    console.log('API cierres-completo (allClosures):', allClosures);
    console.log('Panel: StatCard', stats);
    console.log('Panel: CriticalAnomalies', criticalAnomalies);
    console.log('Panel: RecentClosures', recentClosures);
    console.log('Panel: PrecisionPodium', podiumUsers);
  }, [allClosures, stats, criticalAnomalies, recentClosures, podiumUsers]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Fade in={!loading} timeout={800}>
      <Box sx={{ p: 4, backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
        {/* Cabecera */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" fontWeight="bold">Centro de Mando de Cierres</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Análisis de rendimiento y estado operativo en tiempo real.
          </Typography>
        </Box>

        {/* Barra de filtros */}
        <Paper sx={{ p:1.5, mb:3, display:'flex', gap:2, alignItems:'center', flexWrap:'wrap', background: theme.palette.background.paper, borderRadius:2, boxShadow:1 }}>
          <FilterList color="action" fontSize="small" />
          <Typography variant="subtitle1" sx={{ mr:1, fontSize:'0.95rem', fontWeight:500 }}>
            Filtros
          </Typography>
          <Box sx={{ mr:2 }}>
            <button
              style={{
                background: theme.palette.primary.main,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 18px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(33,150,243,0.10)'
              }}
              onClick={fetchData}
              title="Actualizar datos"
            >
              Actualizar
            </button>
          </Box>

          {/* Año */}
          <FormControl size="small" sx={{ minWidth:120 }}>
            <InputLabel sx={{ fontSize:'0.85rem' }}>Año</InputLabel>
            <Select
              value={selectedYear}
              label="Año"
              onChange={e => setSelectedYear(Number(e.target.value))}
              MenuProps={{ PaperProps:{ sx:{ maxHeight:200 } } }}
              sx={{ fontSize:'0.95rem', height:36 }}
            >
              {availableYears.map(y => (
                <MenuItem key={y} value={y} sx={{ fontSize:'0.95rem' }}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Mes */}
          <FormControl size="small" sx={{ minWidth:150 }}>
            <InputLabel sx={{ fontSize:'0.85rem' }}>Mes</InputLabel>
            <Select
              value={selectedMonth || ''}
              label="Mes"
              onChange={e => setSelectedMonth(e.target.value === '' ? '' : Number(e.target.value))}
              displayEmpty
              MenuProps={{ PaperProps:{ sx:{ maxHeight:200 } } }}
              sx={{ fontSize:'0.95rem', height:36 }}
              renderValue={sel =>
                sel
                  ? meses[sel - 1]
                  : <span style={{ color:'#aaa', fontSize:'0.95rem' }}>Todos</span>
              }
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {meses.map((mes, i) => (
                <MenuItem key={mes} value={i+1} sx={{ fontSize:'0.95rem' }}>
                  {mes}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tiendas */}
          <FormControl size="small" sx={{ minWidth:200, maxWidth:300 }}>
            <InputLabel sx={{ fontSize:'0.85rem' }}>Tiendas</InputLabel>
            <Select
              multiple
              value={selectedStores}
              onChange={e => setSelectedStores(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Tiendas" sx={{ fontSize:'0.95rem', height:36 }} />}
              renderValue={selected => (
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.5 }}>
                  {selected.map(val => (
                    <Chip key={val} label={val} size="small" sx={{ fontSize:'0.85rem', height:22 }} />
                  ))}
                </Box>
              )}
              MenuProps={{ PaperProps:{ sx:{ maxHeight:200 } } }}
              sx={{ fontSize:'0.95rem', height:36 }}
            >
              {availableStores.map(store => (
                <MenuItem key={store} value={store} sx={{ fontSize:'0.95rem' }}>
                  {store}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Contenido */}
        {allClosures.length > 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    title="Diferencia Total (Filtrada)"
                    value={`$${stats.totalDiferencias.toFixed(2)}`}
                    icon={<WarningAmber />}
                    subtitle="Suma de diferencias en el período."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    title="Tiendas (Filtradas)"
                    value={stats.totalTiendas}
                    icon={<Storefront />}
                    subtitle="Tiendas con cierres en el período."
                  />
                </Grid>
                <Grid item xs={12}>
                  <CriticalAnomalies anomalies={criticalAnomalies} />
                </Grid>
                <Grid item xs={12}>
                  <RecentClosures closures={recentClosures} />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <StatCard
                    title="Diferencia Promedio (Filtrada)"
                    value={`$${stats.promedioDiferencias.toFixed(2)}`}
                    icon={<TrendingDown />}
                    subtitle="Promedio por cierre en el período."
                  />
                </Grid>
                <Grid item xs={12}>
                  <PrecisionPodium users={podiumUsers} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign:'center', p:5, backgroundColor:'background.paper', borderRadius:2 }}>
            <InfoOutlined sx={{ fontSize:60, color:'text.secondary' }} />
            <Typography variant="h6" sx={{ mt:2 }}>No se encontraron datos</Typography>
            <Typography color="text.secondary">
              Prueba a cambiar los filtros o selecciona un período de tiempo diferente.
            </Typography>
          </Box>
        )}
      </Box>
    </Fade>
  );
};

// --- HELPER PARA PARSEAR FECHAS ---

function parseFecha(fechaStr) {
  if (!fechaStr) return new Date('');
  if (fechaStr instanceof Date) return fechaStr;
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr.trim())) {
    const [day, month, year] = fechaStr.trim().split('/');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  let str = fechaStr.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(str + 'T00:00:00');
  }
  // Otros ISO
  return new Date(str);
}

export default HomePage;
