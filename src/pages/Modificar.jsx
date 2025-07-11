import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Modificar({ cierre, onClose, onSave }) {
  const [form, setForm] = useState({ ...cierre });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Nuevo: cargar datos frescos desde el backend al montar o cambiar id
  useEffect(() => {
    if (!cierre?.id) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/cierres-completo/${cierre.id}`);
        setForm({ ...data });
      } catch (err) {
        setError('No se pudo cargar el cierre actualizado.');
      } finally {
        setLoading(false);
      }
    })();
  }, [cierre?.id]);

  useEffect(() => {
    setForm({ ...cierre });
  }, [cierre]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.put(`${API_BASE_URL}/api/cierres-completo/${form.id}`, form);
      if (onSave) onSave(form);
      if (onClose) onClose();
    } catch (err) {
      setError('Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de arrays (billetes, brinks, medios de pago, justificaciones)
  const handleArrayChange = (section, idx, field, value) => {
    setForm((prev) => {
      const arr = [...(prev[section] || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [section]: arr };
    });
  };

  // Parsear arrays si vienen como string
  let billetes = [];
  try { billetes = typeof form.billetes === 'string' ? JSON.parse(form.billetes) : (form.billetes || []); } catch { billetes = []; }
  let brinks = [];
  try { brinks = typeof form.brinks === 'string' ? JSON.parse(form.brinks) : (form.brinks || []); } catch { brinks = []; }
  let medios_pago = [];
  try { medios_pago = typeof form.medios_pago === 'string' ? JSON.parse(form.medios_pago) : (form.medios_pago || []); } catch { medios_pago = []; }
  let justificaciones = [];
  try { justificaciones = typeof form.justificaciones === 'string' ? JSON.parse(form.justificaciones) : (form.justificaciones || []); } catch { justificaciones = []; }

  // Recibe props para tiendas y usuarios si es necesario
  // Si no, puedes definirlos aquí como ejemplo:
  const tiendas = form.tiendas || [];
  const usuarios = form.usuarios || [];

  return (
    <Paper sx={{
      p: 3,
      maxWidth: 'none',
      width: '100%',
      minWidth: { xs: '95vw', sm: 900 },
      minHeight: '80vh',
      maxHeight: '90vh',
      margin: '0 auto',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      bgcolor: 'background.paper',
    }}>
      <Typography variant="h5" gutterBottom>Modificar Cierre</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* DATOS PRINCIPALES */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Datos principales</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          {/* Solo lectura visual, sin recuadro, dark mode */}
          <Typography variant="body1" sx={{ py: 2, px: 1, border: '1px solid #333', borderRadius: 1, bgcolor: 'grey.900', color: 'grey.100' }}>
            <b>Fecha:</b> {typeof form.fecha === 'object' && form.fecha !== null
              ? (form.fecha.format ? form.fecha.format('YYYY-MM-DD') : (form.fecha.toISOString ? form.fecha.toISOString().slice(0,10) : JSON.stringify(form.fecha)))
              : (form.fecha || '')}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select label="Tienda" name="tienda" value={form.tienda || ''} onChange={handleChange} fullWidth>
            {tiendas.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField select label="Usuario" name="usuario" value={form.usuario || ''} onChange={handleChange} fullWidth>
            {usuarios.map((u) => (
              <MenuItem key={u} value={u}>{u}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* DETALLE DE EFECTIVO */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Detalle de Efectivo</Typography>
      <Stack spacing={1}>
        {billetes.map((b, idx) => (
          <Grid container spacing={1} key={idx}>
            <Grid item xs={4}>
              <TextField label="Denominación" value={b.label || ''} onChange={e => handleArrayChange('billetes', idx, 'label', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Cantidad" type="number" value={b.cantidad || ''} onChange={e => handleArrayChange('billetes', idx, 'cantidad', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Total" type="number" value={b.total || ''} onChange={e => handleArrayChange('billetes', idx, 'total', e.target.value)} fullWidth />
            </Grid>
          </Grid>
        ))}
      </Stack>

      {/* DEPÓSITOS BRINKS */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Depósitos Brinks</Typography>
      <Stack spacing={1}>
        {brinks.map((b, idx) => (
          <Grid container spacing={1} key={idx}>
            <Grid item xs={6}>
              <TextField label="Código" value={b.codigo || ''} onChange={e => handleArrayChange('brinks', idx, 'codigo', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Monto" type="number" value={b.monto || ''} onChange={e => handleArrayChange('brinks', idx, 'monto', e.target.value)} fullWidth />
            </Grid>
          </Grid>
        ))}
      </Stack>

      {/* MEDIOS DE PAGO */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Medios de Pago</Typography>
      <Stack spacing={1}>
        {medios_pago.map((m, idx) => (
          <Grid container spacing={1} key={idx}>
            <Grid item xs={3}>
              {/* Solo lectura visual, dark mode, fondo transparente */}
              <Typography variant="body2" sx={{ py: 1, px: 1, border: '1px solid #333', borderRadius: 1, bgcolor: 'transparent', color: 'grey.100' }}>
                {m.medio || ''}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField label="Facturado" value={m.facturado || ''} onChange={e => handleArrayChange('medios_pago', idx, 'facturado', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={3}>
              <TextField label="Cobrado" value={m.cobrado || ''} onChange={e => handleArrayChange('medios_pago', idx, 'cobrado', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={3}>
              {/* Solo lectura visual, dark mode, fondo transparente */}
              <Typography variant="body2" sx={{ py: 1, px: 1, border: '1px solid #333', borderRadius: 1, bgcolor: 'transparent', color: 'grey.100', textAlign: 'right' }}>
                {m.difference || ''}
              </Typography>
            </Grid>
          </Grid>
        ))}
      </Stack>

      {/* JUSTIFICACIONES Y CAMPOS FINALES A LA DERECHA */}
      <Divider sx={{ my: 2 }} />
      <Grid container spacing={2}>
        {/* IZQUIERDA: Detalle de Efectivo, Brinks, Medios de Pago */}
        <Grid item xs={12} md={7}>
          {/* Todo el contenido de la izquierda ya está arriba, así que aquí no va nada */}
        </Grid>
        {/* DERECHA: Justificaciones, Responsable, Comentarios, Botones */}
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Justificaciones</Typography>
          <Stack spacing={1}>
            {justificaciones.map((j, idx) => (
              <Grid container spacing={1} key={idx}>
                <Grid item xs={2}>
                  <TextField label="Fecha" value={j.fecha || ''} onChange={e => handleArrayChange('justificaciones', idx, 'fecha', e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Orden" value={j.orden || ''} onChange={e => handleArrayChange('justificaciones', idx, 'orden', e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Cliente" value={j.cliente || ''} onChange={e => handleArrayChange('justificaciones', idx, 'cliente', e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Monto Dif." value={j.monto_dif || ''} onChange={e => handleArrayChange('justificaciones', idx, 'monto_dif', e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Ajuste" value={j.ajuste || ''} onChange={e => handleArrayChange('justificaciones', idx, 'ajuste', e.target.value)} fullWidth />
                </Grid>
                <Grid item xs={2}>
                  <TextField label="Motivo" value={j.motivo || ''} onChange={e => handleArrayChange('justificaciones', idx, 'motivo', e.target.value)} fullWidth />
                </Grid>
              </Grid>
            ))}
          </Stack>

          {/* CAMPOS FINALES */}
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Responsable" name="responsable" value={form.responsable || ''} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Comentarios" name="comentarios" value={form.comentarios || ''} onChange={handleChange} fullWidth multiline minRows={2} />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onClose} color="primary" variant="outlined" disabled={loading}>
              Cerrar sin guardar
            </Button>
            <Button onClick={handleGuardar} color="success" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Cerrar y guardar'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
