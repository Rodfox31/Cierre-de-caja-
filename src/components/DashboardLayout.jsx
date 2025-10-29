import React from 'react';
import {
  Box,
  Paper,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';

import ControlHeader from './ControlHeader';
import FilterBar from './FilterBar';
import StatsHeader from './StatsHeader';
import TiendaGrid from './TiendaGrid';
import CierresTable from './CierresTable';

const DashboardLayout = ({
  error,
  snackbar,
  handleCloseSnackbar,
  loading,
  // Control Header Props
  selectedMonth,
  selectedYear,
  months,
  years,
  handleMonthChange,
  handleYearChange,
  fetchCierres,
  handleValidarDiferencias,
  handlePasarRevision,
  selectedCierresIds,
  handleExportCSV,
  handleExportPDF,
  // Filter Bar Props
  estadoFilter,
  validacionFilter,
  handleEstadoFilter,
  handleValidacionFilter,
  // Stats Header Props
  selectedCierres,
  allCierres,
  selectedTienda,
  // Tienda Grid Props
  tiendasAMostrar,
  selectedCard,
  handleTiendaClick,
  // Table Props
  sortedCierres,
  orderBy,
  orderDirection,
  handleSort,
  handleSelectAllClick,
  handleSelectClick,
  getEstado,
  formatCurrency
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Panel de control sticky */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Control Header con periodo y acciones */}
        <ControlHeader
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          months={months}
          years={years}
          handleMonthChange={handleMonthChange}
          handleYearChange={handleYearChange}
          handleRefresh={fetchCierres}
          handleValidar={handleValidarDiferencias}
          handlePasarRevision={handlePasarRevision}
          selectedCierresIds={selectedCierresIds}
          handleExportCSV={handleExportCSV}
          handleExportPDF={handleExportPDF}
        />

        <Divider sx={{ my: 2 }} />

        {/* Filter Bar con estado y validación */}
        <FilterBar
          estadoFilter={estadoFilter}
          validacionFilter={validacionFilter}
          handleEstadoFilter={handleEstadoFilter}
          handleValidacionFilter={handleValidacionFilter}
        />

        {/* Stats Header con conteos */}
        {(selectedCierres.length > 0 || allCierres.length > 0) && (
          <StatsHeader
            selectedCierres={selectedCierres}
            allCierres={allCierres}
            selectedTienda={selectedTienda}
            selectedCierresIds={selectedCierresIds}
            months={months}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}
      </Paper>

      {/* Contenido principal */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Grid de tiendas */}
          <TiendaGrid
            tiendasAMostrar={tiendasAMostrar}
            selectedCard={selectedCard}
            handleTiendaClick={handleTiendaClick}
            loading={loading}
          />

          {/* Tabla de cierres */}
          {selectedTienda && (
            <CierresTable
              sortedCierres={sortedCierres}
              selectedCierresIds={selectedCierresIds}
              orderBy={orderBy}
              orderDirection={orderDirection}
              handleSort={handleSort}
              handleSelectAllClick={handleSelectAllClick}
              handleSelectClick={handleSelectClick}
              loading={loading}
              getEstado={getEstado}
              formatCurrency={formatCurrency}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default DashboardLayout;