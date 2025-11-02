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
import { formatCurrency } from '../utils/numberFormat';
import {
  Storefront,
  WarningAmber,
  CheckCircleOutline,
  InfoOutlined,
  TrendingUp,
  Assessment,
  Person,
  AttachMoney,
  Error,
} from '@mui/icons-material';

// --- COMPONENTES DE DASHBOARD ---

const MetricCard = ({ title, value, icon, trend, color = '#ffffff' }) => {
  return (
    <Card sx={{ 
      p: 2, 
      height: '100%',
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
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
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            sx={(theme) => ({ 
              color: theme.palette.text.primary, 
              fontFamily: theme.typography.fontFamily,
              fontSize: `calc(${theme.typography.h4.fontSize} + 0.25rem)` // h4 +2px aprox
            })}
          >
            {value}
          </Typography>
          <Typography 
            variant="body2" 
            sx={(theme) => ({ 
              color: theme.palette.text.secondary, 
              fontFamily: theme.typography.fontFamily,
              fontSize: `calc(${theme.typography.body2.fontSize} + 0.05rem)` // body2 +1px aprox
            })}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.disabled }}>
            {trend}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

const ProgressCard = ({ title, current, total, color = '#4caf50', compact }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <Card sx={{ 
      p: compact ? 3 : 2,
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 1,
      height: compact ? 240 : '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <Typography 
        variant="h6" 
        sx={(theme) => ({ 
          color: theme.palette.text.primary, 
          mb: 1, 
          fontFamily: theme.typography.fontFamily,
          fontSize: `calc(${theme.typography.h6.fontSize} + 0.1rem)` // h6 +1.5px aprox
        })}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography 
          variant="h4" 
          sx={(theme) => ({ 
            color: theme.palette.text.primary, 
            mr: 1, 
            fontFamily: theme.typography.fontFamily,
            fontSize: `calc(${theme.typography.h4.fontSize} + 0.15rem)` // h4 +1.5px aprox
          })}
        >
          {current}
        </Typography>
        <Typography 
          variant="body2" 
          sx={(theme) => ({ 
            color: theme.palette.text.secondary, 
            fontFamily: theme.typography.fontFamily,
            fontSize: `calc(${theme.typography.body2.fontSize} + 0.05rem)` // body2 +1px aprox
          })}
        >
          de {total}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: (theme) => theme.palette.custom?.tableBorder || '#333',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
      />
      <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.disabled, mt: 1 }}>
        {percentage.toFixed(1)}%
      </Typography>
    </Card>
  );
};

// (Eliminado ValidationSummaryCard: no se usa)

const StatusOverview = ({ stats, compact }) => {
  const data = [
    { label: 'Correctos', value: stats.totalCorrectos },
    { label: 'Diferencias Menores', value: stats.totalAdvertencias },
    { label: 'Diferencias Graves', value: stats.totalGraves },
  ];

  return (
    <Card sx={{ 
      p: 3, 
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 2 }}>
        Estado de Cierres
      </Typography>
      <Stack spacing={2}>
        {data.map((item) => (
          <Box key={item.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats.totalCierres > 0 ? (item.value / stats.totalCierres) * 100 : 0}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: (theme) => theme.palette.custom?.tableBorder || '#333',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: (theme) => (
                    item.label === 'Correctos'
                      ? theme.palette.success.main
                      : item.label === 'Diferencias Menores'
                      ? theme.palette.warning.main
                      : theme.palette.error.main
                  ),
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
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 2 }}>
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
                    backgroundColor: (theme) => index === 0 ? theme.palette.success.main : theme.palette.text.disabled,
                    color: (theme) => theme.palette.common.white,
                  }
                }}
              >
                <Person sx={{ color: (theme) => theme.palette.text.secondary }} />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
                  {user.usuario}
                </Typography>
              }
              secondary={
                <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
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
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 2 }}>
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
                  <CheckCircleOutline sx={{ color: (theme) => theme.palette.success.main, fontSize: 20 }} />
                ) : (
                  <Error sx={{ color: (theme) => theme.palette.error.main, fontSize: 20 }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
                    {cierre.tienda} - {cierre.usuario}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
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
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 1,
    }}>
      <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 2 }}>
        Alertas Críticas
      </Typography>
      {anomalies.length > 0 ? (
        <List dense>
          {anomalies.slice(0, 5).map((cierre) => (
            <ListItem key={cierre.id} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <WarningAmber sx={{ color: (theme) => theme.palette.error.main, fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
                    ${parseFloat(cierre.grand_difference_total).toFixed(2)}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
                    {cierre.tienda} - {cierre.usuario}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckCircleOutline sx={{ color: (theme) => theme.palette.success.main, fontSize: 40, mb: 1 }} />
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
            Sin alertas críticas
          </Typography>
        </Box>
      )}
    </Card>
  );
};

// --- COMPONENTE DE TARJETA POR TIENDA ---
const StoreDashboardCard = ({ tienda, stats, compact }) => {
  const total = stats.cierres.length;
  const validados = stats.cierres.filter(c => c.validado === 1).length;
  const porcentajeValidados = total > 0 ? (validados / total) * 100 : 0;
  
  // Métricas de diferencias
  const correctos = stats.cierres.filter(c => Number(c.grand_difference_total) === 0).length;
  const advertencias = stats.cierres.filter(c => {
    const d = Number(c.grand_difference_total) || 0;
    return d !== 0 && Math.abs(d) <= 10000;
  }).length;
  const graves = stats.cierres.filter(c => Math.abs(Number(c.grand_difference_total) || 0) > 10000).length;
  
  // Estado de validación
  let statusColor = 'default', statusLabel = 'Sin validar';
  if (porcentajeValidados === 100) {
    statusColor = 'success'; 
    statusLabel = 'Completo';
  } else if (porcentajeValidados > 0) {
    statusColor = 'warning'; 
    statusLabel = 'Pendiente';
  }
  
  return (
    <Card sx={{
      p: 2.5,
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 2,
      height: '100%',
      minHeight: 240,
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => `0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
      }
    }}>
      {/* Header con icono y nombre */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ 
          bgcolor: (theme) => theme.palette.secondary.main, 
          mr: 1.5, 
          width: 36, 
          height: 36 
        }}>
          <Storefront fontSize="small" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold"
            sx={{ 
              color: (theme) => theme.palette.text.primary,
              fontSize: 16,
              mb: 0.5
            }}
          >
            {tienda}
          </Typography>
          <Chip 
            label={statusLabel} 
            color={statusColor} 
            size="small" 
            sx={{ height: 20, fontSize: 11 }}
          />
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2, bgcolor: (theme) => theme.palette.custom?.tableBorder || '#444' }} />
      
      {/* Métricas */}
      <Box sx={{ mb: 2, flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 13 }}>
            Total de cierres
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ color: (theme) => theme.palette.text.primary }}>
            {total}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, fontSize: 13 }}>
            Validados
          </Typography>
          <Typography variant="body2" fontWeight="bold" sx={{ color: (theme) => theme.palette.success.main }}>
            {validados} / {total}
          </Typography>
        </Box>
        
        {/* Barra de progreso */}
        <LinearProgress 
          variant="determinate" 
          value={porcentajeValidados} 
          sx={{ 
            height: 8, 
            borderRadius: 4, 
            mb: 1,
            backgroundColor: (theme) => theme.palette.custom?.tableBorder || '#333', 
            '& .MuiLinearProgress-bar': { 
              backgroundColor: (theme) => theme.palette.success.main,
              borderRadius: 4
            } 
          }} 
        />
        <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.disabled, fontSize: 11 }}>
          {porcentajeValidados.toFixed(0)}% validado
        </Typography>
      </Box>
      
      {/* Indicadores de estado */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <Chip 
          label={`✓ ${correctos}`} 
          color="success" 
          size="small" 
          sx={{ flex: 1, fontSize: 11, fontWeight: 'bold' }} 
        />
        <Chip 
          label={`⚠ ${advertencias}`} 
          color="warning" 
          size="small" 
          sx={{ flex: 1, fontSize: 11, fontWeight: 'bold' }} 
        />
        <Chip 
          label={`✕ ${graves}`} 
          color="error" 
          size="small" 
          sx={{ flex: 1, fontSize: 11, fontWeight: 'bold' }} 
        />
      </Box>
    </Card>
  );
};

// --- COMPONENTE PRINCIPAL ---

function parseMediosPago(medios_pago) {
  try {
    if (typeof medios_pago === 'string') {
      const mp = JSON.parse(medios_pago);
      return Array.isArray(mp) ? mp : [];
    }
    if (Array.isArray(medios_pago)) return medios_pago;
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

  // (Eliminado useEffect de limpieza inicial: innecesario)

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

  // (Eliminado useEffect de debug: innecesario)

  // Agrupar cierres por tienda para dashboard (usa tiendas reales)
  const tiendasStats = React.useMemo(() => {
    const tiendas = {};
    allClosures.forEach(c => {
      if (!tiendas[c.tienda]) tiendas[c.tienda] = { cierres: [] };
      tiendas[c.tienda].cierres.push(c);
    });
    return tiendas;
  }, [allClosures]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: (theme) => theme.palette.background.default }}
      >
        <CircularProgress size={40} sx={{ color: (theme) => theme.palette.text.primary }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 }, 
      backgroundColor: (theme) => theme.palette.background.default, 
      color: (theme) => theme.palette.text.primary,
      minHeight: '100vh',
    }}>
      {/* Contenido */}
      {allClosures.length > 0 ? (
        <Grid container spacing={3}>
          {/* Sección de métricas principales */}
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 1
            }}>
              <Assessment sx={{ 
                fontSize: 32, 
                color: (theme) => theme.palette.primary.main 
              }} />
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                sx={{ 
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                Métricas Generales
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Total de Cierres"
              value={stats.totalCierres}
              icon={<Assessment />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Tiendas Activas"
              value={stats.totalTiendas}
              icon={<Storefront />}
              color={theme.palette.secondary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Diferencia Total"
              value={formatCurrency(stats.totalDiferencias)}
              icon={<AttachMoney />}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MetricCard
              title="Promedio por Cierre"
              value={formatCurrency(stats.promedioDiferencias)}
              icon={<TrendingUp />}
              color={theme.palette.primary.main}
            />
          </Grid>

          {/* Tarjetas de tiendas - Grid responsive */}
          <Grid item xs={12}>
            <Divider sx={{ 
              my: 2, 
              borderColor: (theme) => theme.palette.divider,
              opacity: 0.3
            }} />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 1,
              mt: 2
            }}>
              <Storefront sx={{ 
                fontSize: 32, 
                color: (theme) => theme.palette.secondary.main 
              }} />
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                sx={{ 
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                Estado por Tienda
              </Typography>
            </Box>
          </Grid>
          
          {Object.entries(tiendasStats).map(([tienda, stats]) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={tienda}>
              <StoreDashboardCard tienda={tienda} stats={stats} compact />
            </Grid>
          ))}

          {/* Sección de estado general */}
          <Grid item xs={12}>
            <Divider sx={{ 
              my: 2, 
              borderColor: (theme) => theme.palette.divider,
              opacity: 0.3
            }} />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 1,
              mt: 2
            }}>
              <CheckCircleOutline sx={{ 
                fontSize: 32, 
                color: (theme) => theme.palette.success.main 
              }} />
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                sx={{ 
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                Estado General
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatusOverview stats={stats} compact />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ProgressCard 
              title="Cierres Correctos" 
              current={stats.totalCorrectos} 
              total={stats.totalCierres} 
              color="#4caf50" 
              compact 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ActivitySummaryCard recentClosures={recentClosures} compact />
          </Grid>

          {/* Sección de análisis */}
          <Grid item xs={12}>
            <Divider sx={{ 
              my: 2, 
              borderColor: (theme) => theme.palette.divider,
              opacity: 0.3
            }} />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 1,
              mt: 2
            }}>
              <TrendingUp sx={{ 
                fontSize: 32, 
                color: (theme) => theme.palette.info.main 
              }} />
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                sx={{ 
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                Análisis y Actividad
              </Typography>
            </Box>
          </Grid>
          
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
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
          borderRadius: 1,
        }}>
          <InfoOutlined sx={{ fontSize: 60, color: (theme) => theme.palette.text.disabled, mb: 2 }} />
          <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 1 }}>
            No hay datos disponibles
          </Typography>
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
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

// --- TARJETA DE ÚLTIMA ACTIVIDAD ---
const ActivitySummaryCard = ({ recentClosures, compact }) => {
  if (!recentClosures || recentClosures.length === 0) {
    return (
      <Card sx={{
        p: compact ? 3 : 2,
        backgroundColor: (theme) => theme.palette.background.paper,
        border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
        borderRadius: 1,
        height: compact ? 240 : '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 1 }}>
          Última Actividad
        </Typography>
        <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
          No hay cierres recientes
        </Typography>
      </Card>
    );
  }
  const ultimo = recentClosures[0];
  return (
    <Card sx={{
      p: compact ? 3 : 2,
      backgroundColor: (theme) => theme.palette.background.paper,
      border: (theme) => `1px solid ${theme.palette.custom?.tableBorder || '#333'}`,
      borderRadius: 1,
      height: compact ? 240 : '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, mb: 1 }}>
        Última Actividad
      </Typography>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
          Tienda: <b>{ultimo.tienda}</b>
        </Typography>
        <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
          Usuario: <b>{ultimo.usuario}</b>
        </Typography>
        <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
          Fecha: <b>{ultimo.fechaObj ? ultimo.fechaObj.toLocaleDateString('es-CL') : ultimo.fecha}</b>
        </Typography>
      </Box>
      <Chip label={`Diferencia: $${parseFloat(ultimo.grand_difference_total || 0).toFixed(2)}`} color={parseFloat(ultimo.grand_difference_total || 0) === 0 ? "success" : "error"} size="small" />
    </Card>
  );
};
