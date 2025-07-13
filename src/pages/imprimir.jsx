// imprimir.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Button,
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
  Circle,
  AttachMoney,
  AccountBalance,
  TrendingUp,
  Print,
} from "@mui/icons-material";
import moment from 'moment';

const SectionHeader = ({ icon, title, variant = "caption" }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 0.5 }}>
      {icon && React.cloneElement(icon, { fontSize: "small", sx: { color: "#666" } })}
      <Typography variant={variant} sx={{ fontWeight: 600, color: "#333", textTransform: 'uppercase', letterSpacing: 0.3, fontSize: '0.75rem' }}>
        {title}
      </Typography>
    </Box>
  );
};

const InfoRow = ({ label, value, bold = false }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.1 }}>
      <Typography variant="caption" sx={{ color: "#333", fontWeight: bold ? 600 : 400, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: "#555", fontWeight: bold ? 600 : 400, fontFamily: 'monospace', fontSize: '0.7rem' }}>
        {value}
      </Typography>
    </Box>
  );
};

const CompactCard = ({ title, icon, children, noPadding = false }) => {
  return (
    <Box sx={{ mb: 0.8, border: '1px solid #e0e0e0', borderRadius: 1, p: noPadding ? 0 : 0.8 }}>
      {title && <SectionHeader icon={icon} title={title} />}
      {children}
    </Box>
  );
};

