import React, { useEffect, useState } from 'react';
import { axiosWithFallback } from '../config';
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
  LinearProgress,
  Divider,
  Badge,
  Stack,
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
  TrendingUp,
  Assessment,
  PieChart,
  BarChart,
  Person,
  Today,
  AttachMoney,
  Error,
} from '@mui/icons-material';

// --- COMPONENTES DE DASHBOARD ---

const MetricCard = ({ title, value, icon, trend, color = '#ffffff' }) => {
  return (
    <Card sx={{ 
      p: 2, 
      height: '100%',
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar sx={{ 
          bgcolor: 'transparent',
          color: color,
          mr: 2,
          width: 40,
          height: 40
        }}>
          {icon}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#ffffff' }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            {title}
          </Typography>
        </Box>
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ color: '#888888' }}>
            {trend}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

const ProgressCard = ({ title, current, total, color = '#4caf50' }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <Card sx={{ 
      p: 2, 
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', mr: 1 }}>
          {current}
        </Typography>
        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
          de {total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#333',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
      />
      <Typography variant="caption" sx={{ color: '#888888', mt: 1 }}>
        {percentage.toFixed(1)}%
      </Typography>
    </Card>
  );
};

const StatusOverview = ({ stats }) => {
  const data = [
    { label: 'Correctos', value: stats.totalCorrectos, color: '#4caf50' },
    { label: 'Diferencias Menores', value: stats.totalAdvertencias, color: '#ff9800' },
    { label: 'Diferencias Graves', value: stats.totalGraves, color: '#f44336' },
  ];

  return (
    <Card sx={{ 
      p: 3, 
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
        Estado de Cierres
      </Typography>
      <Stack spacing={2}>
        {data.map((item) => (
          <Box key={item.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.totalCierres > 0 ? (item.value / stats.totalCierres) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#333',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: item.color,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Card>
  );
};

const TopPerformers = ({ users }) => {
  return (
    <Card sx={{ 
      p: 3, 
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
        Mejores Empleados
      </Typography>
      <List dense>
        {users.slice(0, 5).map((user, index) => (
          <ListItem key={user.usuario} sx={{ px: 0 }}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Badge 
                badgeContent={index + 1} 
                color="primary"
                sx={{ 
                  '& .MuiBadge-badge': { 
                    backgroundColor: index === 0 ? '#4caf50' : '#666',
                    color: '#ffffff'
                  }
                }}
              >
                <Person sx={{ color: '#b0b0b0' }} />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ color: '#ffffff' }}>
                  {user.usuario}
                </Typography>
              }
              secondary={
                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                  Promedio: ${user.promedioDiferencia.toFixed(2)}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Card>
  );
};

const RecentActivity = ({ closures }) => {
  const sorted = [...closures].sort((a, b) => b.fechaObj - a.fechaObj);
  
  return (
    <Card sx={{ 
      p: 3, 
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
        Actividad Reciente
      </Typography>
      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
        {sorted.slice(0, 8).map((cierre) => {
          const difference = parseFloat(cierre.grand_difference_total) || 0;
          const isInvalid = isNaN(cierre.fechaObj.getTime());
          
          return (
            <ListItem key={cierre.id} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {difference === 0 ? (
                  <CheckCircleOutline sx={{ color: '#4caf50', fontSize: 20 }} />
                ) : (
                  <Error sx={{ color: '#f44336', fontSize: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                    {cierre.tienda} - {cierre.usuario}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    {isInvalid
                      ? `Cierre del Invalid date (${cierre.fecha})`
                      : `${cierre.fechaObj.toLocaleDateString('es-CL')} - $${Math.abs(difference).toFixed(2)}`
                    }
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Card>
  );
};

const CriticalAlerts = ({ anomalies }) => {
  return (
    <Card sx={{ 
      p: 3, 
      backgroundColor: '#1e1e1e',
      border: '1px solid #333',
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
        Alertas Críticas
      </Typography>
      {anomalies.length > 0 ? (
        <List dense>
          {anomalies.slice(0, 5).map((cierre) => (
            <ListItem key={cierre.id} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <WarningAmber sx={{ color: '#f44336', fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: '#ffffff' }}>
                    ${parseFloat(cierre.grand_difference_total).toFixed(2)}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    {cierre.tienda} - {cierre.usuario}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutline sx={{ color: '#4caf50', fontSize: 40, mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            Sin alertas críticas
          </Typography>
        </Box>
      )}
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
      const response = await axiosWithFallback('/api/cierres-completo');
      const data = response.data;
      const mappedData = data.map(mapCierre);
      setAllClosures(mappedData);
      procesarDatos(mappedData);
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
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: '#121212' }}
      >
        <CircularProgress size={40} sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#121212', 
      color: '#ffffff',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#ffffff', mb: 0.5 }}>
          Dashboard de Cierres
        </Typography>
        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
          Resumen general del sistema de cierres de caja
        </Typography>
      </Box>

      {/* Contenido */}
      {allClosures.length > 0 ? (
        <Grid container spacing={3}>
          {/* Métricas principales */}
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total de Cierres"
              value={stats.totalCierres}
              icon={<Assessment />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Tiendas Activas"
              value={stats.totalTiendas}
              icon={<Storefront />}
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Diferencia Total"
              value={`$${stats.totalDiferencias.toFixed(0)}`}
              icon={<AttachMoney />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Promedio por Cierre"
              value={`$${stats.promedioDiferencias.toFixed(0)}`}
              icon={<TrendingUp />}
              color="#9c27b0"
            />
          </Grid>

          {/* Progreso y estado */}
          <Grid item xs={12} md={8}>
            <StatusOverview stats={stats} />
          </Grid>
          <Grid item xs={12} md={4}>
            <ProgressCard
              title="Cierres Correctos"
              current={stats.totalCorrectos}
              total={stats.totalCierres}
              color="#4caf50"
            />
          </Grid>

          {/* Actividad y rendimiento */}
          <Grid item xs={12} md={6}>
            <RecentActivity closures={recentClosures} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TopPerformers users={podiumUsers} />
          </Grid>

          {/* Alertas críticas */}
          <Grid item xs={12}>
            <CriticalAlerts anomalies={criticalAnomalies} />
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 8,
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: 1,
        }}>
          <InfoOutlined sx={{ fontSize: 60, color: '#666', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#ffffff', mb: 1 }}>
            No hay datos disponibles
          </Typography>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            No se encontraron cierres en la base de datos
          </Typography>
        </Box>
      )}
    </Box>
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
