import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TableSortLabel,
  Typography,
  Box,
  Skeleton,
  useTheme
} from '@mui/material';
import moment from 'moment';

const CierresTable = ({
  sortedCierres,
  selectedCierresIds,
  orderBy,
  orderDirection,
  handleSort,
  handleSelectAllClick,
  handleSelectClick,
  loading,
  getEstado,
  formatCurrency
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ mt: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Skeleton variant="rectangular" width={24} height={24} />
              </TableCell>
              {['Fecha', 'Usuario', 'Estado', 'Validación', 'Diferencia'].map((header) => (
                <TableCell key={header}>
                  <Skeleton variant="text" width={100} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((row) => (
              <TableRow key={row}>
                <TableCell padding="checkbox">
                  <Skeleton variant="rectangular" width={24} height={24} />
                </TableCell>
                {[1, 2, 3, 4, 5].map((cell) => (
                  <TableCell key={cell}>
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (!sortedCierres?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
          No hay cierres que mostrar
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        mt: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedCierresIds.size > 0 && selectedCierresIds.size < sortedCierres.length}
                checked={sortedCierres.length > 0 && selectedCierresIds.size === sortedCierres.length}
                onChange={handleSelectAllClick}
              />
            </TableCell>
            <TableCell sortDirection={orderBy === 'fecha' ? orderDirection : false}>
              <TableSortLabel
                active={orderBy === 'fecha'}
                direction={orderDirection}
                onClick={() => handleSort('fecha')}
              >
                Fecha
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === 'usuario' ? orderDirection : false}>
              <TableSortLabel
                active={orderBy === 'usuario'}
                direction={orderDirection}
                onClick={() => handleSort('usuario')}
              >
                Usuario
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === 'estado' ? orderDirection : false}>
              <TableSortLabel
                active={orderBy === 'estado'}
                direction={orderDirection}
                onClick={() => handleSort('estado')}
              >
                Estado
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={orderBy === 'validacion' ? orderDirection : false}>
              <TableSortLabel
                active={orderBy === 'validacion'}
                direction={orderDirection}
                onClick={() => handleSort('validacion')}
              >
                Validación
              </TableSortLabel>
            </TableCell>
            <TableCell 
              align="right" 
              sortDirection={orderBy === 'diferencia' ? orderDirection : false}
            >
              <TableSortLabel
                active={orderBy === 'diferencia'}
                direction={orderDirection}
                onClick={() => handleSort('diferencia')}
              >
                Diferencia
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCierres.map((cierre) => {
            const estado = getEstado(cierre);
            return (
              <TableRow
                hover
                key={cierre.id}
                selected={selectedCierresIds.has(cierre.id)}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  cursor: 'pointer',
                  backgroundColor: estado.bgColor
                }}
                onClick={() => handleSelectClick(cierre.id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedCierresIds.has(cierre.id)} />
                </TableCell>
                <TableCell>{moment(cierre.fecha).format('DD/MM/YYYY')}</TableCell>
                <TableCell>{cierre.usuario}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {estado.icon}
                    <Typography variant="body2">{estado.label}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {cierre.validado ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.success.main }}>
                      <CheckCircleIcon fontSize="small" />
                      <Typography variant="body2">Validado</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.warning.main }}>
                      <InfoIcon fontSize="small" />
                      <Typography variant="body2">Sin validar</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{
                      color: Number(cierre.grand_difference_total) === 0
                        ? theme.palette.success.main
                        : theme.palette.error.main
                    }}
                  >
                    {formatCurrency(cierre.grand_difference_total)}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CierresTable;