import React from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const FilterBar = ({ 
  estadoFilter, 
  validacionFilter, 
  handleEstadoFilter, 
  handleValidacionFilter 
}) => {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
      {/* Estado ButtonGroup */}
      <Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 1, display: 'block' }}>
          Estado:
        </Typography>
        <ButtonGroup size="small">
          <Button
            variant={estadoFilter === 'todos' ? 'contained' : 'outlined'}
            onClick={() => handleEstadoFilter('todos')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Todos
          </Button>
          <Button
            variant={estadoFilter === 'correcto' ? 'contained' : 'outlined'}
            onClick={() => handleEstadoFilter('correcto')}
            startIcon={<CheckCircleIcon />}
            color="success"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Correcto
          </Button>
          <Button
            variant={estadoFilter === 'menor' ? 'contained' : 'outlined'}
            onClick={() => handleEstadoFilter('menor')}
            startIcon={<WarningIcon />}
            color="warning"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Dif. Menor
          </Button>
          <Button
            variant={estadoFilter === 'grave' ? 'contained' : 'outlined'}
            onClick={() => handleEstadoFilter('grave')}
            startIcon={<ErrorIcon />}
            color="error"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Dif. Grave
          </Button>
        </ButtonGroup>
      </Box>

      {/* Validación ButtonGroup */}
      <Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, mb: 1, display: 'block' }}>
          Validación:
        </Typography>
        <ButtonGroup size="small">
          <Button
            variant={validacionFilter === 'todos' ? 'contained' : 'outlined'}
            onClick={() => handleValidacionFilter('todos')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Todos
          </Button>
          <Button
            variant={validacionFilter === 'validado' ? 'contained' : 'outlined'}
            onClick={() => handleValidacionFilter('validado')}
            startIcon={<CheckCircleIcon />}
            color="success"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Validado
          </Button>
          <Button
            variant={validacionFilter === 'sin_validar' ? 'contained' : 'outlined'}
            onClick={() => handleValidacionFilter('sin_validar')}
            startIcon={<InfoIcon />}
            color="warning"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Sin Validar
          </Button>
          <Button
            variant={validacionFilter === 'revisar' ? 'contained' : 'outlined'}
            onClick={() => handleValidacionFilter('revisar')}
            startIcon={<AssignmentIcon />}
            color="info"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 'auto',
              fontSize: '0.8rem'
            }}
          >
            Revisar
          </Button>
        </ButtonGroup>
      </Box>
    </Stack>
  );
};

export default FilterBar;