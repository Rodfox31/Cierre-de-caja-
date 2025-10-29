// DetallesCierre.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Grid,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Stack,
} from "@mui/material";
import {
  Close,
  Person,
  Store,
  CalendarToday,
  Payment,
  Description,
  AssignmentInd,
  AttachMoney,
  AccountBalance,
  TrendingUp,
} from "@mui/icons-material";
import moment from 'moment';

const SectionHeader = ({ icon, title, variant = "caption" }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      mb: 1, 
      gap: 0.5,
      pb: 0.5,
      borderBottom: '2px solid #3a3a3a'
    }}>
      {icon && React.cloneElement(icon, { 
        fontSize: "small", 
        sx: { color: "#A3BE8C" } 
      })}
      <Typography variant={variant} sx={{ 
        fontWeight: 700, 
        color: '#ffffff', 
        textTransform: 'uppercase', 
        letterSpacing: 0.5, 
        fontSize: '0.8rem' 
      }}>
        {title}
      </Typography>
    </Box>
  );
};

const InfoRow = ({ label, value, bold = false }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.1 }}>
      <Typography variant="caption" sx={{ color: "#b0b0b0", fontWeight: bold ? 600 : 400, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: "#ffffff", fontWeight: bold ? 600 : 400, fontFamily: 'monospace', fontSize: '0.7rem' }}>
        {value}
      </Typography>
    </Box>
  );
};

const CompactCard = ({ title, icon, children, noPadding = false }) => {
  return (
    <Box sx={{ 
      mb: 1.5, 
      border: '1px solid #3a3a3a', 
      borderRadius: 2, 
      p: noPadding ? 0 : 1.5, 
      bgcolor: '#1a1a1a',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 12px rgba(163, 190, 140, 0.1)',
        borderColor: '#4a4a4a'
      }
    }}>
      {title && <SectionHeader icon={icon} title={title} />}
      {children}
    </Box>
  );
};

