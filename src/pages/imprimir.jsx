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
} from "@mui/material";
import {
  Close,
  Person,
  Store,
  CalendarToday,
  Payment,
  Description,
  AssignmentInd,
  Circle
} from "@mui/icons-material";

const SectionHeader = ({ icon, title, variant = "caption" }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25, gap: 0.5 }}>
      {icon && React.cloneElement(icon, { fontSize: "small", sx: { color: "#000" } })}
      <Typography variant={variant} sx={{ fontWeight: 600, color: "#000", textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </Typography>
    </Box>
  );
};

const InfoItem = ({ label, value, icon = <Circle fontSize="small" />, hideIcon = false }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
      {(!hideIcon && icon) && React.cloneElement(icon, { sx: { color: "#555" } })}
      <Typography variant="caption" sx={{ fontWeight: 500, color: "#000" }}>
        {label}:
      </Typography>
      <Typography variant="caption" sx={{ color: "#555" }}>
        {value}
      </Typography>
    </Box>
  );
};

const DataCard = ({ title, icon, children }) => {
  return (
    <Card sx={{ mb: 1, background: "#fff", boxShadow: "none", borderRadius: '4px', border: "1px solid #ddd" }}>
      <CardContent sx={{ p: 0.5 }}>
        {title && <SectionHeader icon={icon} title={title} variant="caption" />}
        {children}
      </CardContent>
    </Card>
  );
};

function Imprimir({ resumenData = {}, onClose, open }) {

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          background: "#fff",
          // Se han removido las dimensiones fijas para que se imprima igual que en pantalla.
          borderRadius: '4px',
          color: "#000",
          p: 1,
          m: "auto"
        }
      }}
    >
      <DialogTitle sx={{ p: 0.5, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="caption" sx={{ fontWeight: 700, background: "linear-gradient(45deg, #1976d2, #dc004e)", WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Resumen de Cierre
            </Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={onClose} sx={{ color: "#555", p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0.5 }}>
        {/* Bloque 1: Informe Base */}
        <DataCard title="Informe Base" icon={<Store fontSize="small" />}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <InfoItem label="Fecha" value={resumenData.fecha} icon={<CalendarToday fontSize="small" />} />
            <InfoItem label="Tienda" value={resumenData.tienda} icon={<Store fontSize="small" />} />
            <InfoItem label="Usuario" value={resumenData.usuario} icon={<Person fontSize="small" />} />
          </Box>
        </DataCard>

        {/* Bloque 2: Medios de Pago / Brinks y Justificaciones */}
        <Grid container spacing={1}>
          <Grid item xs={12} md={6}>
            <DataCard title="Medios de Pago" icon={<Payment fontSize="small" />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {resumenData.mediosPago?.map((medio, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', p: 0.5, border: "1px solid #ddd", borderRadius: '4px' }}>
                    <Typography variant="caption" sx={{ color: "#000" }}>
                      {medio.medio}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#000", fontWeight: 500 }}>
                      ${medio.cobrado} ({medio.difference})
                    </Typography>
                  </Box>
                ))}
                <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right', display: 'block' }}>
                  Total: {resumenData.granTotalMedios}
                </Typography>
              </Box>
            </DataCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <DataCard title="Brinks" icon={<Description fontSize="small" />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {resumenData.brinks?.map((b, idx) => (
                  <Box key={idx} sx={{ p: 0.5, border: "1px solid #ddd", borderRadius: '4px' }}>
                    <Typography variant="caption" sx={{ color: "#000", fontWeight: 500 }}>
                      #{b.codigo} - ${b.monto}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </DataCard>

            <DataCard title="Justificaciones" icon={<AssignmentInd fontSize="small" />}>
              {resumenData.justificaciones?.length > 0 ? (
                resumenData.justificaciones.map((just, idx) => (
                  <Box key={idx} sx={{ p: 0.5, mb: 0.5, border: "1px solid #ddd", borderRadius: '4px' }}>
                    {/* Primera fila: Orden y Cliente */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <InfoItem label="Orden" value={just.orden} hideIcon />
                      <InfoItem label="Cliente" value={just.cliente} hideIcon />
                    </Box>
                    {/* Segunda fila: Monto Dif. y Motivo */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
                      <InfoItem label="Monto Dif." value={just.monto_dif} hideIcon />
                      <InfoItem label="Motivo" value={just.motivo} hideIcon />
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="caption" sx={{ fontStyle: 'italic', color: "#888", textAlign: 'center', py: 0.5 }}>
                  No se registraron diferencias
                </Typography>
              )}
            </DataCard>
          </Grid>
        </Grid>

        {/* Bloque 3: Cierre Final */}
        <DataCard title="Cierre Final" icon={null}>
          {/* Primero Responsable, luego Balance y finalmente Espacio para firma */}
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#000", fontWeight: 600 }}>
              Responsable: {resumenData.responsable}
            </Typography>
          </Box>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: "#000", fontWeight: 600 }}>
              Balance sin justificar: {resumenData.balanceSinJustificar}
            </Typography>
          </Box>
          <Box sx={{ my: 1, p: 1, border: "1px dashed #aaa", borderRadius: '4px', textAlign: 'center', minHeight: '40px' }}>
            <Typography variant="caption" sx={{ color: "#888" }}>
              Espacio para firma
            </Typography>
          </Box>
        </DataCard>

        {/* Botón de impresión */}
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Button variant="outlined" onClick={handlePrint} size="small" sx={{ p: 0.5 }}>
            Imprimir
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default Imprimir;
