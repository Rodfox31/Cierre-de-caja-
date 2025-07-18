import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { axiosWithFallback } from '../config';
import moment from 'moment';

export default function Modificar({ cierre, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({ motivos_error_pago: [] });
  const [justificaciones, setJustificaciones] = useState([]);
  const [totales, setTotales] = useState({
    totalFacturado: 0,
    totalCobrado: 0,
    diferenciaTotal: 0,
    totalAjustes: 0,
    balanceFinal: 0,
  });

  // carga init
  useEffect(() => {
    axiosWithFallback('/localStorage').then(res => setConfig(res.data)).catch(() => {});
    if (!cierre?.id) return;
    setLoading(true);
    axiosWithFallback(`/api/cierres-completo/${cierre.id}`)
      .then(res => {
        const d = res.data;
        let medios = [];
        if (d.medios_pago) {
          if (typeof d.medios_pago === 'string') medios = JSON.parse(d.medios_pago);
          else if (Array.isArray(d.medios_pago)) medios = d.medios_pago;
          else medios = Object.entries(d.medios_pago).map(([m, v]) => ({
            medio: m,
            facturado: v.facturado || 0,
            cobrado: v.cobrado || 0,
            differenceVal: v.differenceVal || 0,
          }));
        }
        medios = medios.map(mp => ({
          ...mp,
          facturado: +mp.facturado || 0,
          cobrado: +mp.cobrado || 0,
          differenceVal: +mp.differenceVal || 0,
        }));
        let fecha = d.fecha;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
          fecha = moment(fecha, 'DD/MM/YYYY').format('YYYY-MM-DD');
        }
        setForm({ ...d, medios_pago: medios, fecha });
        const js = (d.justificaciones || []).filter(j =>
          j && (j.motivo || j.ajuste || j.monto_dif || j.orden || j.cliente)
        );
        setJustificaciones(js);
      })
      .catch(err => setError('No se pudo cargar: ' + err.message))
      .finally(() => setLoading(false));
  }, [cierre]);

  // calcula totales
  useEffect(() => {
    const m = form.medios_pago || [];
    const totalFacturado = m.reduce((s, x) => s + x.facturado, 0);
    const totalCobrado = m.reduce((s, x) => s + x.cobrado, 0);
    const diferenciaTotal = totalCobrado - totalFacturado;
    const totalAjustes = justificaciones.reduce((s, j) => s + (+j.ajuste || 0), 0);
    setTotales({
      totalFacturado,
      totalCobrado,
      diferenciaTotal,
      totalAjustes,
      balanceFinal: diferenciaTotal - totalAjustes,
    });
  }, [form.medios_pago, justificaciones]);

  const handleChange = useCallback(e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const handleMedioChange = useCallback((i, field, value) => {
    setForm(f => {
      const list = [...(f.medios_pago || [])];
      list[i] = { ...list[i], [field]: +value || 0 };
      list[i].differenceVal = list[i].cobrado - list[i].facturado;
      return { ...f, medios_pago: list };
    });
  }, []);

  const handleJustChange = useCallback((i, field, value) => {
    setJustificaciones(js => {
      const arr = [...js];
      arr[i] = { ...arr[i], [field]: value };
      return arr;
    });
  }, []);

  const addJust = useCallback(() => {
    setJustificaciones(js => [
      ...js,
      { cierre_id: form.id, fecha: form.fecha, orden: '', cliente: '', monto_dif: 0, ajuste: 0, motivo: '' },
    ]);
  }, [form]);

  const delJust = useCallback(
    async i => {
      const j = justificaciones[i];
      if (window.confirm('¿Eliminar justificación?')) {
        if (j.id) {
          try {
            await axiosWithFallback(`/api/justificaciones/${j.id}`, { method: 'DELETE' });
          } catch {}
        }
        setJustificaciones(js => js.filter((_, idx) => idx !== i));
      }
    },
    [justificaciones]
  );
  const handleSave = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cleanJs = justificaciones.filter(
        j => j.motivo || j.ajuste || j.monto_dif || j.orden || j.cliente
      );
      const fechaEnv = moment(form.fecha, 'YYYY-MM-DD').format('DD/MM/YYYY');
      const payload = {
        ...form,
        medios_pago: JSON.stringify(form.medios_pago),
        grand_difference_total: totales.diferenciaTotal,
        balance_sin_justificar: totales.balanceFinal,
        fecha: fechaEnv,
      };
      
      // Guardar cierre
      await axiosWithFallback(`/api/cierres-completo/${form.id}`, { method: 'PUT', data: payload });
      
      // Guardar justificaciones
      for (const j of cleanJs) {
        const jData = { ...j, fecha: fechaEnv };
        try {
          if (j.id) {
            await axiosWithFallback(`/api/justificaciones/${j.id}`, { method: 'PUT', data: jData });
          } else {
            await axiosWithFallback(`/api/justificaciones`, {
              method: 'POST',
              data: { ...jData, cierre_id: form.id },
            });
          }
        } catch (justError) {
          console.error('Error en justificación:', justError);
          // Continuar con las demás justificaciones
        }
      }
      
      // Callback de éxito
      onSave?.({
        ...form,
        fecha: fechaEnv,
        medios_pago: form.medios_pago,
        grand_difference_total: totales.diferenciaTotal,
        balance_sin_justificar: totales.balanceFinal,
      });
      
      // Cerrar automáticamente
      onClose?.();
      
    } catch (e) {
      setError('Error al guardar: ' + (e.response?.data?.error || e.message || e));
    } finally {
      setLoading(false);
    }
  }, [form, justificaciones, totales, onSave, onClose]);

  const formatMoney = v =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v || 0);

  // loader
  if (loading && !form.id) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          bgcolor: '#121214',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }
  return (    <Box
      sx={{
        width: '70vw',
        maxWidth: 1000,
        mx: 'auto',
        p: 1.5,
        height: '100vh',
        overflow: 'auto',
        bgcolor: '#121214',
        color: '#E0E0E0',
      }}
    >
      <Typography variant="h5" align="center" sx={{ mb: 1.5, fontWeight: 600 }}>
        Modificar Cierre #{form.id}
      </Typography>      <Paper elevation={1} sx={{ p: 1, mb: 1.5, bgcolor: '#1E1E1E', borderRadius: 2 }}>
        <Grid container spacing={1}>
          {[
            ['Fecha', form.fecha ? moment(form.fecha).format('DD/MM/YYYY') : '-'],
            ['Usuario', form.usuario || '-'],
            ['Responsable', form.responsable || '-'],
            ['Balance Final', formatMoney(totales.balanceFinal)],
            ['Diferencia', formatMoney(totales.diferenciaTotal)],
            ['Ajustes', formatMoney(totales.totalAjustes)],
          ].map(([label, value], idx) => (
            <Grid item xs={6} sm={4} key={idx}>
              <Typography variant="caption" sx={{ color: '#A0A0A0', fontSize: '0.7rem' }}>
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{value}</Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>      <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>
        Medios de Pago
      </Typography>
      <Box sx={{ display: 'grid', gap: 1, mb: 1.5 }}>
        {(form.medios_pago || []).map((m, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 1.5,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              bgcolor: '#1E1E1E',
              borderRadius: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{m.medio}</Typography>
            </Box>            <TextField
              label="Facturado"
              type="number"
              value={m.facturado || ''}
              onChange={e => handleMedioChange(i, 'facturado', e.target.value)}
              variant="filled"
              size="small"
              sx={{
                width: 120,
                bgcolor: '#2A2A2A',
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <TextField
              label="Cobrado"
              type="number"
              value={m.cobrado || ''}
              onChange={e => handleMedioChange(i, 'cobrado', e.target.value)}
              variant="filled"
              size="small"
              sx={{
                width: 120,
                bgcolor: '#2A2A2A',
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <Box sx={{ width: 100, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#A0A0A0', fontSize: '0.7rem' }}>
                Diferencia
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{formatMoney(m.differenceVal)}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1, fontSize: '1rem' }}>
          Justificaciones
        </Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          variant="outlined"
          onClick={addJust}
          sx={{ borderRadius: 2, borderColor: '#444', fontSize: '0.8rem' }}
        >
          Nueva
        </Button>
      </Box>
      {justificaciones.length === 0 && (
        <Typography color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
          No hay justificaciones registradas
        </Typography>
      )}
      <Box sx={{ display: 'grid', gap: 1, mb: 1.5 }}>
        {justificaciones.map((j, i) => (
          <Paper
            key={i}
            elevation={0}
            sx={{
              p: 1.5,
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              bgcolor: '#1E1E1E',
              borderRadius: 2,
            }}
          >
            <IconButton
              onClick={() => delJust(i)}
              sx={{ color: '#f44336', p: 0.5 }}
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>            <TextField
              label="Orden"
              value={j.orden || ''}
              onChange={e => handleJustChange(i, 'orden', e.target.value)}
              variant="filled"
              size="small"
              sx={{ 
                width: 80, 
                bgcolor: '#2A2A2A', 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <TextField
              label="Cliente"
              value={j.cliente || ''}
              onChange={e => handleJustChange(i, 'cliente', e.target.value)}
              variant="filled"
              size="small"
              sx={{ 
                width: 120, 
                bgcolor: '#2A2A2A', 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <TextField
              label="Ajuste"
              type="number"
              value={j.ajuste || ''}
              onChange={e => handleJustChange(i, 'ajuste', e.target.value)}
              variant="filled"
              size="small"
              sx={{ 
                width: 80, 
                bgcolor: '#2A2A2A', 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            />
            <FormControl 
              variant="filled" 
              size="small" 
              sx={{ 
                flex: 1, 
                bgcolor: '#2A2A2A', 
                borderRadius: 1,
                '& .MuiInputBase-input': { height: '16px' },
              }}
            >
              <InputLabel sx={{ color: '#A0A0A0' }}>Motivo</InputLabel>
              <Select
                value={j.motivo || ''}
                onChange={e => handleJustChange(i, 'motivo', e.target.value)}
                sx={{ 
                  color: '#E0E0E0',
                  '& .MuiSelect-select': { height: '16px' },
                }}
              >
                {config.motivos_error_pago?.map((motivo, idx) => (
                  <MenuItem key={idx} value={motivo} sx={{ fontSize: '0.8rem' }}>
                    {motivo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        ))}
      </Box>      <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1rem' }}>
        Comentarios
      </Typography>
      <TextField
        name="comentarios"
        value={form.comentarios || ''}
        onChange={handleChange}
        variant="filled"
        multiline
        rows={2}
        fullWidth
        sx={{ 
          mb: 2, 
          bgcolor: '#2A2A2A', 
          borderRadius: 2,
          '& .MuiInputBase-input': { fontSize: '0.9rem' },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ color: '#bbb', borderRadius: 2, fontSize: '0.9rem' }}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} sx={{ borderRadius: 2, fontSize: '0.9rem' }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
