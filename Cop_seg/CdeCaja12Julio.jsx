import React, { useState, useEffect } from "react";
import Imprimir from "./imprimir"; // Asumo que este componente existe
import { API_BASE_URL } from '../config'; // Asumo que este archivo de config existe
import moment from 'moment';

// --- MUI Imports ---
import {
    Box,
    Paper,
    Grid,
    Stack,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Typography,
    Divider,
    IconButton,
    Container,
    Collapse,
    Alert,
    AlertTitle,
    Chip,
    Card,
    CardContent,
    Fade,
    Slide,
    useTheme,
    alpha,
} from '@mui/material';

// --- MUI Icons ---
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import PrintIcon from '@mui/icons-material/Print';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones auxiliares (Sin cambios)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function formatCurrency(value) {
    return "$ " + value.toLocaleString("es-CL", { minimumFractionDigits: 0 });
}
function parseCurrency(valueStr) {
    if (typeof valueStr === "number") return valueStr;
    try {
        const normalized = String(valueStr).replace(/\./g, "").replace(",", ".");
        return parseFloat(normalized) || 0;
    } catch {
        return 0.0;
    }
}

// Permite sumar expresiones tipo "1000+2000" en facturado
function parseSumExpression(expr) {
  if (typeof expr !== 'string') return 0;
  // Solo permite números, +, . , y espacios
  if (!/^[0-9+.,\s]+$/.test(expr)) return 0;
  return expr
    .split('+')
    .map(s => parseCurrency(s.trim()))
    .reduce((a, b) => a + b, 0);
}

