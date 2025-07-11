import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
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
              secondary={`En ${cierre.tienda} por ${cierre.usuario} el ${
                cierre.fechaObj && !isNaN(cierre.fechaObj.getTime())
                  ? cierre.fechaObj.toLocaleDateString('es-CL')
                  : `Invalid date (${cierre.fecha})`
              }`}
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

const RecentClosures = ({ closures }) => {
  const sorted = [...closures].sort((a, b) => b.fechaObj - a.fechaObj);
  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
        Actividad Reciente
      </Typography>
      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
        {sorted.slice(0, 10).map((cierre) => {
          const isNegative = cierre.grand_difference_total < 0;
          const difference = Math.abs(parseFloat(cierre.grand_difference_total) || 0);
          const parsed = cierre.fechaObj;
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
};

// --- COMPONENTE PRINCIPAL ---

function parseMediosPago(medios_pago) {
  try {
    if (typeof medios_pago === 'string') {
      const mp = JSON.parse(medios_pago);
      return Array.isArray(mp)
        ? mp
        : Object.keys(mp).map((key) => ({
            medio: key,
            facturado: mp[key].facturado,
            cobrado: mp[key].cobrado,
            differenceVal: mp[key].differenceVal,
          }));
    }
    if (Array.isArray(medios_pago)) return medios_pago;
    if (typeof medios_pago === 'object' && medios_pago !== null) {
      return Object.keys(medios_pago).map((key) => ({
        medio: key,
        facturado: medios_pago[key].facturado,
        cobrado: medios_pago[key].cobrado,
        differenceVal: medios_pago[key].differenceVal,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

function mapCierre(cierre) {
  return {
    ...cierre,
    fecha: cierre.fecha,
    fechaObj: parseFecha(cierre.fecha), // Siempre un Date
    medios_pago: parseMediosPago(cierre.medios_pago),
    justificaciones: cierre.justificaciones || [],
  };
}

const HomePage = ({ allClosures, setAllClosures }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDiferencias: 0,
    totalTiendas: 0,
    promedioDiferencias: 0,
    totalCierres: 0,
    totalCorrectos: 0,
    totalAdvertencias: 0,
    totalGraves: 0,
  });
  const [podiumUsers, setPodiumUsers] = useState([]);
  const [criticalAnomalies, setCriticalAnomalies] = useState([]);
  const [recentClosures, setRecentClosures] = useState([]);

  // Limpiar datos al cargar para evitar mostrar datos viejos
  useEffect(() => {
    setStats({
      totalDiferencias: 0,
      totalTiendas: 0,
      promedioDiferencias: 0,
      totalCierres: 0,
      totalCorrectos: 0,
      totalAdvertencias: 0,
      totalGraves: 0,
    });
    setPodiumUsers([]);
    setCriticalAnomalies([]);
    setRecentClosures([]);
  }, []);

  // Fetch sin filtros, siempre toda la base
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`);
      const data = response.data.map(mapCierre);
      setAllClosures(data);
      procesarDatos(data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setStats({
        totalDiferencias: 0,
        totalTiendas: 0,
        promedioDiferencias: 0,
        totalCierres: 0,
        totalCorrectos: 0,
        totalAdvertencias: 0,
        totalGraves: 0,
      });
      setPodiumUsers([]);
      setCriticalAnomalies([]);
      setRecentClosures([]);
      setAllClosures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lógica de procesamiento
  const procesarDatos = (data) => {
    const totalCierres = data.length;
    if (totalCierres === 0) {
      setStats({
        totalDiferencias: 0,
        totalTiendas: 0,
        promedioDiferencias: 0,
        totalCierres: 0,
        totalCorrectos: 0,
        totalAdvertencias: 0,
        totalGraves: 0,
      });
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

    // Nuevas métricas: correctos, advertencias, graves
    let totalCorrectos = 0, totalAdvertencias = 0, totalGraves = 0;
    data.forEach(c => {
      const diffVal = Number(c.grand_difference_total) || 0;
      if (diffVal === 0) totalCorrectos++;
      else if (diffVal > 10000 || diffVal < -10000) totalGraves++;
      else totalAdvertencias++;
    });

    setStats({
      totalDiferencias,
      totalTiendas,
      promedioDiferencias,
      totalCierres,
      totalCorrectos,
      totalAdvertencias,
      totalGraves,
    });

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

    // Ordenar por fecha descendente para Actividad Reciente usando fechaObj
    const recentSorted = [...data].sort((a, b) => b.fechaObj - a.fechaObj);
    setRecentClosures(recentSorted);
  };

  // DEBUG: Mostrar datos crudos y procesados
  useEffect(() => {
    // console.log('API cierres-completo (allClosures):', allClosures);
    // console.log('Panel: StatCard', stats);
    // console.log('Panel: CriticalAnomalies', criticalAnomalies);
    // console.log('Panel: RecentClosures', recentClosures);
    // console.log('Panel: PrecisionPodium', podiumUsers);
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

        {/* Contenido */}
        {allClosures.length > 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    title="Diferencia Total"
                    value={`$${stats.totalDiferencias.toFixed(2)}`}
                    icon={<WarningAmber />}
                    subtitle="Suma de diferencias en la base."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard
                    title="Tiendas"
                    value={stats.totalTiendas}
                    icon={<Storefront />}
                    subtitle="Tiendas con cierres en la base."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    title="Cierres Correctos"
                    value={stats.totalCorrectos}
                    icon={<CheckCircleOutline />}
                    subtitle="Cierres sin diferencias."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    title="Diferencias Menores"
                    value={stats.totalAdvertencias}
                    icon={<WarningAmber color='warning' />}
                    subtitle="Diferencias entre -10.000 y 10.000."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StatCard
                    title="Diferencias Graves"
                    value={stats.totalGraves}
                    icon={<WarningAmber color='error' />}
                    subtitle="Diferencias >10.000 o <-10.000."
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
                    title="Diferencia Promedio"
                    value={`$${stats.promedioDiferencias.toFixed(2)}`}
                    icon={<TrendingDown />}
                    subtitle="Promedio por cierre en la base."
                  />
                </Grid>
                <Grid item xs={12}>
                  <StatCard
                    title="Total de Cierres"
                    value={stats.totalCierres}
                    icon={<Timeline />}
                    subtitle="Cantidad total de cierres."
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
              No hay datos disponibles en la base.
            </Typography>
          </Box>
        )}
      </Box>
    </Fade>
  );
};

// --- EXPORTACIÓN DEL COMPONENTE PRINCIPAL SIN DATOS CRUDOS ---

export default function HomePageWithRaw() {
  const [allClosures, setAllClosures] = useState([]);
  return (
    <HomePage allClosures={allClosures} setAllClosures={setAllClosures} />
  );
}

// --- HELPER PARA PARSEAR FECHAS ---

function parseFecha(fechaStr) {
  if (!fechaStr) return new Date('');
  if (fechaStr instanceof Date) return fechaStr;
  const str = fechaStr.trim();
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [day, month, year] = str.split('/');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [day, month, year] = str.split('-');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(str + 'T00:00:00');
  }
  // Otros ISO
  return new Date(str);
}
