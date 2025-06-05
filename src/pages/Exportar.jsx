import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Typography,
  useTheme,
  Fade,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Store as StoreIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

const ExportarPage = () => {
  const theme = useTheme();
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [expandedCards, setExpandedCards] = useState({});
  const [error, setError] = useState(null);

  const styles = {
    pageContainer: {
      p: 3,
      minHeight: '100vh',
      background: theme.palette.background.default,
    },
    filterContainer: {
      mb: 3,
      display: 'flex',
      justifyContent: 'flex-end',
    },
    card: {
      mb: 2,
      background: theme.palette.background.paper,
      '&:hover': {
        boxShadow: `0 0 15px ${theme.palette.primary.main}25`,
      },
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: 2,
    },
    cardContent: {
      background: theme.palette.background.default,
    },
    infoGrid: {
      mt: 2,
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    },
    diferenciaNegativa: {
      color: theme.palette.error.main,
      fontWeight: 'bold',
    },
    diferenciaPositiva: {
      color: theme.palette.success.main,
      fontWeight: 'bold',
    },
    medioPago: {
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      mb: 1,
    },
  };

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    fetchData();
  }, [mesSeleccionado]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:3001/api/cierres-completo');
      
      if (!response.data || response.data.length === 0) {
        setError('No se encontraron datos en la base de datos');
        return;
      }

      const datosFiltrados = response.data.filter(cierre => {
        const fecha = new Date(cierre.fecha);
        return fecha.getMonth() === mesSeleccionado;
      });

      setCierres(datosFiltrados);
    } catch (error) {
      setError(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  const procesarMediosPago = (mediosPago) => {
    try {
      const medios = typeof mediosPago === 'string' ? JSON.parse(mediosPago) : mediosPago;
      return Object.entries(medios).reduce((acc, [medio, valor]) => {
        if (medio.toLowerCase().includes('efectivo')) {
          acc.efectivo += parseFloat(valor) || 0;
        } else {
          acc.digital += parseFloat(valor) || 0;
        }
        return acc;
      }, { efectivo: 0, digital: 0 });
    } catch (error) {
      console.error("Error procesando medios de pago:", error);
      return { efectivo: 0, digital: 0 };
    }
  };

  return (
    <Fade in={true} timeout={1000}>
      <Box sx={styles.pageContainer}>
        {error && (
          <Typography 
            color="error" 
            variant="h6" 
            align="center" 
            sx={{ mb: 2 }}
          >
            {error}
          </Typography>
        )}
        <Box sx={styles.filterContainer}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1">
              Registros encontrados: {cierres.length}
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                variant="outlined"
              >
                {meses.map((mes, index) => (
                  <MenuItem key={index} value={index}>{mes}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {cierres.map((cierre) => {
          const mediosPago = procesarMediosPago(cierre.medios_pago);
          const diferencia = parseFloat(cierre.grand_difference_total) || 0;

          return (
            <Card key={cierre.id} sx={styles.card}>
              <Box sx={styles.cardHeader}>
                <Box sx={styles.infoItem}>
                  <StoreIcon color="primary" />
                  <Typography variant="h6">
                    {cierre.tienda} - {new Date(cierre.fecha).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="h6"
                    sx={diferencia < 0 ? styles.diferenciaNegativa : styles.diferenciaPositiva}
                  >
                    {formatearMonto(diferencia)}
                  </Typography>
                  <IconButton onClick={() => toggleCard(cierre.id)}>
                    {expandedCards[cierre.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Box>

              <Collapse in={expandedCards[cierre.id]}>
                <CardContent sx={styles.cardContent}>
                  <Grid container spacing={3} sx={styles.infoGrid}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        Información General
                      </Typography>
                      <Box sx={styles.infoItem}>
                        <AccountBalanceIcon />
                        <Typography>
                          Balance Final: {formatearMonto(cierre.final_balance)}
                        </Typography>
                      </Box>
                      <Box sx={styles.infoItem}>
                        <PaymentIcon />
                        <Typography>
                          Total Brinks: {formatearMonto(cierre.brinks_total)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        Medios de Pago
                      </Typography>
                      <Box sx={styles.medioPago}>
                        <Typography>
                          Efectivo: {formatearMonto(mediosPago.efectivo)}
                        </Typography>
                      </Box>
                      <Box sx={styles.medioPago}>
                        <Typography>
                          Digital: {formatearMonto(mediosPago.digital)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" color="primary" gutterBottom>
                        Detalles Adicionales
                      </Typography>
                      <Typography>
                        Usuario: {cierre.usuario}
                      </Typography>
                      {cierre.comentarios && (
                        <Typography>
                          Comentarios: {cierre.comentarios}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>
          );
        })}
      </Box>
    </Fade>
  );
};

export default ExportarPage;
