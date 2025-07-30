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
  // Formatear valores monetarios robusto para formato chileno/europeo
  const formatCurrency = (value) => {
    if (value == null || value === '') return '$0';
    if (typeof value === 'string') {
      // Si ya tiene el símbolo peso, lo dejamos
      if (value.includes('$')) return value;
      // Limpiar espacios
      let clean = value.trim();
      // Si tiene punto como miles y coma como decimal (ej: "5.400,22")
      if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(clean)) {
        clean = clean.replace(/\./g, ''); // quitar puntos
        clean = clean.replace(/,/g, '.'); // cambiar coma por punto
      }
      // Si tiene solo coma decimal (ej: "5400,22")
      else if (/^\d+(,\d+)?$/.test(clean)) {
        clean = clean.replace(/,/g, '.');
      }
      // Si tiene solo punto decimal (ej: "5400.22")
      // No hace falta modificar
      const num = parseFloat(clean) || 0;
      return `$${num.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // Si es número
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

        {/* EFECTIVO */}
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
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Billete/Moneda</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Cantidad</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resumenData.bills.map((bill, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{bill.label}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#333' }}>{bill.cantidad}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#333' }}>{formatCurrency(bill.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CompactCard>

        {/* MEDIOS DE PAGO */}
        <CompactCard title="Medios de Pago" icon={<Payment />} noPadding>
          {/* ...eliminado encabezado duplicado... */}
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
                    {formatCurrency(medio.facturadoVal ?? medio.facturado)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#555' }}>
                    {formatCurrency(medio.cobradoVal ?? medio.cobrado)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontSize: '0.7rem', 
                    fontFamily: 'monospace',
                    color: medio.differenceVal > 0 ? '#388e3c' : medio.differenceVal < 0 ? '#d32f2f' : '#666',
                    fontWeight: medio.differenceVal !== 0 ? 'bold' : 'normal'
                  }}>
                    {formatCurrency(medio.differenceVal ?? medio.difference)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Mostrar totales solo si vienen de CierreCaja */}
              {resumenData.granTotalMedios && (
                <TableRow sx={{ borderTop: '1px solid #e0e0e0', fontWeight: 'bold' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>TOTAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', fontFamily: 'monospace', color: '#333' }}>
                    {formatCurrency(resumenData.granTotalMedios)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', fontFamily: 'monospace', color: '#333' }}>
                    {formatCurrency(resumenData.granTotalMediosCobrado ?? resumenData.granTotalMedios)}
                  </TableCell>
                  <TableCell align="right" sx={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.7rem', 
                    fontFamily: 'monospace',
                    color: '#333'
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
                <Table size="small" sx={{ minWidth: 400, '& .MuiTableCell-root': { py: 0.2, px: 0.5 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Usuario</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Orden</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Medio de Pago</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Motivo</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Ajuste</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resumenData.justificaciones.map((just, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{just.fecha}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{just.usuario}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{just.cliente}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{just.orden}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{just.medio_pago}</TableCell>
                        <TableCell sx={{ fontSize: '0.7rem', color: '#333' }}>{just.motivo}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#333' }}>{formatCurrency(just.ajuste)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>Total Ajustes</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#333' }}>{formatCurrency(totalJustificaciones)}</TableCell>
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
