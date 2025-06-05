import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  useTheme,
  Card,
  CardContent,
  Tab,
  Tabs,
  Fade,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';

const HomePage = () => {
  const theme = useTheme();
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [estadisticasPorTienda, setEstadisticasPorTienda] = useState([]);
  const [tendenciaDiferencias, setTendenciaDiferencias] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/cierres-completo`);
        const data = response.data;
        setCierres(data);
        procesarDatos(data);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const procesarDatos = (data) => {
    // Procesar estadísticas por tienda
    const estatsPorTienda = data.reduce((acc, cierre) => {
      if (!acc[cierre.tienda]) {
        acc[cierre.tienda] = {
          tienda: cierre.tienda,
          totalCierres: 0,
          totalDiferencias: 0,
          mayorDiferencia: 0,
          cierresConDiferencia: 0,
        };
      }

      const diferencia = Math.abs(parseFloat(cierre.grand_difference_total) || 0);
      acc[cierre.tienda].totalCierres += 1;
      acc[cierre.tienda].totalDiferencias += diferencia;
      acc[cierre.tienda].mayorDiferencia = Math.max(acc[cierre.tienda].mayorDiferencia, diferencia);
      if (diferencia > 0) {
        acc[cierre.tienda].cierresConDiferencia += 1;
      }

      return acc;
    }, {});

    setEstadisticasPorTienda(Object.values(estatsPorTienda));

    // Procesar tendencia de diferencias (últimos 30 días)
    const ultimos30Dias = data
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 30)
      .reverse()
      .map(cierre => ({
        fecha: new Date(cierre.fecha).toLocaleDateString(),
        diferencia: Math.abs(parseFloat(cierre.grand_difference_total) || 0)
      }));

    setTendenciaDiferencias(ultimos30Dias);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Estilos mejorados
  const styles = {
    pageContainer: {
      p: 3,
      minHeight: '100vh',
      background: theme.palette.background.default,
    },
    headerSection: {
      mb: 4,
      '& h5': {
        fontWeight: 700,
        background: theme.palette.custom.appBarGradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    },
    statCard: {
      height: '100%',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      background: theme.palette.background.paper,
      borderRadius: 2,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
      }
    },
    tabsContainer: {
      mb: 4,
      borderRadius: 2,
      overflow: 'hidden',
      '& .MuiTabs-root': {
        background: theme.palette.background.paper,
      },
      '& .MuiTab-root': {
        color: theme.palette.text.secondary,
        '&.Mui-selected': {
          color: theme.palette.primary.main,
        }
      }
    },
    chartContainer: {
      p: 3,
      height: '400px',
      background: theme.palette.background.paper,
      borderRadius: 2,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    summarySection: {
      mt: 4,
      p: 3,
      background: theme.palette.background.paper,
      borderRadius: 2,
      '& .MuiTypography-h6': {
        mb: 3,
        fontWeight: 600,
        color: theme.palette.text.primary,
      }
    },
    summaryCard: {
      height: '100%',
      background: theme.palette.background.paper,
      transition: 'transform 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
      },
      '& .MuiCardContent-root': {
        p: 2,
      }
    },
    iconWrapper: {
      display: 'flex',
      alignItems: 'center',
      mb: 2,
      '& .MuiSvgIcon-root': {
        fontSize: '2rem',
      }
    },
    statValue: {
      fontSize: '1.8rem',
      fontWeight: 700,
      transition: 'color 0.3s ease',
    }
  };

  // Componente StatCard mejorado
  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={styles.statCard}>
      <CardContent>
        <Box sx={styles.iconWrapper}>
          {React.cloneElement(icon, { style: { color } })}
          <Typography variant="h6" sx={{ ml: 1, color: theme.palette.text.primary }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ ...styles.statValue, color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={1000}>
      <Box sx={styles.pageContainer}>
        {/* Header Section */}
        <Box sx={styles.headerSection}>
          <Typography variant="body1" color="text.secondary">
            Monitoreo y análisis de cierres de caja
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Total Tiendas"
              value={new Set(cierres.map(c => c.tienda)).size}
              icon={<StoreIcon />}
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Total Cierres"
              value={cierres.length}
              icon={<MoneyIcon />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Diferencias Totales"
              value={`$${cierres.reduce((acc, c) => acc + Math.abs(parseFloat(c.grand_difference_total) || 0), 0).toFixed(2)}`}
              icon={<WarningIcon />}
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard
              title="Promedio Diferencias"
              value={`$${(cierres.reduce((acc, c) => acc + Math.abs(parseFloat(c.grand_difference_total) || 0), 0) / cierres.length).toFixed(2)}`}
              icon={<TrendingUpIcon />}
              color={theme.palette.info.main}
            />
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Paper sx={styles.tabsContainer}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            TabIndicatorProps={{
              style: {
                backgroundColor: theme.palette.primary.main,
              }
            }}
          >
            <Tab label="Diferencias por Tienda" />
            <Tab label="Tendencia de Diferencias" />
            <Tab label="Distribución de Diferencias" />
          </Tabs>
        </Paper>

        {/* Charts Section */}
        <Paper sx={styles.chartContainer}>
          {selectedTab === 0 && (
            <ResponsiveContainer>
              <BarChart data={estadisticasPorTienda}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="tienda" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Legend />
                <Bar dataKey="totalDiferencias" fill={theme.palette.primary.main} name="Total Diferencias ($)" />
                <Bar dataKey="cierresConDiferencia" fill={theme.palette.success.main} name="Cierres con Diferencia" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedTab === 1 && (
            <ResponsiveContainer>
              <LineChart data={tendenciaDiferencias}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis dataKey="fecha" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="diferencia" 
                  stroke={theme.palette.primary.main} 
                  name="Diferencia ($)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {selectedTab === 2 && (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={estadisticasPorTienda}
                  dataKey="totalDiferencias"
                  nameKey="tienda"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  label
                >
                  {estadisticasPorTienda.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Summary Section */}
        <Paper sx={styles.summarySection}>
          <Typography variant="h6">
            Resumen por Tienda
          </Typography>
          <Grid container spacing={2}>
            {estadisticasPorTienda.map((stats) => (
              <Grid item xs={12} md={4} key={stats.tienda}>
                <Card sx={styles.summaryCard}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {stats.tienda}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Cierres: {stats.totalCierres}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Diferencias Totales: ${stats.totalDiferencias.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Mayor Diferencia: ${stats.mayorDiferencia.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      % con Diferencias: {((stats.cierresConDiferencia / stats.totalCierres) * 100).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Fade>
  );
};

export default HomePage;