function DetallesCierre({ resumenData = {}, onClose, open }) {
  // Formatear valores monetarios
  const formatCurrency = (value) => {
    if (value == null || value === '') return '$0';
    if (typeof value === 'string') {
      if (value.includes('$')) return value;
      let clean = value.trim();
      if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(clean)) {
        clean = clean.replace(/\./g, '');
        clean = clean.replace(/,/g, '.');
      } else if (/^\d+(,\d+)?$/.test(clean)) {
        clean = clean.replace(/,/g, '.');
      }
      const num = parseFloat(clean) || 0;
      return `$${num.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    const num = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `$${num.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Usar los totales que vienen de CierreCaja
  const totalFacturado = resumenData.granTotalMedios || '';
  const totalCobrado = resumenData.granTotalMedios || '';
  const diferenciaMedios = resumenData.balanceSinJustificar || '';
  const totalJustificaciones = resumenData.justificaciones?.reduce((sum, just) => sum + (parseFloat(just.ajuste) || 0), 0) || 0;
  let balanceFinal = '';
  if (diferenciaMedios !== '' && totalJustificaciones !== '') {
    const dif = parseFloat(
      typeof diferenciaMedios === 'string' ? diferenciaMedios.replace(/\./g, '').replace(/,/g, '.') : diferenciaMedios
    ) || 0;
    const just = typeof totalJustificaciones === 'string' ? parseFloat(totalJustificaciones.replace(/\./g, '').replace(/,/g, '.')) : totalJustificaciones;
    balanceFinal = dif - (just || 0);
    if (isNaN(balanceFinal)) balanceFinal = 0;
  } else {
    balanceFinal = 0;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          background: "#1e1e1e",
          color: "#ffffff",
          p: 1,
          maxHeight: '95vh',
          overflow: 'auto',
          '& .MuiPaper-root': {
            backgroundColor: '#1e1e1e'
          },
          '& .MuiCard-root': {
            backgroundColor: '#1e1e1e'
          },
          '& .MuiTableContainer-root': {
            backgroundColor: '#1e1e1e'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 2, 
        mb: 1, 
        borderBottom: "2px solid #3a3a3a",
        background: 'linear-gradient(135deg, #1e1e1e 0%, #252525 100%)'
      }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                bgcolor: '#A3BE8C', 
                borderRadius: 1, 
                p: 0.5, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Description sx={{ fontSize: '1.5rem', color: '#1e1e1e' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ffffff", letterSpacing: 0.5 }}>
                  Detalle del Cierre de Caja
                </Typography>
                <Typography variant="caption" sx={{ color: "#888", fontSize: '0.75rem' }}>
                  Vista completa del cierre
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item>
            <IconButton 
              onClick={onClose} 
              sx={{ 
                color: "#b0b0b0",
                '&:hover': { 
                  bgcolor: '#2a2a2a',
                  color: '#ffffff'
                }
              }} 
              size="small"
            >
              <Close />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 2
      }}>
        {/* ENCABEZADO CON INFORMACIÓN BÁSICA - EN UNA LÍNEA */}
        <CompactCard title="Información General" icon={<Store />}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            gap: 2,
            p: 1,
            bgcolor: '#252525',
            borderRadius: 1,
            border: '1px solid #3a3a3a'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarToday sx={{ fontSize: '1rem', color: '#A3BE8C' }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: '0.65rem', display: 'block' }}>
                  Fecha
                </Typography>
                <Typography variant="body2" sx={{ color: "#ffffff", fontSize: '0.85rem', fontWeight: 600 }}>
                  {moment(resumenData.fecha, 'DD/MM/YYYY').format('DD/MM/YYYY') || 'N/A'}
                </Typography>
              </Box>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#3a3a3a' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Store sx={{ fontSize: '1rem', color: '#88C0D0' }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: '0.65rem', display: 'block' }}>
                  Tienda
                </Typography>
                <Typography variant="body2" sx={{ color: "#ffffff", fontSize: '0.85rem', fontWeight: 600 }}>
                  {resumenData.tienda || 'N/A'}
                </Typography>
              </Box>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ bgcolor: '#3a3a3a' }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Person sx={{ fontSize: '1rem', color: '#EBCB8B' }} />
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: '0.65rem', display: 'block' }}>
                  Usuario
                </Typography>
                <Typography variant="body2" sx={{ color: "#ffffff", fontSize: '0.85rem', fontWeight: 600 }}>
                  {resumenData.usuario || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CompactCard>

        {/* EFECTIVO */}
        {resumenData.total_billetes && (
          <CompactCard title="Efectivo" icon={<AttachMoney />}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <InfoRow label="Cash Total" value={formatCurrency(resumenData.total_billetes)} bold />
              </Grid>
              <Grid item xs={6}>
                <InfoRow label="Final Balance" value={formatCurrency(resumenData.final_balance)} />
              </Grid>
            </Grid>
            {Array.isArray(resumenData.bills) && resumenData.bills.length > 0 && (
              <Table size="small" sx={{ minWidth: 300, mt: 1, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Billete/Moneda</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Cantidad</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumenData.bills.map((bill, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{bill.label}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{bill.cantidad}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{formatCurrency(bill.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CompactCard>
        )}

        {/* MEDIOS DE PAGO */}
        <CompactCard title="Medios de Pago" icon={<Payment />} noPadding>
          <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#252525' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#A3BE8C', borderBottom: '2px solid #3a3a3a' }}>Medio</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#A3BE8C', borderBottom: '2px solid #3a3a3a' }}>Facturado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#A3BE8C', borderBottom: '2px solid #3a3a3a' }}>Cobrado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#A3BE8C', borderBottom: '2px solid #3a3a3a' }}>Diferencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumenData.mediosPago?.map((medio, idx) => (
                <TableRow 
                  key={idx} 
                  sx={{ 
                    '&:hover': { bgcolor: '#252525' },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <TableCell sx={{ fontSize: '0.75rem', color: '#ffffff', borderBottom: '1px solid #2a2a2a' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: '50%',
                          bgcolor: medio.differenceVal === 0 ? '#4caf50' : medio.differenceVal > 0 ? '#ff9800' : '#f44336'
                        }} 
                      />
                      {medio.medio}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#b0b0b0', borderBottom: '1px solid #2a2a2a' }}>
                    {formatCurrency(medio.facturadoVal ?? medio.facturado)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#b0b0b0', borderBottom: '1px solid #2a2a2a' }}>
                    {formatCurrency(medio.cobradoVal ?? medio.cobrado)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: '0.75rem', 
                    fontFamily: 'monospace',
                    color: medio.differenceVal > 0 ? '#4caf50' : medio.differenceVal < 0 ? '#f44336' : '#b0b0b0',
                    fontWeight: medio.differenceVal !== 0 ? 'bold' : 'normal',
                    borderBottom: '1px solid #2a2a2a'
                  }}>
                    {formatCurrency(medio.differenceVal ?? medio.difference)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Mostrar totales solo si vienen de CierreCaja */}
              {resumenData.granTotalMedios && (
                <TableRow sx={{ 
                  borderTop: '2px solid #3a3a3a', 
                  fontWeight: 'bold', 
                  bgcolor: '#252525' 
                }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#A3BE8C' }}>TOTAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'monospace', color: '#ffffff' }}>
                    {formatCurrency(resumenData.granTotalMedios)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.8rem', fontFamily: 'monospace', color: '#ffffff' }}>
                    {formatCurrency(resumenData.granTotalMediosCobrado ?? resumenData.granTotalMedios)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.8rem', 
                    fontFamily: 'monospace',
                    color: resumenData.balanceSinJustificar > 0 ? '#4caf50' : resumenData.balanceSinJustificar < 0 ? '#f44336' : '#ffffff'
                  }}>
                    {formatCurrency(resumenData.balanceSinJustificar)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CompactCard>

        {/* BRINKS Y JUSTIFICACIONES */}
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <CompactCard title="Brinks" icon={<AccountBalance />}>
              {resumenData.brinks?.length > 0 ? (
                <Stack spacing={0.2}>
                  {resumenData.brinks.map((brink, idx) => (
                    <InfoRow key={idx} label={`#${brink.codigo}`} value={formatCurrency(brink.monto)} />
                  ))}
                  <Divider sx={{ my: 0.2, bgcolor: '#3a3a3a' }} />
                  <InfoRow label="Total Brinks" value={resumenData.brinksTotal || '$0'} bold />
                </Stack>
              ) : (
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#666', textAlign: 'center', fontSize: '0.65rem' }}>
                  No hay registros de Brinks
                </Typography>
              )}
            </CompactCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <CompactCard title="Justificaciones" icon={<AssignmentInd />}>
              {resumenData.justificaciones?.length > 0 ? (
                <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#2a2a2a' }}>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Usuario</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Orden</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Medio de Pago</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Motivo</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#b0b0b0' }}>Ajuste</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resumenData.justificaciones.map((just, idx) => (
                      <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#252525' } }}>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{just.fecha}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{just.usuario}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{just.cliente}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{just.orden}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{just.medio_pago}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{just.motivo}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#ffffff' }}>{formatCurrency(just.ajuste)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#2a2a2a' }}>
                      <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#ffffff' }}>Total Ajustes</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#ffffff' }}>{formatCurrency(totalJustificaciones)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#666', textAlign: 'center', fontSize: '0.65rem' }}>
                  No hay justificaciones registradas
                </Typography>
              )}
            </CompactCard>
          </Grid>
        </Grid>

        {/* RESUMEN FINAL */}
        <CompactCard title="Resumen Final" icon={<TrendingUp />}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Stack spacing={0.5}>
                <InfoRow label="Diferencia en Medios de Pago" value={formatCurrency(diferenciaMedios)} />
                <InfoRow label="Total Justificaciones" value={formatCurrency(totalJustificaciones)} />
                <Divider sx={{ bgcolor: '#3a3a3a', my: 0.5 }} />
                <InfoRow 
                  label="BALANCE FINAL SIN JUSTIFICAR" 
                  value={formatCurrency(balanceFinal)} 
                  bold 
                />
                <InfoRow label="Responsable" value={resumenData.responsable || 'N/A'} />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                border: '2px solid',
                borderColor: Math.abs(balanceFinal) < 1 ? '#4caf50' : '#ff9800',
                borderRadius: 2, 
                p: 2, 
                textAlign: 'center',
                bgcolor: Math.abs(balanceFinal) < 1 ? 'rgba(76, 175, 80, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                boxShadow: Math.abs(balanceFinal) < 1 
                  ? '0 0 20px rgba(76, 175, 80, 0.2)' 
                  : '0 0 20px rgba(255, 152, 0, 0.2)',
                transition: 'all 0.3s ease'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  color: Math.abs(balanceFinal) < 1 ? '#4caf50' : '#ff9800',
                  mb: 1,
                  fontSize: '0.85rem',
                  letterSpacing: 1
                }}>
                  {Math.abs(balanceFinal) < 1 ? '✓ CUADRADO' : '⚠ CON DIFERENCIAS'}
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  color: balanceFinal >= 0 ? '#4caf50' : '#f44336',
                  fontFamily: 'monospace',
                  fontSize: '1.5rem'
                }}>
                  {formatCurrency(isNaN(balanceFinal) ? 0 : balanceFinal)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CompactCard>

        {/* COMENTARIOS */}
        {resumenData.comentarios && (
          <CompactCard title="Comentarios" icon={<Description />}>
            <Typography variant="caption" sx={{ 
              color: '#b0b0b0', 
              fontStyle: 'italic',
              p: 0.5,
              border: '1px solid #3a3a3a',
              borderRadius: 1,
              display: 'block',
              fontSize: '0.7rem'
            }}>
              {resumenData.comentarios}
            </Typography>
          </CompactCard>
        )}

        {/* CAMPO PARA FIRMA */}
        <CompactCard title="Validación" icon={<Person />}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                border: '1px solid #3a3a3a', 
                borderRadius: 1, 
                p: 1.5, 
                textAlign: 'center',
                minHeight: '50px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: '#2a2a2a'
              }}>
                <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.7rem' }}>
                  FIRMA DEL RESPONSABLE
                </Typography>
                <Typography variant="caption" sx={{ color: '#b0b0b0', mt: 0.5, fontSize: '0.65rem' }}>
                  {resumenData.responsable || 'Responsable'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={0.3}>
                <InfoRow label="Fecha de Cierre" value={moment().format('DD/MM/YYYY HH:mm')} />
                <InfoRow label="Hora de Impresión" value={moment().format('HH:mm:ss')} />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic', fontSize: '0.6rem' }}>
                    Documento automático del cierre de caja. Conservar para control interno.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CompactCard>
      </DialogContent>
    </Dialog>
  );
}

export default DetallesCierre;
