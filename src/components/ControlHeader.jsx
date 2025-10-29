import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon
} from '@mui/icons-material';

const ControlHeader = ({
  selectedMonth,
  selectedYear,
  months,
  years,
  handleMonthChange,
  handleYearChange,
  handleRefresh,
  handleValidar,
  handlePasarRevision,
  selectedCierresIds,
  handleExportCSV,
  handleExportPDF
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
      {/* Columna 1: Filtros de periodo */}
      <Grid item xs={12} sm={6} md={4}>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel>Mes</InputLabel>
            <Select value={selectedMonth} onChange={handleMonthChange}>
              {months.map((month, idx) => (
                <MenuItem key={idx} value={idx}>{month}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 100 }}>
            <InputLabel>Año</InputLabel>
            <Select value={selectedYear} onChange={handleYearChange}>
              {years.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Grid>

      {/* Columna 2: Acciones de validación */}
      <Grid item xs={12} sm={6} md={4}>
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            variant="contained"
            color="success"
            onClick={handleValidar}
            disabled={selectedCierresIds.size === 0}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Validar ({selectedCierresIds.size})
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handlePasarRevision}
            disabled={selectedCierresIds.size === 0}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Revisar ({selectedCierresIds.size})
          </Button>
        </Stack>
      </Grid>

      {/* Columna 3: Exportación */}
      <Grid item xs={12} sm={12} md={4}>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="outlined"
            size="small"
            onClick={handleExportCSV}
            sx={{ textTransform: 'none', minWidth: 'auto', fontWeight: 600 }}
          >
            CSV
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleExportPDF}
            sx={{ textTransform: 'none', minWidth: 'auto', fontWeight: 600 }}
          >
            PDF
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default ControlHeader;