const initialBills = [
    { label: "$ 20.000", value: 20000, cantidad: 0, total: 0 },
    { label: "$ 10.000", value: 10000, cantidad: 0, total: 0 },
    { label: "$ 5.000", value: 5000, cantidad: 0, total: 0 },
    { label: "$ 2.000", value: 2000, cantidad: 0, total: 0 },
    { label: "$ 1.000", value: 1000, cantidad: 0, total: 0 },
    { label: "$ 500", value: 500, cantidad: 0, total: 0 },
    { label: "$ 100", value: 100, cantidad: 0, total: 0 },
    { label: "$ 50", value: 50, cantidad: 0, total: 0 },
    { label: "$ 10", value: 10, cantidad: 0, total: 0 }
];

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bloque 1: HeaderControls – Controles de Encabezado
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function HeaderControls({
    fecha, setFecha, tiendas, selectedTienda, setSelectedTienda,
    usuarios, selectedUsuario, setSelectedUsuario, onCerrarCaja
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    const handleCerrarCajaClick = () => {
        setIsButtonDisabled(true);
        setIsCollapsed(true);
        setTimeout(() => {
            onCerrarCaja();
        }, 400); 
    };

    return (
        <Paper elevation={4} sx={{ borderRadius: 4, mb: 2, overflow: 'hidden', transition: 'all 0.4s ease-in-out' }}>
            <Collapse in={!isCollapsed} timeout={400}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        <TextField
                            label="Fecha"
                            type="date"
                            size="small"
                            value={fecha.toISOString().split("T")[0]}
                            onChange={(e) => setFecha(new Date(e.target.value))}
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Tienda</InputLabel>
                            <Select value={selectedTienda} label="Tienda" onChange={(e) => setSelectedTienda(e.target.value)}>
                                {tiendas?.length > 0 ? (
                                    tiendas.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)
                                ) : <MenuItem value="error" disabled>Error: Sin datos</MenuItem>}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Usuario</InputLabel>
                            <Select value={selectedUsuario} label="Usuario" onChange={(e) => setSelectedUsuario(e.target.value)}>
                                {usuarios?.length > 0 ? (
                                    usuarios.map((u, idx) => <MenuItem key={idx} value={u}>{u}</MenuItem>)
                                ) : <MenuItem value="error" disabled>Error: Sin datos</MenuItem>}
                            </Select>
                        </FormControl>
                    </Stack>
                    <Button variant="contained" onClick={handleCerrarCajaClick} disabled={isButtonDisabled}>
                        Cerrar Caja
                    </Button>
                </Box>
            </Collapse>
            <Collapse in={isCollapsed} timeout={400}>
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <EventIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight="bold">{fecha.toLocaleDateString("es-CL")}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <StorefrontIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight="bold">{selectedTienda}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight="bold">{selectedUsuario}</Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 2: BillsPanel – Panel de Billetes
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BillsPanel({ billEntries, updateRowTotal, finalTotal }) {
    const theme = useTheme();
    return (
        <Card elevation={4} sx={{ borderRadius: 4, width: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`, border: `1px solid ${alpha(theme.palette.success.main, 0.1)}` }}>
            <CardContent sx={{ p: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
                    <AccountBalanceWalletIcon color="success" />
                    <Typography variant="h6" fontWeight="bold" color="success.main">Detalle de Efectivo</Typography>
                </Box>
                <Stack spacing={0.3}>
                    <Grid container spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary', px: 0.2 }}>
                        <Grid item xs={5}><Typography variant="subtitle2" fontWeight="bold">Billete/Moneda</Typography></Grid>
                        <Grid item xs={3}><Typography variant="subtitle2" fontWeight="bold">Cantidad</Typography></Grid>
                        <Grid item xs={4} textAlign="right"><Typography variant="subtitle2" fontWeight="bold">Total</Typography></Grid>
                    </Grid>
                    <Divider />
                    {billEntries.map((bill, index) => (
                        <Fade in={true} timeout={300 + index * 50} key={index}>
                            <Grid container spacing={0.5} sx={{ alignItems: 'center', py: 0.15, px: 0.2, borderRadius: 2, transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.04), transform: 'translateX(2px)' } }}>
                                <Grid item xs={5}><Typography variant="body1" fontWeight="medium">{bill.label}</Typography></Grid>
                                <Grid item xs={3}>
                                    <TextField type="number" size="small" variant="outlined" placeholder="0" value={bill.cantidad || ""} onChange={(e) => updateRowTotal(index, e.target.value)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.95rem', height: 32, '&:hover fieldset': { borderColor: theme.palette.success.main } } }} inputProps={{ min: 0, 'aria-label': `Cantidad de ${bill.label}` }} />
                                </Grid>
                                <Grid item xs={4} textAlign="right">
                                    <Typography variant="body1" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: bill.total > 0 ? 'bold' : 'normal', color: bill.total > 0 ? 'success.main' : 'text.secondary' }}>{bill.total ? formatCurrency(bill.total) : "$  -"}</Typography>
                                </Grid>
                            </Grid>
                        </Fade>
                    ))}
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.2, py: 0.2, borderRadius: 2, backgroundColor: alpha(theme.palette.warning.main, 0.04) }}>
                        <Typography variant="body1" fontWeight="bold">Fondo de caja:</Typography>
                        <Typography variant="body1" fontWeight="bold" color="warning.main">{formatCurrency(-10000)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.2, py: 0.5, borderRadius: 2, background: `linear-gradient(45deg, ${alpha(theme.palette.success.main, 0.1)} 30%, ${alpha(theme.palette.success.main, 0.05)} 90%)`, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoneyIcon color="success" />
                            <Typography variant="h6" fontWeight="bold" color="success.main">Cash Total:</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="success.main">{formatCurrency(finalTotal)}</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 2.1: BrinksPanel – Panel de Brinks
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BrinksPanel({ brinksEntries, setBrinksEntries, onTotalChange }) {
    const total = brinksEntries.reduce((acc, entry) => acc + (parseFloat(entry.monto) || 0), 0);

    useEffect(() => {
        if (onTotalChange) onTotalChange(total);
    }, [total, onTotalChange]);

    const updateBrinksRow = (index, field, value) => {
        const newEntries = [...brinksEntries];
        newEntries[index][field] = field === "monto" ? (parseFloat(value) || 0) : value;
        setBrinksEntries(newEntries);
    };

    const addNewRow = () => setBrinksEntries([...brinksEntries, { codigo: "", monto: 0 }]);

    const theme = useTheme();
    return (
        <Card elevation={4} sx={{ borderRadius: 4, width: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`, border: `1px solid ${alpha(theme.palette.info.main, 0.12)}` }}>
            <CardContent sx={{ p: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
                    <AssignmentIcon color="info" />
                    <Typography variant="h6" fontWeight="bold" color="info.main">Depósitos (Brinks)</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton onClick={addNewRow} color="info" title="Agregar nueva fila" aria-label="Agregar nueva fila">
                        <AddCircleOutlineIcon />
                    </IconButton>
                </Box>
                <Stack spacing={0.3}>
                    <Grid container spacing={0.5} sx={{ color: 'text.secondary', px: 0.2 }}>
                        <Grid item xs={7}><Typography variant="subtitle2" fontWeight="bold">Código</Typography></Grid>
                        <Grid item xs={5}><Typography variant="subtitle2" fontWeight="bold">Monto</Typography></Grid>
                    </Grid>
                    <Divider />
                    {brinksEntries.map((entry, idx) => (
                        <Fade in={true} timeout={300 + idx * 50} key={idx}>
                            <Grid container spacing={0.5} alignItems="center" sx={{ py: 0.15, px: 0.2, borderRadius: 2, transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.04), transform: 'translateX(2px)' } }}>
                                <Grid item xs={7} sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                    <TextField fullWidth size="small" placeholder="Código de depósito" value={entry.codigo || ""} onChange={(e) => updateBrinksRow(idx, "codigo", e.target.value)} inputProps={{ style: { textAlign: 'left', fontSize: '0.95rem', height: 32 }, 'aria-label': `Código depósito ${idx+1}` }} sx={{ ml: '-8px' }} />
                                </Grid>
                                <Grid item xs={5} sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                    <TextField fullWidth size="small" type="number" placeholder="0" value={entry.monto || ""} onChange={(e) => updateBrinksRow(idx, "monto", e.target.value)} inputProps={{ style: { textAlign: 'left', fontSize: '0.95rem', height: 32 }, min: 0, 'aria-label': `Monto depósito ${idx+1}` }} sx={{ ml: '-8px' }} />
                                </Grid>
                            </Grid>
                        </Fade>
                    ))}
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.2, py: 0.5, borderRadius: 2, background: `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.08)} 30%, ${alpha(theme.palette.info.main, 0.03)} 90%)`, border: `1px solid ${alpha(theme.palette.info.main, 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon color="info" />
                            <Typography variant="h6" fontWeight="bold" color="info.main">Total Depósitos:</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="info.main">{formatCurrency(total)}</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 3: PaymentMethodsPanel
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function PaymentMethodsPanel({ medios_pago, paymentEntries, setPaymentEntries, dynamicEfectivo }) {

    useEffect(() => {
        if ((!paymentEntries || paymentEntries.length === 0) && medios_pago && medios_pago.length > 0) {
            const initialEntries = medios_pago.map((medio, index) => ({
                medio,
                facturado: index === 0 ? dynamicEfectivo.toString() : "",
                cobrado: "",
                difference: "$  -",
                differenceVal: 0,
            }));
            setPaymentEntries(initialEntries);
        }
    }, [medios_pago, paymentEntries, setPaymentEntries, dynamicEfectivo]);
    
    const updatePaymentRow = (index, field, value) => {
        const newEntries = [...paymentEntries];
        newEntries[index][field] = value;
        // Usar parseSumExpression en todas las filas
        const facturadoVal = parseSumExpression(newEntries[index].facturado || '0');
        const cobradoVal = parseCurrency(newEntries[index].cobrado || '0');
        const diff = facturadoVal - cobradoVal;
        newEntries[index].differenceVal = diff;
        newEntries[index].difference = diff ? formatCurrency(diff) : "$  -";
        setPaymentEntries(newEntries);
    };

    useEffect(() => {
        if (paymentEntries.length > 0) {
            const newEntries = [...paymentEntries];
            newEntries[0].facturado = dynamicEfectivo.toString();
            const facturadoVal = parseCurrency(dynamicEfectivo.toString());
            const cobradoVal = parseCurrency(newEntries[0].cobrado || "0");
            const diff = facturadoVal - cobradoVal;
            newEntries[0].differenceVal = diff;
            newEntries[0].difference = diff ? formatCurrency(diff) : "$  -";
            setPaymentEntries(newEntries);
        }
    }, [dynamicEfectivo, paymentEntries.length]);

    const getGrandTotal = () => paymentEntries.reduce((acc, row) => acc + (row.differenceVal || 0), 0);
    const grandTotal = getGrandTotal();

    const theme = useTheme();
    return(
        <Card elevation={4} sx={{ borderRadius: 4, width: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
            <CardContent sx={{ p: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
                    <CreditCardIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold" color="primary.main">Medios de Pago</Typography>
                </Box>
                <Stack spacing={1}>
                    <Grid container spacing={0.5} sx={{ color: 'text.secondary', px: 0.2, mb: 0.5 }}>
                        <Grid item xs={4}><Typography variant="subtitle2" fontWeight="bold">Medio</Typography></Grid>
                        <Grid item xs={2.5}><Typography variant="subtitle2" fontWeight="bold">Cobrado (Real)</Typography></Grid>
                        <Grid item xs={2.5}><Typography variant="subtitle2" fontWeight="bold">Facturado (Sieben)</Typography></Grid>
                        <Grid item xs={3} textAlign="right"><Typography variant="subtitle2" fontWeight="bold">Diferencia</Typography></Grid>
                    </Grid>
                    <Divider />
                    {(!medios_pago || medios_pago.length === 0) ? (
                        <Typography color="error">Error: Sin datos de medios de pago</Typography>
                    ) : (
                        paymentEntries.map((entry, idx) => (
                            <Grid container spacing={0.5} alignItems="center" sx={{ py: 0.3, px: 0.2, borderRadius: 2, mb: 0.2 }} key={idx}>
                                <Grid item xs={4}><Typography variant="body1">{entry.medio}</Typography></Grid>
                                <Grid item xs={2.5}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Facturado"
                                        value={entry.facturado}
                                        onChange={(e) => updatePaymentRow(idx, "facturado", e.target.value)}
                                        sx={{ fontSize: '0.95rem', height: 32 }}
                                        InputProps={{
                                            readOnly: idx === 0,
                                            sx: { fontSize: '0.95rem', height: 32 }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2.5}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Cobrado"
                                        value={entry.cobrado}
                                        onChange={(e) => updatePaymentRow(idx, "cobrado", e.target.value)}
                                        sx={{ fontSize: '0.95rem', height: 32 }}
                                        InputProps={{ sx: { fontSize: '0.95rem', height: 32 } }}
                                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9.,]/g, "")}
                                    />
                                </Grid>
                                <Grid item xs={3} textAlign="right">
                                    <Typography variant="body1" sx={{ 
                                        color: entry.differenceVal === 0 ? 'text.disabled' : (entry.differenceVal > 0 ? 'success.main' : 'error.main'),
                                        fontWeight: entry.differenceVal !== 0 ? 'bold' : 'regular',
                                        fontVariantNumeric: 'tabular-nums'
                                    }}>
                                        {entry.difference}
                                    </Typography>
                                </Grid>
                            </Grid>
                        ))
                    )}
                    <Divider sx={{ my: 1.2 }}/>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.2, py: 0.5, borderRadius: 2, background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.08)} 30%, ${alpha(theme.palette.primary.main, 0.03)} 90%)`, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUpIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold" color="primary.main">Diferencia Total:</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color={grandTotal === 0 ? 'text.primary' : (grandTotal > 0 ? 'success.main' : 'error.main')}>
                            {formatCurrency(grandTotal)}
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 4.1: JustificacionesPanel
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function JustificacionesPanel({ paymentEntries, ajustesMotivos, fecha, onSumChange, onJustificacionesChange }) {
    const rowsWithDifference = paymentEntries.filter((row) => Math.abs(row.differenceVal) > 0.01);
    const [justificaciones, setJustificaciones] = useState([]);

    // Nueva justificación manual
    const [nuevaJustificacion, setNuevaJustificacion] = useState({
        fecha: fecha.toLocaleDateString("es-CL"),
        orden: "",
        cliente: "",
        medio_pago: "",
        monto_dif: "",
        ajuste: 0,
        motivo: ajustesMotivos && ajustesMotivos.length > 0 ? ajustesMotivos[0] : ""
    });

    useEffect(() => {
        const initialJustificaciones = rowsWithDifference.map(row => ({
            fecha: fecha.toLocaleDateString("es-CL"),
            orden: "", cliente: "",
            medio_pago: row.medio,
            monto_dif: row.difference || "0",
            ajuste: 0,
            motivo: ajustesMotivos && ajustesMotivos.length > 0 ? ajustesMotivos[0] : ""
        }));
        setJustificaciones(initialJustificaciones);
    }, [paymentEntries, ajustesMotivos, fecha]);

    const updateJustificacion = (index, field, value) => {
        const newJustificaciones = [...justificaciones];
        newJustificaciones[index][field] = field === "ajuste" ? parseFloat(value) || 0 : value;
        setJustificaciones(newJustificaciones);
    };

    // Nueva función para agregar justificación manual
    const agregarJustificacionManual = () => {
        setJustificaciones([...justificaciones, { ...nuevaJustificacion }]);
        setNuevaJustificacion({
            fecha: fecha.toLocaleDateString("es-CL"),
            orden: "",
            cliente: "",
            medio_pago: "",
            monto_dif: "",
            ajuste: 0,
            motivo: ajustesMotivos && ajustesMotivos.length > 0 ? ajustesMotivos[0] : ""
        });
    };

    useEffect(() => {
        // Suma todos los ajustes, incluyendo los manuales
        const sum = justificaciones.reduce((acc, j) => acc + (parseFloat(j.ajuste) || 0), 0);
        if (typeof onSumChange === 'function') onSumChange(sum);
        if (typeof onJustificacionesChange === 'function') onJustificacionesChange(justificaciones);
    }, [justificaciones, onSumChange, onJustificacionesChange]);

    const theme = useTheme();
    return (
        <Card elevation={4} sx={{ borderRadius: 4, width: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`, border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}` }}>
            <CardContent sx={{ p: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
                    <ReceiptIcon color="warning" />
                    <Typography variant="h6" fontWeight="bold" color="warning.main">Justificaciones de Diferencias</Typography>
                </Box>
                {rowsWithDifference.length > 0 || justificaciones.length > 0 ? (
                    <Stack spacing={0.7}>
                        <Grid container spacing={0.5} sx={{ color: 'text.secondary', textAlign: 'center', px: 0.2 }}>
                            <Grid item xs={1.5}><Typography variant="caption" fontWeight="bold">N° Orden</Typography></Grid>
                            <Grid item xs={2}><Typography variant="caption" fontWeight="bold">Cliente</Typography></Grid>
                            <Grid item xs={2}><Typography variant="caption" fontWeight="bold">Monto Dif.</Typography></Grid>
                            <Grid item xs={2}><Typography variant="caption" fontWeight="bold">Ajuste</Typography></Grid>
                            <Grid item xs={2.5}><Typography variant="caption" fontWeight="bold">Motivo</Typography></Grid>
                            <Grid item xs={2}><Typography variant="caption" fontWeight="bold">Medio de Pago</Typography></Grid>
                        </Grid>
                        <Divider sx={{ my: 0.3 }} />
                        {justificaciones.map((just, idx) => (
                            <Fade in={true} timeout={300 + idx * 50} key={idx}>
                                <Grid container spacing={0.5} alignItems="center" sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 0.5, minHeight: 0, transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.04), transform: 'translateX(2px)' } }}>
                                    <Grid item xs={12} sx={{ mb: 0.5 }}>
                                        <Typography variant="overline">Diferencia en: <strong>{just.medio_pago}</strong></Typography>
                                    </Grid>
                                    <Grid item xs={1.5}>
                                        <TextField fullWidth size="small" placeholder="Orden" value={just.orden || ""} onChange={(e) => updateJustificacion(idx, "orden", e.target.value)} />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField fullWidth size="small" placeholder="Cliente" value={just.cliente || ""} onChange={(e) => updateJustificacion(idx, "cliente", e.target.value)} />
                                    </Grid>
                                    <Grid item xs={2} textAlign="center">
                                        <TextField fullWidth size="small" placeholder="Monto Dif." value={just.monto_dif || ""} onChange={(e) => updateJustificacion(idx, "monto_dif", e.target.value)} />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <TextField fullWidth size="small" type="number" placeholder="0" value={just.ajuste || ""} onChange={(e) => updateJustificacion(idx, "ajuste", e.target.value)} />
                                    </Grid>
                                    <Grid item xs={2.5}>
                                        <FormControl fullWidth size="small">
                                            <Select value={just.motivo || ""} onChange={(e) => updateJustificacion(idx, "motivo", e.target.value)}>
                                                {ajustesMotivos?.map((motivo, i) => <MenuItem key={i} value={motivo}>{motivo}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <FormControl fullWidth size="small">
                                            <Select value={just.medio_pago || ""} onChange={(e) => updateJustificacion(idx, "medio_pago", e.target.value)}>
                                                <MenuItem value="">Seleccionar</MenuItem>
                                                {paymentEntries?.map((p, i) => <MenuItem key={i} value={p.medio}>{p.medio}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Fade>
                        ))}
                        {/* Línea para agregar nueva justificación manual, más compacta y en una sola línea */}
                        <Box sx={{ width: '100%', mt: 0.5, mb: 0.2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 0.2 }}>Agregar Justificación Manual</Typography>
                        </Box>
                        <Grid container spacing={0.5} alignItems="center" sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 0.3, bgcolor: 'background.paper', minHeight: 0 }}>
                            <Grid item xs={1.5}>
                                <TextField fullWidth size="small" placeholder="Orden" value={nuevaJustificacion.orden} onChange={(e) => setNuevaJustificacion({ ...nuevaJustificacion, orden: e.target.value })} />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField fullWidth size="small" placeholder="Cliente" value={nuevaJustificacion.cliente} onChange={(e) => setNuevaJustificacion({ ...nuevaJustificacion, cliente: e.target.value })} />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField fullWidth size="small" placeholder="Monto Dif." value={nuevaJustificacion.monto_dif} onChange={(e) => setNuevaJustificacion({ ...nuevaJustificacion, monto_dif: e.target.value })} />
                            </Grid>
                            <Grid item xs={2}>
                                <TextField fullWidth size="small" type="number" placeholder="0" value={nuevaJustificacion.ajuste} onChange={(e) => setNuevaJustificacion({ ...nuevaJustificacion, ajuste: e.target.value })} />
                            </Grid>
                            <Grid item xs={2.5}>
                                <FormControl fullWidth size="small">
                                    <Select value={nuevaJustificacion.motivo} onChange={(e) => setNuevaJustificacion({ ...nuevaJustificacion, motivo: e.target.value })}>
                                        {ajustesMotivos?.map((motivo, i) => <MenuItem key={i} value={motivo}>{motivo}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={2}>
                                <FormControl fullWidth size="small">
                                    <Select value={nuevaJustificacion.medio_pago} onChange={(e) => setNuevaJustificacion({ ...nuevaJustificacion, medio_pago: e.target.value })}>
                                        <MenuItem value="">Seleccionar</MenuItem>
                                        {paymentEntries?.map((p, i) => <MenuItem key={i} value={p.medio}>{p.medio}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sx={{ textAlign: 'right', mt: 0 }}>
                                <Button variant="outlined" color="warning" size="small" onClick={agregarJustificacionManual} sx={{ minHeight: 0, py: 0.5 }}>
                                    Agregar Justificación
                                </Button>
                            </Grid>
                        </Grid>
                    </Stack>
                ) : (
                    <Typography sx={{ mt: 2, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                        No hay diferencias que requieran justificación.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}


////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 4.2: FinalizationPanel
////////////////////////////////////////////////////////////////////////////////////////////////
function FinalizationPanel({
    tarjetasTotal, sumJustificaciones, responsable, setResponsable,
    comentarios, setComentarios, onEnviarCierre, onImprimir
}) {
    const balanceSinJustificar = tarjetasTotal - sumJustificaciones;
    const isBalanced = Math.abs(balanceSinJustificar) < 0.01;

    const theme = useTheme();
    return (
        <Card elevation={4} sx={{ borderRadius: 4, minHeight: 0, background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`, border: `1px solid ${alpha(theme.palette.success.main, 0.12)}` }}>
            <CardContent sx={{ p: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1.2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="h6" fontWeight="bold" color="success.main">Finalizar Cierre</Typography>
                </Box>
                <Stack spacing={0.7}>
                    {isBalanced ? (
                        <Alert severity="success" variant="outlined">
                            <AlertTitle>Cierre Cuadrado</AlertTitle>
                            El balance final después de justificaciones es <strong>{formatCurrency(balanceSinJustificar)}</strong>. ¡Excelente trabajo!
                        </Alert>
                    ) : (
                        <Alert severity="warning" variant="outlined">
                            <AlertTitle>Atención Requerida</AlertTitle>
                            Queda un balance sin justificar de <strong>{formatCurrency(balanceSinJustificar)}</strong>. Por favor, revísalo o deja un comentario.
                        </Alert>
                    )}
                    <TextField label="Nombre del responsable del cierre" variant="outlined" fullWidth value={responsable} onChange={(e) => setResponsable(e.target.value)} />
                    <TextField label="Comentarios adicionales (opcional)" variant="outlined" fullWidth multiline rows={3} value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
                    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                        <Button variant="contained" startIcon={<SendIcon />} onClick={onEnviarCierre} size="large">
                            Enviar Cierre
                        </Button>
                        <Button variant="outlined" startIcon={<PrintIcon />} onClick={onImprimir} size="large">
                            Imprimir Resumen
                        </Button>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

async function loadAjustesFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/localStorage`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading ajustes from backend:", error);
        return { tiendas: [], medios_pago: [], asignaciones: {}, motivos_error_pago: [] };
    }
}

function formatFecha(fecha) {
  // Intenta formatear como YYYY-MM-DD, si no es válido, muestra 'Fecha inválida'
  const m = typeof fecha === 'string' ? moment(fecha, 'YYYY-MM-DD', true) : moment(fecha);
  return m.isValid() ? m.format('DD/MM/YYYY') : 'Fecha inválida';
}

////////////////////////////////////////////////////////////////////////////////////////////////
// COMPONENTE PRINCIPAL: CierreCaja
////////////////////////////////////////////////////////////////////////////////////////////////
function CierreCaja() {
    const [fecha, setFecha] = useState(new Date());
    const [tiendas, setTiendas] = useState([]);
    const [asignaciones, setAsignaciones] = useState({});
    const [usuarios, setUsuarios] = useState([]);
    const [selectedTienda, setSelectedTienda] = useState("");
    const [selectedUsuario, setSelectedUsuario] = useState("");
    const [panelVisible, setPanelVisible] = useState(false);
    const [billEntries, setBillEntries] = useState(JSON.parse(JSON.stringify(initialBills)));
    const [totalEfectivo, setTotalEfectivo] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);
    const [brinksEntries, setBrinksEntries] = useState([{ codigo: "", monto: 0 }]);
    const [brinksTotal, setBrinksTotal] = useState(0);
    const [dataAjustes, setDataAjustes] = useState({ tiendas: [], medios_pago: [], asignaciones: {}, motivos_error_pago: [] });
    const [paymentEntries, setPaymentEntries] = useState([]);
    const [sumJustificaciones, setSumJustificaciones] = useState(0);
    const [responsable, setResponsable] = useState("");
    const [comentarios, setComentarios] = useState("");
    const [justificacionesData, setJustificacionesData] = useState([]);
    const [mostrarResumen, setMostrarResumen] = useState(false);
    const [resumenData, setResumenData] = useState(null);

    useEffect(() => {
        async function fetchAjustes() {
            const ajustesData = await loadAjustesFromBackend();
            setDataAjustes(ajustesData);
            setTiendas(ajustesData.tiendas || []);
            setAsignaciones(ajustesData.asignaciones || {});
            if (ajustesData.tiendas && ajustesData.tiendas.length > 0) {
                const firstTienda = ajustesData.tiendas[0];
                setSelectedTienda(firstTienda);
                const usuariosTienda = ajustesData.asignaciones?.[firstTienda]?.map(u => u.usuario) || [];
                setUsuarios(usuariosTienda);
                setSelectedUsuario(usuariosTienda[0] || "");
            }
        }
        fetchAjustes();
    }, []);

    useEffect(() => {
        if (selectedTienda && asignaciones && asignaciones[selectedTienda]) {
            const usuariosTienda = asignaciones[selectedTienda].map(u => u.usuario);
            setUsuarios(usuariosTienda);
            if (!usuariosTienda.includes(selectedUsuario)) {
               setSelectedUsuario(usuariosTienda[0] || "");
            }
        }
    }, [selectedTienda, asignaciones]);

    useEffect(() => {
        const sum = billEntries.reduce((acc, entry) => acc + (entry.total || 0), 0);
        setTotalEfectivo(sum);
        setFinalTotal(sum - 10000); // Fondo de caja
    }, [billEntries]);
    
    useEffect(() => {
        const total = brinksEntries.reduce((acc, row) => acc + (row.monto || 0), 0);
        setBrinksTotal(total);
    }, [brinksEntries]);

    const updateRowTotal = (index, cantidadStr) => {
        const cantidad = parseFloat(cantidadStr) || 0;
        const newEntries = [...billEntries];
        newEntries[index].cantidad = cantidad;
        newEntries[index].total = cantidad * newEntries[index].value;
        setBillEntries(newEntries);
    };

    const togglePanelCierre = async () => {
        const fechaStr = fecha.toLocaleDateString("es-CL");
        try {
            const queryUrl = `${API_BASE_URL}/api/cierres/existe?fecha=${encodeURIComponent(fechaStr)}&tienda=${encodeURIComponent(selectedTienda)}&usuario=${encodeURIComponent(selectedUsuario)}`;
            const response = await fetch(queryUrl);
            if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
            const result = await response.json();
            if (result.existe) {
                alert("Este cierre ya fue completado previamente.");
                return;
            }
            setPanelVisible(!panelVisible);
        } catch (error) {
            console.error("Error al verificar cierre:", error);
            alert("Error al conectar con la base de datos para verificar el cierre.");
        }
    };

    const getGrandPaymentTotal = () => paymentEntries.reduce((acc, row) => acc + (row.differenceVal || 0), 0);
    const dynamicEfectivo = finalTotal + brinksTotal;

    const confirmCierre = async () => {
        const balanceSinJustificar = getGrandPaymentTotal() - sumJustificaciones;
        // Convertir facturado a suma antes de exportar
        const mediosPagoExport = paymentEntries.map(entry => ({
            ...entry,
            facturado: parseSumExpression(entry.facturado || "0")
        }));
        const exportData = {
            fecha: fecha.toLocaleDateString("es-CL"),
            tienda: selectedTienda,
            usuario: selectedUsuario,
            total_billetes: parseFloat(totalEfectivo.toFixed(2)),
            final_balance: parseFloat(finalTotal.toFixed(2)),
            brinks_total: parseFloat(brinksTotal.toFixed(2)),
            medios_pago: JSON.stringify(mediosPagoExport),
            justificaciones: justificacionesData,
            grand_difference_total: parseFloat(getGrandPaymentTotal().toFixed(2)),
            balance_sin_justificar: parseFloat(balanceSinJustificar.toFixed(2)),
            responsable: responsable,
            comentarios: comentarios
        };
        try {
            const response = await fetch(`${API_BASE_URL}/api/cierres-completo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exportData)
            });
            if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
            await response.json();
            alert("Información enviada a la DB correctamente.");
            setPanelVisible(false);
            setBillEntries(JSON.parse(JSON.stringify(initialBills)));
            setBrinksEntries([{ codigo: "", monto: 0 }]);
            setPaymentEntries([]);
            setResponsable("");
            setComentarios("");
        } catch (err) {
            console.error("Error guardando el cierre:", err);
            alert(`Error al enviar cierre: ${err.message}`);
        }
    };

    const handleImprimir = () => {
        const data = {
            fecha: fecha.toLocaleDateString("es-CL"),
            tienda: selectedTienda,
            usuario: selectedUsuario,
            mediosPago: paymentEntries,
            granTotalMedios: formatCurrency(getGrandPaymentTotal()),
            brinks: brinksEntries,
            brinksTotal: formatCurrency(brinksTotal),
            justificaciones: justificacionesData,
            responsable: responsable,
            comentarios: comentarios,
            balanceSinJustificar: formatCurrency(getGrandPaymentTotal() - sumJustificaciones),
        };
        setResumenData(data);
        setMostrarResumen(true);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 2 }}>
            <HeaderControls
                fecha={fecha} setFecha={setFecha}
                tiendas={tiendas} selectedTienda={selectedTienda} setSelectedTienda={setSelectedTienda}
                usuarios={usuarios} selectedUsuario={selectedUsuario} setSelectedUsuario={setSelectedUsuario}
                onCerrarCaja={togglePanelCierre}
            />
            
            <Collapse in={panelVisible} timeout={500}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} md={4} lg={3}>
                        <Stack spacing={2}>
                            <BillsPanel
                                billEntries={billEntries}
                                updateRowTotal={updateRowTotal}
                                finalTotal={finalTotal}
                            />
                            <BrinksPanel
                                brinksEntries={brinksEntries}
                                setBrinksEntries={setBrinksEntries}
                                onTotalChange={setBrinksTotal}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={8} lg={9}>
                        <Stack spacing={2}>
                            <PaymentMethodsPanel
                                medios_pago={dataAjustes.medios_pago}
                                paymentEntries={paymentEntries}
                                setPaymentEntries={setPaymentEntries}
                                dynamicEfectivo={dynamicEfectivo}
                            />
                            <JustificacionesPanel
                                paymentEntries={paymentEntries}
                                ajustesMotivos={dataAjustes.motivos_error_pago}
                                fecha={fecha}
                                onSumChange={setSumJustificaciones}
                                onJustificacionesChange={setJustificacionesData}
                            />
                            <FinalizationPanel
                                tarjetasTotal={getGrandPaymentTotal()}
                                sumJustificaciones={sumJustificaciones}
                                responsable={responsable}
                                setResponsable={setResponsable}
                                comentarios={comentarios}
                                setComentarios={setComentarios}
                                onEnviarCierre={confirmCierre}
                                onImprimir={handleImprimir}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </Collapse>

            {mostrarResumen && (
                <Imprimir
                    open={mostrarResumen}
                    resumenData={resumenData}
                    onClose={() => setMostrarResumen(false)}
                />
            )}
        </Container>
    );
}

export default CierreCaja;