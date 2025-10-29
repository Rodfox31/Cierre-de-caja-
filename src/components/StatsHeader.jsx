import React from 'react';
import {
  Box,
  Typography,
  useTheme
} from '@mui/material';

const StatsHeader = ({
  selectedCierres,
  allCierres,
  selectedTienda,
  selectedCierresIds,
  months,
  selectedMonth,
  selectedYear
}) => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        mb: 2, 
        py: 1, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}
    >
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
        {selectedCierres.length > 0
          ? `📊 ${selectedCierres.length} cierres de ${selectedTienda || 'todas las tiendas'}`
          : `📊 ${allCierres.length} cierres totales en ${months[selectedMonth]} ${selectedYear}`
        }
        {selectedCierresIds.size > 0 && ` • ✓ ${selectedCierresIds.size} seleccionados`}
      </Typography>
    </Box>
  );
};

export default StatsHeader;