function Imprimir({ resumenData = {}, onClose, open }) {
  const handlePrint = () => {
    window.print();
  };

  // Formatear valores monetarios
  const formatCurrency = (value) => {
    if (typeof value === 'string' && value.includes('$')) return value;
    const num = parseFloat(value) || 0;
    return `$${num.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
  };

  // Calcular totales
  const totalFacturado = resumenData.mediosPago?.reduce((sum, medio) => sum + (parseFloat(medio.facturado) || 0), 0) || 0;
  const totalCobrado = resumenData.mediosPago?.reduce((sum, medio) => sum + (parseFloat(medio.cobrado) || 0), 0) || 0;
  const diferenciaMedios = totalCobrado - totalFacturado;
  const totalJustificaciones = resumenData.justificaciones?.reduce((sum, just) => sum + (parseFloat(just.ajuste) || 0), 0) || 0;
  const balanceFinal = diferenciaMedios - totalJustificaciones;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          background: "#fff",
          color: "#000",
          p: 1,
          maxHeight: '95vh',
          overflow: 'auto',
          '& .MuiPaper-root': {
            backgroundColor: '#fff'
          },
          '& .MuiCard-root': {
            backgroundColor: '#fff'
          },
          '& .MuiTableContainer-root': {
            backgroundColor: '#fff'
          },
          '@media print': {
            maxHeight: 'none',
            overflow: 'visible',
            boxShadow: 'none',
            margin: 0,
            padding: '8mm',
            fontSize: '8pt',
            width: '210mm',
            minHeight: '297mm'
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 0, 
        mb: 1, 
        borderBottom: "1px solid #e0e0e0",
        '@media print': { 
          display: 'none' 
        }
      }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
              Resumen de Cierre de Caja
            </Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={onClose} sx={{ color: "#666" }} size="small">
              <Close />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      
      <DialogContent sx={{ 
        p: 0,
        '@media print': {
          padding: 0
        }
      }}>
        {/* ENCABEZADO CON INFORMACIÓN BÁSICA */}
        <CompactCard title="Información General" icon={<Store />}>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <InfoRow label="Fecha" value={moment(resumenData.fecha, 'DD/MM/YYYY').format('DD/MM/YYYY') || 'N/A'} />
            </Grid>
            <Grid item xs={4}>
              <InfoRow label="Tienda" value={resumenData.tienda || 'N/A'} />
            </Grid>
            <Grid item xs={4}>
              <InfoRow label="Usuario" value={resumenData.usuario || 'N/A'} />
            </Grid>
          </Grid>
        </CompactCard>

        {/* MEDIOS DE PAGO */}
        <CompactCard title="Medios de Pago" icon={<Payment />} noPadding>
          <Box sx={{ p: 0.8 }}>
            <SectionHeader icon={<Payment />} title="Medios de Pago" />
          </Box>
          <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { py: 0.3, px: 0.5 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Medio</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Facturado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Cobrado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Diferencia</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumenData.mediosPago?.map((medio, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{medio.medio}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#555' }}>
                    {formatCurrency(medio.facturado)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#555' }}>
                    {formatCurrency(medio.cobrado)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: '0.7rem', 
                    fontFamily: 'monospace',
                    color: medio.differenceVal > 0 ? '#388e3c' : medio.differenceVal < 0 ? '#d32f2f' : '#666',
                    fontWeight: medio.differenceVal !== 0 ? 'bold' : 'normal'
                  }}>
                    {medio.difference || formatCurrency(medio.differenceVal)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ borderTop: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>TOTAL</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', fontFamily: 'monospace', color: '#333' }}>
                  {formatCurrency(totalFacturado)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', fontFamily: 'monospace', color: '#333' }}>
                  {formatCurrency(totalCobrado)}
                </TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.7rem', 
                  fontFamily: 'monospace',
                  color: diferenciaMedios > 0 ? '#388e3c' : diferenciaMedios < 0 ? '#d32f2f' : '#666'
                }}>
                  {formatCurrency(diferenciaMedios)}
                </TableCell>
              </TableRow>
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
                  <Divider sx={{ my: 0.2 }} />
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
                <Stack spacing={0.2}>
                  {resumenData.justificaciones.map((just, idx) => (
                    <Box key={idx} sx={{ p: 0.3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', fontSize: '0.65rem' }}>
                        {just.orden} - {just.cliente}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.6rem' }}>
                        Monto: {formatCurrency(just.monto_dif)} - Ajuste: {formatCurrency(just.ajuste)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.6rem' }}>
                        {just.motivo}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 0.2 }} />
                  <InfoRow label="Total Ajustes" value={formatCurrency(totalJustificaciones)} bold />
                </Stack>
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
          <Grid container spacing={1}>
            <Grid item xs={12} md={8}>
              <Stack spacing={0.2}>
                <InfoRow label="Diferencia en Medios de Pago" value={formatCurrency(diferenciaMedios)} />
                <InfoRow label="Total Justificaciones" value={formatCurrency(totalJustificaciones)} />
                <Divider />
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
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 1, 
                textAlign: 'center'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 'bold', 
                  color: Math.abs(balanceFinal) < 1 ? '#388e3c' : '#f57c00',
                  mb: 0.5,
                  fontSize: '0.8rem'
                }}>
                  {Math.abs(balanceFinal) < 1 ? 'CUADRADO' : 'CON DIFERENCIAS'}
                </Typography>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  color: balanceFinal >= 0 ? '#388e3c' : '#d32f2f',
                  fontFamily: 'monospace',
                  fontSize: '1rem'
                }}>
                  {formatCurrency(balanceFinal)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CompactCard>

        {/* COMENTARIOS */}
        {resumenData.comentarios && (
          <CompactCard title="Comentarios" icon={<Description />}>
            <Typography variant="caption" sx={{ 
              color: '#333', 
              fontStyle: 'italic',
              p: 0.5,
              border: '1px solid #e0e0e0',
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
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                p: 1.5, 
                textAlign: 'center',
                minHeight: '50px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="caption" sx={{ color: '#333', fontWeight: 'bold', fontSize: '0.7rem' }}>
                  FIRMA DEL RESPONSABLE
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', mt: 0.5, fontSize: '0.65rem' }}>
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

        {/* BOTÓN DE IMPRESIÓN - Solo visible en pantalla */}
        <Box sx={{ 
          mt: 1, 
          textAlign: 'center',
          '@media print': { 
            display: 'none' 
          }
        }}>
          <Button 
            variant="contained" 
            onClick={handlePrint} 
            size="medium"
            startIcon={<Print />}
            sx={{ px: 3, py: 1, backgroundColor: '#666', '&:hover': { backgroundColor: '#555' } }}
          >
            Imprimir
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default Imprimir;
