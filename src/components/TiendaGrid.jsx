import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme
} from '@mui/material';

const TiendaGrid = ({ 
  tiendasAMostrar, 
  selectedCard, 
  handleTiendaClick,
  loading 
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((key) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={key}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" height={118} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!tiendasAMostrar?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
          No se encontraron tiendas en el período seleccionado
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {tiendasAMostrar.map((stats) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={stats.tienda}>
          <Box sx={{ height: '100%' }}>
            <TiendaCard
              tienda={stats.tienda}
              totalCierres={stats.totalCierres}
              cierresConErrores={stats.cierresConErrores}
              totalDiferencia={stats.totalDiferencia}
              isSelected={selectedCard === stats.tienda}
              onClick={() => handleTiendaClick(stats.tienda)}
            />
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default TiendaGrid;