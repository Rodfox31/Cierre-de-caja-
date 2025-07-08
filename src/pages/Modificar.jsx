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
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Modificar({ cierre, onClose, onSave }) {
  const [form, setForm] = useState({ ...cierre });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (!form) return null;

  return (
    <Paper sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h5" gutterBottom>Modificar Cierre</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Fecha"
            name="fecha"
            type="date"
            value={form.fecha || ''}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Tienda"
            name="tienda"
            value={form.tienda || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Usuario"
            name="usuario"
            value={form.usuario || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Total Billetes"
            name="total_billetes"
            type="number"
            value={form.total_billetes || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Final Balance"
            name="final_balance"
            type="number"
            value={form.final_balance || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Brinks Total"
            name="brinks_total"
            type="number"
            value={form.brinks_total || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Gran Diferencia Total"
            name="grand_difference_total"
            type="number"
            value={form.grand_difference_total || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Balance sin Justificar"
            name="balance_sin_justificar"
            type="number"
            value={form.balance_sin_justificar || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Responsable"
            name="responsable"
            value={form.responsable || ''}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Comentarios"
            name="comentarios"
            value={form.comentarios || ''}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
            sx={{ mb: 2 }}
          />
        </Grid>
        {/* Puedes agregar aquí más campos según la estructura de tu cierre */}
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose} color="primary" variant="outlined" disabled={loading}>
          Cerrar sin guardar
        </Button>
        <Button onClick={handleGuardar} color="success" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Cerrar y guardar'}
        </Button>
      </Box>
    </Paper>
  );
}
