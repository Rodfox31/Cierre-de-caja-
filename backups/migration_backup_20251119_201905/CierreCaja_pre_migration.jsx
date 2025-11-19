import React, { useState, useEffect, useRef } from "react";
import { Calendar } from 'react-date-range';
import { es as dfEs } from 'date-fns/locale';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import Imprimir from "./imprimir"; // Asumo que este componente existe
import { fetchWithFallback } from '../config';
import moment from 'moment';
import { normalizeNumber } from '../utils/numberFormat';

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
    Popover,
    Alert,
    AlertTitle,
    Chip,
    Card,
    CardContent,
    Fade,
    Slide,
    InputAdornment,
    useTheme,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
} from '@mui/material';

// --- MUI Icons ---
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones auxiliares (Sin cambios)
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function formatCurrency(value) {
    return "$ " + value.toLocaleString("es-CL", { minimumFractionDigits: 0 });
}

// Permite sumar expresiones tipo "1000+2000" en facturado
function parseSumExpression(expr) {
  if (typeof expr !== 'string') return 0;
  // Solo permite números, +, . , y espacios
  if (!/^[0-9+.,\s]+$/.test(expr)) return 0;
  return expr
    .split('+')
    .map(s => normalizeNumber(s.trim()))
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
// Componente: CustomDialog - Diálogo personalizado con estilos de la app
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function CustomDialog({ open, onClose, title, message, type = 'info', onConfirm, confirmText = 'Aceptar', showCancel = false }) {
    const theme = useTheme();
    
    const getIconAndColor = () => {
        switch (type) {
            case 'success':
                return { icon: <CheckCircleIcon sx={{ fontSize: 48 }} />, color: theme.palette.success.main };
            case 'warning':
                return { icon: <WarningAmberIcon sx={{ fontSize: 48 }} />, color: theme.palette.warning.main };
            case 'error':
                return { icon: <ErrorOutlineIcon sx={{ fontSize: 48 }} />, color: theme.palette.error.main };
            default:
                return { icon: <InfoIcon sx={{ fontSize: 48 }} />, color: theme.palette.info.main };
        }
    };

    const { icon, color } = getIconAndColor();

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.custom.tableBorder, 0.3)}`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.2)}`,
                }
            }}
        >
            <DialogTitle sx={{ 
                pb: 1,
                pt: 3,
                px: 3
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.05)} 100%)`,
                        border: `2px solid ${alpha(color, 0.3)}`,
                        color: color
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="h6" sx={{ 
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: '1.25rem'
                    }}>
                        {title}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pb: 2 }}>
                <DialogContentText sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    pl: 9
                }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                {showCancel && (
                    <Button 
                        onClick={onClose}
                        variant="outlined"
                        sx={{
                            borderColor: alpha(theme.palette.text.secondary, 0.3),
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                            px: 3,
                            borderRadius: 2,
                            '&:hover': {
                                borderColor: alpha(theme.palette.text.secondary, 0.5),
                                background: alpha(theme.palette.text.secondary, 0.05)
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                )}
                <Button 
                    onClick={() => {
                        if (onConfirm) onConfirm();
                        onClose();
                    }}
                    variant="contained"
                    sx={{
                        background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
                        color: '#fff',
                        fontWeight: 600,
                        px: 3,
                        borderRadius: 2,
                        boxShadow: `0 4px 12px ${alpha(color, 0.3)}`,
                        '&:hover': {
                            background: `linear-gradient(135deg, ${alpha(color, 0.9)} 0%, ${alpha(color, 0.7)} 100%)`,
                            boxShadow: `0 6px 16px ${alpha(color, 0.4)}`
                        }
                    }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bloque 1: HeaderControls – Controles de Encabezado
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function HeaderControls({
    fecha, setFecha, tiendas, selectedTienda, setSelectedTienda,
    usuarios, selectedUsuario, setSelectedUsuario, onCerrarCaja, resetHeader
}) {
    // Buscador de usuario compacto
    const theme = useTheme();
    const dateInputRef = useRef(null);
    const [calOpen, setCalOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorPos, setAnchorPos] = useState(null);
    const [userSearch, setUserSearch] = useState("");
    const filteredUsuarios = usuarios?.filter(u => u.toLowerCase().includes(userSearch.toLowerCase()));
    // Estados para colapso y botón
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    useEffect(() => {
        if (resetHeader) {
            setIsCollapsed(false);
            setIsButtonDisabled(false);
        }
    }, [resetHeader]);

    const handleCerrarCajaClick = () => {
        setIsButtonDisabled(true);
        setIsCollapsed(true);
        setTimeout(() => {
            onCerrarCaja();
        }, 500); // Animación más suave
    };

    return (
        <Box sx={{ position: 'relative', mb: 3 }}>
            <Paper elevation={6} sx={{
                borderRadius: 3,
                mb: 2,
                background: alpha(theme.palette.background.paper, 0.85),
                border: `1px solid ${theme.palette.custom.tableBorder}`,
                boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.15)}`,
                backdropFilter: 'blur(6px)',
                overflow: 'hidden',
            }}>
                <Collapse in={!isCollapsed} timeout={500}>
                    <Box sx={{
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        position: 'relative',
                    }}>
                        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                                <StorefrontIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, letterSpacing: 1 }}>
                                    Cierre de Caja
                                </Typography>
                            </Box>
                            <TextField
                                label="Fecha"
                                size="small"
                                value={moment(fecha).format('DD/MM/YYYY')}
                                onClick={(e) => { setAnchorEl(e.currentTarget); setAnchorPos(null); setCalOpen(true); }}
                                inputRef={dateInputRef}
                                InputProps={{ readOnly: true, sx: { cursor: 'pointer' } }}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    minWidth: 130,
                                    mx: 1,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: alpha(theme.palette.background.default, 0.7),
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: theme.palette.custom.tableBorder },
                                        '&:hover fieldset': { borderColor: theme.palette.primary.main },
                                        '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
                                    },
                                    '& .MuiInputBase-input': { color: theme.palette.text.primary, fontSize: '0.9rem' },
                                    '& .MuiInputLabel-root': { color: theme.palette.primary.main }
                                }}
                            />
                            <FormControl size="small" sx={{ minWidth: 140, mx: 1 }}>
                                <InputLabel sx={{ color: theme.palette.primary.main }}>Tienda</InputLabel>
                                <Select
                                    value={selectedTienda}
                                    label="Tienda"
                                    onChange={(e) => setSelectedTienda(e.target.value)}
                                    sx={{
                                        backgroundColor: alpha(theme.palette.background.default, 0.7),
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.tableBorder },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                                        '& .MuiSelect-select': { color: theme.palette.text.primary },
                                        '& .MuiSvgIcon-root': { color: theme.palette.primary.main }
                                    }}
                                >
                                    {tiendas?.length > 0 ? (
                                        tiendas.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)
                                    ) : <MenuItem value="error" disabled>Error: Sin datos</MenuItem>}
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mx: 1 }}>
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel sx={{ color: theme.palette.primary.main }}>Usuario</InputLabel>
                                    <Select
                                        value={selectedUsuario}
                                        label="Usuario"
                                        onChange={(e) => setSelectedUsuario(e.target.value)}
                                        sx={{
                                            backgroundColor: alpha(theme.palette.background.default, 0.7),
                                            borderRadius: 2,
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.custom.tableBorder },
                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                                            '& .MuiSelect-select': { color: theme.palette.text.primary },
                                            '& .MuiSvgIcon-root': { color: theme.palette.primary.main }
                                        }}
                                    >
                                        {filteredUsuarios?.length > 0 ? (
                                            filteredUsuarios.map((u, idx) => <MenuItem key={idx} value={u}>{u}</MenuItem>)
                                        ) : <MenuItem value="error" disabled>No encontrado</MenuItem>}
                                    </Select>
                                </FormControl>
                                <TextField
                                    placeholder="Buscar usuario"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    size="small"
                                    sx={{
                                        width: 90,
                                        ml: 1,
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: alpha(theme.palette.background.default, 0.7),
                                            borderRadius: 2,
                                            fontSize: '0.85rem',
                                            height: 36,
                                            '& fieldset': { borderColor: theme.palette.custom.tableBorder },
                                            '&:hover fieldset': { borderColor: theme.palette.primary.main },
                                            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
                                        },
                                        '& .MuiInputBase-input': { color: theme.palette.text.primary, fontSize: '0.85rem', py: 0.5 },
                                    }}
                                    inputProps={{ 'aria-label': 'Buscar usuario' }}
                                />
                            </Box>
                        </Stack>
                        <Box sx={{ position: 'absolute', right: 32, top: 24 }}>
                            <Button
                                variant="contained"
                                onClick={handleCerrarCajaClick}
                                disabled={isButtonDisabled}
                                sx={{
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                    color: theme.palette.primary.contrastText,
                                    fontWeight: 700,
                                    px: 2.5,
                                    py: 1,
                                    borderRadius: 2,
                                    fontSize: '0.95rem',
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                                    '&:hover': { background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.85)} 40%, ${theme.palette.primary.dark} 100%)` },
                                    '&:disabled': {
                                        background: theme.palette.action.disabledBackground,
                                        color: theme.palette.text.disabled,
                                    }
                                }}
                                size="medium"
                            >
                                <CheckCircleIcon sx={{ mr: 1 }} /> Cerrar Caja
                            </Button>
                        </Box>
                    </Box>
                </Collapse>
                <Collapse in={isCollapsed} timeout={500}>
                    <Box sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: `1px solid ${theme.palette.custom.tableBorder}`,
                        background: alpha(theme.palette.background.default, 0.7),
                        borderRadius: 0,
                    }}>
                        <Stack direction="row" spacing={4} alignItems="center">
                            <Stack 
                                direction="row" 
                                spacing={1.5} 
                                alignItems="center"
                                sx={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                    // Abrir calendario directamente en modo colapsado
                                    try {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setAnchorEl(null);
                                      setAnchorPos({ top: Math.round(rect.bottom + window.scrollY), left: Math.round(rect.left + window.scrollX) });
                                      setCalOpen(true);
                                    } catch {}
                                }}
                            >
                                <EventIcon fontSize="medium" sx={{ color: theme.palette.primary.main }} />
                                <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{fecha.toLocaleDateString("es-CL")}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <StorefrontIcon fontSize="medium" sx={{ color: theme.palette.primary.main }} />
                                <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{selectedTienda}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <PersonIcon fontSize="medium" sx={{ color: theme.palette.primary.main }} />
                                <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>{selectedUsuario}</Typography>
                            </Stack>
                        </Stack>
                    </Box>
                </Collapse>
            </Paper>
                        {/* Popover de Calendario compacto */}
                        <Popover
                            open={calOpen}
                            onClose={() => setCalOpen(false)}
                            anchorEl={anchorEl}
                            anchorReference={anchorEl ? 'anchorEl' : 'anchorPosition'}
                            anchorPosition={anchorPos || { top: 0, left: 0 }}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            PaperProps={{
                                sx: {
                                    mt: 0.5,
                                    boxShadow: 3,
                                    p: 1,
                                    backgroundColor: '#fff',
                                }
                            }}
                     >
                                            <Calendar
                                date={fecha}
                                                onChange={(d) => { setFecha(d); setCalOpen(false); }}
                                                locale={dfEs}
                                color={theme.palette.primary.main}
                            />
                        </Popover>
        </Box>
    );
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 2: BillsPanel – Panel de Billetes
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BillsPanel({ billEntries, updateRowTotal, finalTotal }) {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const todayStr = new Date().toLocaleDateString('es-CL');
    // Sumar la columna Total
    const cashTotal = billEntries.reduce((acc, bill) => acc + (bill.total || 0), 0);
    return (
        <Card elevation={0} sx={{ borderRadius: 1, width: '100%', backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.custom.tableBorder}`, position: 'relative' }}>
            <CardContent sx={{ p: 2, pb: open ? 2 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalanceWalletIcon sx={{ color: theme.palette.text.primary, fontSize: 20 }} />
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontSize: '1rem' }}>Detalle de Efectivo</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 500 }}>{todayStr}</Typography>
                        <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ ml: 1, color: theme.palette.primary.main, backgroundColor: alpha(theme.palette.background.default, 0.7), borderRadius: 2 }}>
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    </Box>
                </Box>
                <Collapse in={open} timeout={400}>
                    <Stack spacing={0.3}>
                        <Grid container spacing={0.5} sx={{ alignItems: 'center', color: theme.palette.text.secondary, px: 0.5 }}>
                            <Grid item xs={5}><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Billete/Moneda</Typography></Grid>
                            <Grid item xs={3}><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Cantidad</Typography></Grid>
                            <Grid item xs={4} textAlign="right"><Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Total</Typography></Grid>
                        </Grid>
                        <Divider sx={{ borderColor: theme.palette.custom.tableBorder }} />
                        {billEntries.map((bill, index) => (
                            <Fade in={open} timeout={300 + index * 50} key={index}>
                                <Grid container spacing={0.5} sx={{ alignItems: 'center', py: 0.15, px: 0.2, borderRadius: 2 }}>
                                    <Grid item xs={5}><Typography variant="body1" fontWeight="medium">{bill.label}</Typography></Grid>
                                    <Grid item xs={3}>
                                        <TextField type="number" size="small" variant="outlined" placeholder="0" value={bill.cantidad || ""} onChange={(e) => updateRowTotal(index, e.target.value)} sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.95rem', height: 32, '&:hover fieldset': { borderColor: theme.palette.primary.main } } }} inputProps={{ min: 0, 'aria-label': `Cantidad de ${bill.label}` }} />
                                    </Grid>
                                    <Grid item xs={4} textAlign="right">
                                        <Typography variant="body1" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: bill.total > 0 ? 'bold' : 'normal', color: bill.total > 0 ? 'success.main' : 'text.secondary' }}>{bill.total ? formatCurrency(bill.total) : "$  -"}</Typography>
                                    </Grid>
                                </Grid>
                            </Fade>
                        ))}
                        <Divider sx={{ my: 0.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.2, py: 0.5, borderRadius: 2, background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)} 30%, ${alpha(theme.palette.primary.main, 0.05)} 90%)`, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoneyIcon sx={{ color: theme.palette.primary.main }} />
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.95rem', color: theme.palette.text.primary }}>Cash Total:</Typography>
                            </Box>
                            <Typography variant="h6" fontWeight="bold" color="primary.main">{formatCurrency(cashTotal)}</Typography>
                        </Box>
                    </Stack>
                </Collapse>
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
        <Card elevation={0} sx={{ borderRadius: 1, width: '100%', backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.custom.tableBorder}` }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssignmentIcon sx={{ color: theme.palette.text.primary, fontSize: 20 }} />
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontSize: '1rem' }}>Depósitos (Brinks)</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton 
                        onClick={addNewRow} 
                        sx={{ color: theme.palette.text.primary, '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                        size="small"
                    >
                        <AddCircleOutlineIcon fontSize="small" />
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
                            <Grid container spacing={0.5} alignItems="center" sx={{ py: 0.15, px: 0.2, borderRadius: 2 }}>
                                <Grid item xs={7} sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Código de depósito"
                                        value={entry.codigo || ""}
                                        onChange={(e) => updateBrinksRow(idx, "codigo", e.target.value)}
                                        inputProps={{ style: { textAlign: 'left', fontSize: '0.95rem', height: 32 }, 'aria-label': `Código depósito ${idx+1}` }}
                                        sx={{
                                            ml: '-8px',
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: alpha(theme.palette.background.default, 0.7),
                                                borderRadius: 2,
                                                '& fieldset': { borderColor: theme.palette.custom.tableBorder },
                                                '&:hover fieldset': { borderColor: theme.palette.info.main },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.info.main }
                                            },
                                            '& .MuiInputBase-input': { color: theme.palette.text.primary }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={5} sx={{ display: 'flex', alignItems: 'center', pl: 0.5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        placeholder="0"
                                        value={entry.monto || ""}
                                        onChange={(e) => updateBrinksRow(idx, "monto", e.target.value)}
                                        inputProps={{ style: { textAlign: 'left', fontSize: '0.95rem', height: 32 }, min: 0, 'aria-label': `Monto depósito ${idx+1}` }}
                                        sx={{
                                            ml: '-8px',
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: alpha(theme.palette.background.default, 0.7),
                                                borderRadius: 2,
                                                '& fieldset': { borderColor: theme.palette.custom.tableBorder },
                                                '&:hover fieldset': { borderColor: theme.palette.info.main },
                                                '&.Mui-focused fieldset': { borderColor: theme.palette.info.main }
                                            },
                                            '& .MuiInputBase-input': { color: theme.palette.text.primary }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Fade>
                    ))}
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.2, py: 0.5, borderRadius: 2, background: `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.08)} 30%, ${alpha(theme.palette.info.main, 0.03)} 90%)`, border: `1px solid ${alpha(theme.palette.info.main, 0.18)}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon color="info" />
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: '0.95rem', color: theme.palette.text.primary }}>Total Depósitos:</Typography>
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
function PaymentMethodsPanel({ medios_pago, paymentEntries, setPaymentEntries, dynamicEfectivo, billEntries, brinksEntries }) {

    useEffect(() => {
        if ((!paymentEntries || paymentEntries.length === 0) && medios_pago && medios_pago.length > 0) {
            const cashTotal = billEntries.reduce((acc, bill) => acc + (bill.total || 0), 0);
            const brinksTotal = brinksEntries.reduce((acc, entry) => acc + (parseFloat(entry.monto) || 0), 0);
            const facturadoTotal = cashTotal + brinksTotal;
            const formattedFacturado = facturadoTotal.toLocaleString("es-CL", { minimumFractionDigits: 2 });
            const initialEntries = medios_pago.map((medio, index) => ({
                medio,
                facturado: index === 0 ? formattedFacturado : "",
                cobrado: "",
                difference: "$  -",
                differenceVal: 0,
            }));
            setPaymentEntries(initialEntries);
        }
    }, [medios_pago, paymentEntries, setPaymentEntries, billEntries, brinksEntries]);
    
    const updatePaymentRow = (index, field, value) => {
        const newEntries = [...paymentEntries];
        
        // Validaciones específicas por campo
        if (field === 'cobrado') {
            // Cobrado (Real): permite números, operaciones (+, -), punto, coma
            const sanitized = value.replace(/[^0-9.,+\-]/g, '');
            newEntries[index][field] = sanitized;
        } else if (field === 'facturado') {
            // Facturado (Sieben): solo números, punto, coma, menos (sin +)
            const sanitized = value.replace(/[^0-9.,\-]/g, '');
            newEntries[index][field] = sanitized;
        } else {
            newEntries[index][field] = value;
        }
        
        // Usar parseSumExpression en ambos campos (cobrado también puede tener sumas)
        const facturadoVal = parseSumExpression(newEntries[index].facturado || '0');
        const cobradoVal = parseSumExpression(newEntries[index].cobrado || '0');
        // Diferencia = Cobrado - Facturado (positivo si cobró de más, negativo si falta)
        const diff = cobradoVal - facturadoVal;
        newEntries[index].differenceVal = diff;
        newEntries[index].difference = diff ? formatCurrency(diff) : "$  -";
        setPaymentEntries(newEntries);
    };

    useEffect(() => {
        if (paymentEntries.length > 0) {
            const cashTotal = billEntries.reduce((acc, bill) => acc + (bill.total || 0), 0);
            const brinksTotal = brinksEntries.reduce((acc, entry) => acc + (parseFloat(entry.monto) || 0), 0);
            // Cobrado Real = Cash Total + Brinks (lo que realmente contó el cajero)
            const cobradoTotal = cashTotal + brinksTotal;
            const formattedCobrado = cobradoTotal.toLocaleString("es-CL", { minimumFractionDigits: 2 });
            const newEntries = [...paymentEntries];
            newEntries[0].cobrado = formattedCobrado;
            // Format facturado if present and is a number
            if (newEntries[0].facturado && !isNaN(normalizeNumber(newEntries[0].facturado))) {
                const facturadoNum = normalizeNumber(newEntries[0].facturado);
                newEntries[0].facturado = facturadoNum.toLocaleString("es-CL", { minimumFractionDigits: 2 });
            }
            const facturadoVal = normalizeNumber(newEntries[0].facturado || "0");
            const cobradoVal = normalizeNumber(newEntries[0].cobrado || "0");
            // Diferencia = Cobrado - Facturado (positivo si cobró de más, negativo si falta)
            const diff = cobradoVal - facturadoVal;
            newEntries[0].differenceVal = diff;
            newEntries[0].difference = diff ? formatCurrency(diff) : "$  -";
            setPaymentEntries(newEntries);
        }
    }, [paymentEntries.length, billEntries, brinksEntries]);

    const getGrandTotal = () => paymentEntries.reduce((acc, row) => acc + (row.differenceVal || 0), 0);
    const grandTotal = getGrandTotal();

    const theme = useTheme();
    return(
        <Card 
            elevation={0} 
            sx={{ 
                borderRadius: 3, 
                width: '100%', 
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
                border: `1px solid ${theme.palette.custom.tableBorder}`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <CreditCardIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontSize: '1.1rem', fontWeight: 600 }}>
                        Medios de Pago
                    </Typography>
                </Box>
                <Stack spacing={1.5}>
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
                                <Grid container spacing={0.5} alignItems="center" sx={{ py: 0.5, px: 0.5 }}>
                                    <Grid item xs={4}>
                                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                                            {entry.medio}
                                        </Typography>
                                    </Grid>
                                    {/* COLUMNA 1: Cobrado (Real) - input manual del cajero (excepto primera fila) */}
                                    <Grid item xs={2.5}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={idx === 0 ? "Auto-calculado" : "Ej: 1000 o 500+500"}
                                            value={entry.cobrado}
                                            onChange={(e) => updatePaymentRow(idx, "cobrado", e.target.value)}
                                            disabled={idx === 0}
                                            InputProps={{ 
                                                readOnly: idx === 0,
                                                sx: { 
                                                    fontSize: '0.9rem', 
                                                    height: 36,
                                                    backgroundColor: idx === 0 
                                                        ? alpha(theme.palette.grey[500], 0.1)
                                                        : alpha(theme.palette.custom.tableRow, 0.5),
                                                    borderRadius: 1.5,
                                                    transition: 'all 0.2s ease',
                                                    '& fieldset': { 
                                                        borderColor: theme.palette.custom.tableBorder,
                                                        transition: 'all 0.2s ease'
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: idx === 0
                                                            ? alpha(theme.palette.grey[500], 0.1)
                                                            : alpha(theme.palette.custom.tableRow, 0.8),
                                                        '& fieldset': { borderColor: idx === 0 ? theme.palette.custom.tableBorder : theme.palette.info.main }
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: alpha(theme.palette.custom.tableRow, 0.9),
                                                        boxShadow: `0 0 0 2px ${alpha(theme.palette.info.main, 0.2)}`,
                                                        '& fieldset': { borderColor: theme.palette.info.main, borderWidth: 2 }
                                                    }
                                                }
                                            }}
                                            sx={{ 
                                                '& .MuiInputBase-input': { 
                                                    color: theme.palette.text.primary, 
                                                    fontFamily: 'monospace',
                                                    cursor: idx === 0 ? 'not-allowed' : 'text'
                                                }
                                            }}
                                        />
                                    </Grid>
                                    {/* COLUMNA 2: Facturado (Sieben) - calculado del sistema */}
                                    <Grid item xs={2.5}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="$"
                                            value={entry.facturado}
                                            onChange={(e) => updatePaymentRow(idx, "facturado", e.target.value)}
                                            InputProps={{ 
                                                sx: { 
                                                    fontSize: '0.9rem', 
                                                    height: 36,
                                                    backgroundColor: alpha(theme.palette.custom.tableRow, 0.5),
                                                    borderRadius: 1.5,
                                                    transition: 'all 0.2s ease',
                                                    '& fieldset': { 
                                                        borderColor: theme.palette.custom.tableBorder,
                                                        transition: 'all 0.2s ease'
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.custom.tableRow, 0.8),
                                                        '& fieldset': { borderColor: theme.palette.info.main }
                                                    },
                                                    '&.Mui-focused': {
                                                        backgroundColor: alpha(theme.palette.custom.tableRow, 0.9),
                                                        boxShadow: `0 0 0 2px ${alpha(theme.palette.info.main, 0.2)}`,
                                                        '& fieldset': { borderColor: theme.palette.info.main, borderWidth: 2 }
                                                    }
                                                }
                                            }}
                                            sx={{ 
                                                '& .MuiInputBase-input': { color: theme.palette.text.primary, fontFamily: 'monospace' }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={3} textAlign="right">
                                        <Box sx={{ 
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 2,
                                            background: entry.differenceVal === 0 
                                                ? alpha(theme.palette.text.secondary, 0.1)
                                                : entry.differenceVal > 0 
                                                    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.light, 0.1)} 100%)`
                                                    : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.error.light, 0.1)} 100%)`,
                                            border: `1px solid ${entry.differenceVal === 0 
                                                ? alpha(theme.palette.text.secondary, 0.2)
                                                : entry.differenceVal > 0 
                                                    ? alpha(theme.palette.success.main, 0.3)
                                                    : alpha(theme.palette.error.main, 0.3)}`,
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {entry.differenceVal > 0 && <TrendingUpIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />}
                                            {entry.differenceVal < 0 && <TrendingDownIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />}
                                            <Typography variant="body2" sx={{ 
                                                color: entry.differenceVal === 0 
                                                    ? theme.palette.text.secondary 
                                                    : (entry.differenceVal > 0 ? theme.palette.success.main : theme.palette.error.main),
                                                fontFamily: 'monospace',
                                                fontSize: '0.9rem',
                                                fontWeight: 600
                                            }}>
                                                {entry.difference}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                        ))
                    )}
                    <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.custom.tableBorder, 0.5) }}/>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        px: 2, 
                        py: 1.5, 
                        background: grandTotal === 0
                            ? `linear-gradient(135deg, ${alpha(theme.palette.text.secondary, 0.08)} 0%, ${alpha(theme.palette.text.secondary, 0.04)} 100%)`
                            : grandTotal > 0
                                ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)} 0%, ${alpha(theme.palette.success.light, 0.08)} 100%)`
                                : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(theme.palette.error.light, 0.08)} 100%)`,
                        border: `1.5px solid ${grandTotal === 0
                            ? alpha(theme.palette.text.secondary, 0.2)
                            : grandTotal > 0
                                ? alpha(theme.palette.success.main, 0.3)
                                : alpha(theme.palette.error.main, 0.3)}`,
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`
                    }}>
                        <Typography variant="body1" sx={{ 
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}>
                            Diferencia Total:
                        </Typography>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.8,
                            px: 2,
                            py: 0.8,
                            borderRadius: 1.5,
                            background: grandTotal === 0
                                ? alpha(theme.palette.text.secondary, 0.1)
                                : grandTotal > 0
                                    ? alpha(theme.palette.success.main, 0.15)
                                    : alpha(theme.palette.error.main, 0.15)
                        }}>
                            {grandTotal > 0 && <TrendingUpIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />}
                            {grandTotal < 0 && <TrendingDownIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />}
                            <Typography variant="h6" sx={{ 
                                color: grandTotal === 0 ? theme.palette.text.primary : (grandTotal > 0 ? theme.palette.success.main : theme.palette.error.main),
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                fontSize: '1.1rem'
                            }}>
                                {formatCurrency(grandTotal)}
                            </Typography>
                        </Box>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 4.1: JustificacionesPanel
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/******************************************************
 * PANEL DE JUSTIFICACIONES
 * - Muestra campos: fecha, usuario, cliente, orden, medio de pago, motivo, ajuste
 * - La fecha y usuario son campos fijos no modificables
 * - Mantiene funcionalidad para agregar justificación manual
 ******************************************************/
function JustificacionesPanel({ paymentEntries, ajustesMotivos, fecha, selectedUsuario, onSumChange, onJustificacionesChange }) {

    const [justificaciones, setJustificaciones] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(null);

    // Formatea la fecha a DD/MM/YYYY
    const formatFechaDDMMYYYY = (date) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };
    // Agrega una nueva justificación vacía
    const handleAddJustificacion = () => {
        setJustificaciones([
            ...justificaciones,
            {
                fecha: formatFechaDDMMYYYY(fecha),
                usuario: selectedUsuario || "",
                orden: "",
                cliente: "",
                medio_pago: "",
                ajuste: "",
                motivo: ajustesMotivos && ajustesMotivos.length > 0 ? ajustesMotivos[0] : ""
            }
        ]);
    };

    // Elimina la justificación seleccionada
    const handleRemoveJustificacion = () => {
        if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < justificaciones.length) {
            const newJustificaciones = justificaciones.filter((_, idx) => idx !== selectedIndex);
            setJustificaciones(newJustificaciones);
            setSelectedIndex(null);
        }
    };

    const updateJustificacion = (index, field, value) => {
        const newJustificaciones = [...justificaciones];
        newJustificaciones[index][field] = value;
        setJustificaciones(newJustificaciones);
    };

    useEffect(() => {
        // Suma todos los ajustes
        const sum = justificaciones.reduce((acc, j) => acc + (normalizeNumber(j.ajuste) || 0), 0);
        if (typeof onSumChange === 'function') onSumChange(sum);
        if (typeof onJustificacionesChange === 'function') onJustificacionesChange(justificaciones);
    }, [justificaciones, onSumChange, onJustificacionesChange]);

    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ 
            borderRadius: 2, 
            width: '100%', 
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`,
            border: `1px solid ${alpha(theme.palette.custom.tableBorder, 0.3)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
            transition: 'box-shadow 0.3s ease',
            '&:hover': {
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
            }
        }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.light, 0.1)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        }}>
                            <ReceiptIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ 
                            color: theme.palette.text.primary, 
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            letterSpacing: '0.01em'
                        }}>
                            Justificaciones de Diferencias
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                            onClick={handleAddJustificacion} 
                            size="small"
                            sx={{ 
                                borderRadius: '10px',
                                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                                color: theme.palette.warning.main,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.2)} 0%, ${alpha(theme.palette.warning.light, 0.1)} 100%)`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.3)}`
                                }
                            }}
                        >
                            <AddCircleOutlineIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                            onClick={handleRemoveJustificacion} 
                            size="small"
                            disabled={selectedIndex === null}
                            sx={{ 
                                borderRadius: '10px',
                                background: selectedIndex === null 
                                    ? alpha(theme.palette.text.disabled, 0.05)
                                    : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
                                border: `1px solid ${selectedIndex === null ? alpha(theme.palette.text.disabled, 0.2) : alpha(theme.palette.error.main, 0.2)}`,
                                color: selectedIndex === null ? theme.palette.text.disabled : theme.palette.error.main,
                                transition: 'all 0.2s ease',
                                '&:hover:not(:disabled)': {
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.2)} 0%, ${alpha(theme.palette.error.light, 0.1)} 100%)`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`
                                }
                            }}
                        >
                            <span style={{fontWeight:'bold', fontSize:'1.2rem'}}>×</span>
                        </IconButton>
                    </Box>
                </Box>
                <Stack spacing={1}>
                    <Grid container spacing={0.5} sx={{ 
                        px: 0.5,
                        py: 1,
                        borderRadius: 1.5,
                        background: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}>
                        <Grid item xs={1.5}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>Fecha</Typography></Grid>
                        <Grid item xs={1.5}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>Usuario</Typography></Grid>
                        <Grid item xs={1.5}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>Cliente</Typography></Grid>
                        <Grid item xs={1.5}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>N° Orden</Typography></Grid>
                        <Grid item xs={2}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>Medio de Pago</Typography></Grid>
                        <Grid item xs={2}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>Motivo</Typography></Grid>
                        <Grid item xs={2}><Typography variant="caption" fontWeight="bold" sx={{ color: theme.palette.text.secondary }}>Ajuste ($)</Typography></Grid>
                    </Grid>
                    {justificaciones.length === 0 && (
                        <Box sx={{ 
                            mt: 3, 
                            mb: 2, 
                            textAlign: 'center',
                            py: 4,
                            borderRadius: 2,
                            background: alpha(theme.palette.text.secondary, 0.03),
                            border: `1px dashed ${alpha(theme.palette.text.secondary, 0.2)}`
                        }}>
                            <Typography sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', fontSize: '0.9rem' }}>
                                No hay justificaciones registradas. Agrega una usando el botón +
                            </Typography>
                        </Box>
                    )}
                    {justificaciones.map((just, idx) => (
                        <Fade in={true} timeout={300 + idx * 50} key={idx}>
                            <Grid container spacing={0.5} alignItems="center"
                                sx={{
                                    border: `1.5px solid ${selectedIndex === idx ? theme.palette.warning.main : alpha(theme.palette.custom.tableBorder, 0.4)}`,
                                    borderRadius: 2,
                                    p: 0.8,
                                    minHeight: 0,
                                    transition: 'all 0.25s ease',
                                    background: selectedIndex === idx 
                                        ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(theme.palette.warning.light, 0.06)} 100%)`
                                        : theme.palette.background.paper,
                                    boxShadow: selectedIndex === idx 
                                        ? `0 2px 8px ${alpha(theme.palette.warning.main, 0.2)}`
                                        : `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
                                    '&:hover': { 
                                        background: selectedIndex === idx
                                            ? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.15)} 0%, ${alpha(theme.palette.warning.light, 0.08)} 100%)`
                                            : alpha(theme.palette.warning.main, 0.04),
                                        cursor: 'pointer',
                                        transform: 'translateY(-1px)',
                                        boxShadow: `0 3px 12px ${alpha(theme.palette.common.black, 0.08)}`
                                    }
                                }}
                                onClick={() => setSelectedIndex(idx)}
                            >
                                {/* Fecha - Campo no modificable */}
                                <Grid item xs={1.5}>
                                    <Typography variant="body2" sx={{ 
                                        color: theme.palette.text.primary,
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        background: alpha(theme.palette.primary.main, 0.05)
                                    }}>
                                        {just.fecha}
                                    </Typography>
                                </Grid>
                                {/* Usuario - Campo no modificable */}
                                <Grid item xs={1.5}>
                                    <Typography variant="body2" sx={{ 
                                        color: theme.palette.text.primary,
                                        fontSize: '0.85rem',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        background: alpha(theme.palette.info.main, 0.05)
                                    }}>
                                        {just.usuario}
                                    </Typography>
                                </Grid>
                                {/* Cliente */}
                                <Grid item xs={1.5}>
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        placeholder="Cliente" 
                                        value={just.cliente || ""} 
                                        onChange={(e) => updateJustificacion(idx, "cliente", e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                background: alpha(theme.palette.background.paper, 0.8),
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: theme.palette.background.paper,
                                                    '& fieldset': {
                                                        borderColor: alpha(theme.palette.primary.main, 0.4)
                                                    }
                                                },
                                                '&.Mui-focused': {
                                                    background: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                                {/* Orden */}
                                <Grid item xs={1.5}>
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        placeholder="Orden" 
                                        value={just.orden || ""} 
                                        onChange={(e) => updateJustificacion(idx, "orden", e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                background: alpha(theme.palette.background.paper, 0.8),
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: theme.palette.background.paper,
                                                    '& fieldset': {
                                                        borderColor: alpha(theme.palette.primary.main, 0.4)
                                                    }
                                                },
                                                '&.Mui-focused': {
                                                    background: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                                {/* Medio de Pago */}
                                <Grid item xs={2}>
                                    <FormControl fullWidth size="small">
                                        <Select 
                                            value={just.medio_pago || ""} 
                                            onChange={(e) => updateJustificacion(idx, "medio_pago", e.target.value)}
                                            sx={{
                                                background: alpha(theme.palette.background.paper, 0.8),
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: theme.palette.background.paper,
                                                    '& fieldset': {
                                                        borderColor: alpha(theme.palette.primary.main, 0.4)
                                                    }
                                                },
                                                '&.Mui-focused': {
                                                    background: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                                                }
                                            }}
                                        >
                                            <MenuItem value="">Seleccionar</MenuItem>
                                            {paymentEntries?.map((p, i) => <MenuItem key={i} value={p.medio}>{p.medio}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {/* Motivo */}
                                <Grid item xs={2}>
                                    <FormControl fullWidth size="small">
                                        <Select 
                                            value={just.motivo || ""} 
                                            onChange={(e) => updateJustificacion(idx, "motivo", e.target.value)}
                                            sx={{
                                                background: alpha(theme.palette.background.paper, 0.8),
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: theme.palette.background.paper,
                                                    '& fieldset': {
                                                        borderColor: alpha(theme.palette.primary.main, 0.4)
                                                    }
                                                },
                                                '&.Mui-focused': {
                                                    background: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                                                }
                                            }}
                                        >
                                            {ajustesMotivos?.map((motivo, i) => <MenuItem key={i} value={motivo}>{motivo}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                {/* Ajuste */}
                                <Grid item xs={2}>
                                    <TextField 
                                        fullWidth 
                                        size="small" 
                                        placeholder="0" 
                                        value={just.ajuste || ""} 
                                        onChange={(e) => updateJustificacion(idx, "ajuste", e.target.value)} 
                                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9.,\s-]/g, "")}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                background: alpha(theme.palette.background.paper, 0.8),
                                                fontFamily: 'monospace',
                                                fontWeight: 500,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: theme.palette.background.paper,
                                                    '& fieldset': {
                                                        borderColor: alpha(theme.palette.primary.main, 0.4)
                                                    }
                                                },
                                                '&.Mui-focused': {
                                                    background: theme.palette.background.paper,
                                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                    '& fieldset': {
                                                        borderColor: theme.palette.primary.main
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Fade>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
}


////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 4.2: FinalizationPanel
////////////////////////////////////////////////////////////////////////////////////////////////
function FinalizationPanel({
    tarjetasTotal, sumJustificaciones, responsable, setResponsable,
    comentarios, setComentarios, onEnviarCierre, onImprimir, isEnviando
}) {
    const balanceSinJustificar = tarjetasTotal - sumJustificaciones;
    const isBalanced = Math.abs(balanceSinJustificar) < 0.01;

    const theme = useTheme();
    return (
        <Card elevation={0} sx={{ 
            borderRadius: 2, 
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`,
            border: `1px solid ${alpha(theme.palette.custom.tableBorder, 0.3)}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
            transition: 'box-shadow 0.3s ease',
            '&:hover': {
                boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`
            }
        }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}>
                        <CheckCircleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" sx={{ 
                        color: theme.palette.text.primary, 
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        letterSpacing: '0.01em'
                    }}>
                        Finalizar Cierre
                    </Typography>
                </Box>
                <Stack spacing={1.5}>
                    {isBalanced ? (
                        <Alert 
                            severity="info" 
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                border: `1.5px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
                                '& .MuiAlert-icon': {
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            <AlertTitle sx={{ fontWeight: 600 }}>Cierre Cuadrado</AlertTitle>
                            El balance final después de justificaciones es <strong>{formatCurrency(balanceSinJustificar)}</strong>. ¡Excelente trabajo!
                        </Alert>
                    ) : (
                        <Alert 
                            severity="warning" 
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                border: `1.5px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.04)} 100%)`,
                                '& .MuiAlert-icon': {
                                    color: theme.palette.warning.main
                                }
                            }}
                        >
                            <AlertTitle sx={{ fontWeight: 600 }}>Atención Requerida</AlertTitle>
                            Queda un balance sin justificar de <strong>{formatCurrency(balanceSinJustificar)}</strong>. Por favor, revísalo o deja un comentario.
                        </Alert>
                    )}
                    <TextField 
                        label="Nombre del responsable del cierre" 
                        variant="outlined" 
                        fullWidth 
                        value={responsable} 
                        onChange={(e) => setResponsable(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: alpha(theme.palette.background.paper, 0.8),
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: theme.palette.background.paper,
                                    '& fieldset': {
                                        borderColor: alpha(theme.palette.primary.main, 0.5)
                                    }
                                },
                                '&.Mui-focused': {
                                    background: theme.palette.background.paper,
                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                    '& fieldset': {
                                        borderColor: theme.palette.primary.main,
                                        borderWidth: '2px'
                                    }
                                }
                            }
                        }}
                    />
                    <TextField 
                        label="Comentarios adicionales (opcional)" 
                        variant="outlined" 
                        fullWidth 
                        multiline 
                        rows={3} 
                        value={comentarios} 
                        onChange={(e) => setComentarios(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                background: alpha(theme.palette.background.paper, 0.8),
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: theme.palette.background.paper,
                                    '& fieldset': {
                                        borderColor: alpha(theme.palette.primary.main, 0.5)
                                    }
                                },
                                '&.Mui-focused': {
                                    background: theme.palette.background.paper,
                                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                                    '& fieldset': {
                                        borderColor: theme.palette.primary.main,
                                        borderWidth: '2px'
                                    }
                                }
                            }
                        }}
                    />
                    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                        <Button 
                            variant="contained" 
                            startIcon={<SendIcon />} 
                            onClick={onEnviarCierre} 
                            disabled={isEnviando}
                            size="large"
                            sx={{
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || alpha(theme.palette.primary.main, 0.85)} 100%)`,
                                color: '#fff',
                                fontWeight: 600,
                                px: 3,
                                py: 1.2,
                                borderRadius: 2,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                transition: 'all 0.2s ease',
                                '&:hover:not(:disabled)': { 
                                    background: `linear-gradient(135deg, ${theme.palette.primary.dark || alpha(theme.palette.primary.main, 0.85)} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                                },
                                '&:disabled': {
                                    background: theme.palette.action.disabledBackground,
                                    color: theme.palette.text.disabled,
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            {isEnviando ? 'Enviando...' : 'Enviar Cierre'}
                        </Button>
                        <Button 
                            variant="outlined" 
                            startIcon={<PrintIcon />} 
                            onClick={onImprimir} 
                            disabled={isEnviando}
                            size="large"
                            sx={{
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                borderWidth: '1.5px',
                                color: theme.palette.text.primary,
                                fontWeight: 600,
                                px: 3,
                                py: 1.2,
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover:not(:disabled)': { 
                                    borderColor: theme.palette.primary.main,
                                    borderWidth: '1.5px',
                                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                                },
                                '&:disabled': {
                                    borderColor: alpha(theme.palette.text.disabled, 0.3),
                                    color: theme.palette.text.disabled
                                }
                            }}
                        >
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
        const response = await fetchWithFallback('/localStorage');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error loading ajustes from backend:", error);
        return { tiendas: [], medios_pago: [], motivos_error_pago: [] };
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
    const [todosLosUsuarios, setTodosLosUsuarios] = useState([]); // Usuarios desde la DB
    const [usuarios, setUsuarios] = useState([]);
    const [selectedTienda, setSelectedTienda] = useState("");
    const [selectedUsuario, setSelectedUsuario] = useState("");
    const [panelVisible, setPanelVisible] = useState(false);
    const [billEntries, setBillEntries] = useState(JSON.parse(JSON.stringify(initialBills)));
    const [totalEfectivo, setTotalEfectivo] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);
    const [brinksEntries, setBrinksEntries] = useState([{ codigo: "", monto: 0 }]);
    const [brinksTotal, setBrinksTotal] = useState(0);
    const [dataAjustes, setDataAjustes] = useState({ tiendas: [], medios_pago: [], motivos_error_pago: [] });
    const [paymentEntries, setPaymentEntries] = useState([]);
    const [sumJustificaciones, setSumJustificaciones] = useState(0);
    const [responsable, setResponsable] = useState("");
    const [comentarios, setComentarios] = useState("");
    const [justificacionesData, setJustificacionesData] = useState([]);
    const [mostrarResumen, setMostrarResumen] = useState(false);
    const [resumenData, setResumenData] = useState(null);
    const [resetHeader, setResetHeader] = useState(false);
    const [justificacionesKey, setJustificacionesKey] = useState(0); // Key para forzar reset del componente
    const [isEnviando, setIsEnviando] = useState(false); // Controla el estado de envío
    
    // Estados para el diálogo personalizado
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({
        title: '',
        message: '',
        type: 'info',
        onConfirm: null,
        confirmText: 'Aceptar',
        showCancel: false
    });
    
    const theme = useTheme();

    // Función helper para mostrar diálogos
    const showDialog = (title, message, type = 'info', onConfirm = null, confirmText = 'Aceptar', showCancel = false) => {
        setDialogConfig({ title, message, type, onConfirm, confirmText, showCancel });
        setDialogOpen(true);
    };

    // Cargar usuarios desde la API
    useEffect(() => {
        async function fetchUsuarios() {
            try {
                const response = await fetch('http://localhost:3001/api/users');
                const result = await response.json();
                if (result.success) {
                    setTodosLosUsuarios(result.users);
                }
            } catch (error) {
                console.error('Error cargando usuarios:', error);
            }
        }
        fetchUsuarios();
    }, []);

    useEffect(() => {
        async function fetchAjustes() {
            const ajustesData = await loadAjustesFromBackend();
            setDataAjustes(ajustesData);
            setTiendas(ajustesData.tiendas || []);
            if (ajustesData.tiendas && ajustesData.tiendas.length > 0) {
                const firstTienda = ajustesData.tiendas[0];
                setSelectedTienda(firstTienda);
            }
        }
        fetchAjustes();
    }, []);

    // Actualizar usuarios cuando cambia la tienda seleccionada o la lista de usuarios
    useEffect(() => {
        if (selectedTienda && todosLosUsuarios.length > 0) {
            // Filtrar usuarios que tienen esta tienda en su array de sucursales
            const usuariosTienda = todosLosUsuarios
                .filter(user => user.sucursales && user.sucursales.includes(selectedTienda))
                .map(u => u.username);
            
            setUsuarios(usuariosTienda);
            
            // Si el usuario seleccionado no está en la lista, seleccionar el primero
            if (!usuariosTienda.includes(selectedUsuario)) {
               setSelectedUsuario(usuariosTienda[0] || "");
            }
        }
    }, [selectedTienda, todosLosUsuarios]);

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
        // Si el panel está visible, resetear justificaciones antes de cerrarlo
        if (panelVisible) {
            setJustificacionesKey(prev => prev + 1);
            setSumJustificaciones(0);
            setJustificacionesData([]);
            setPanelVisible(false);
            return;
        }
        
        // Usar formato DD/MM/YYYY para la fecha en la consulta a la API
        const pad = (n) => n.toString().padStart(2, '0');
        const fechaStr = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
        try {
            const queryUrl = `/api/cierres/existe?fecha=${encodeURIComponent(fechaStr)}&tienda=${encodeURIComponent(selectedTienda)}&usuario=${encodeURIComponent(selectedUsuario)}`;
            const response = await fetchWithFallback(queryUrl);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al conectar con la base de datos: ${response.status} - ${errorText}`);
            }
            const result = await response.json();
            if (result.fecha) {
                // Si la fecha viene en otro formato, convertirla
                if (/^\d{4}-\d{2}-\d{2}$/.test(result.fecha)) {
                    const [y, m, d] = result.fecha.split('-');
                    result.fecha = `${pad(d)}/${pad(m)}/${y}`;
                }
            }
            if (result.existe) {
                showDialog(
                    'Cierre ya completado',
                    'Este cierre ya fue completado previamente.',
                    'warning'
                );
                return;
            }
            
            // Resetear justificaciones al abrir el panel
            setJustificacionesKey(prev => prev + 1);
            setSumJustificaciones(0);
            setJustificacionesData([]);
            setPanelVisible(true);
        } catch (error) {
            // Mostrar error en la interfaz
            showDialog(
                'Error de Conexión',
                error.message || 'Error al conectar con la base de datos para verificar el cierre',
                'error'
            );
        }
    };

    const getGrandPaymentTotal = () => paymentEntries.reduce((acc, row) => acc + (row.differenceVal || 0), 0);
    const dynamicEfectivo = finalTotal + brinksTotal;

    const confirmCierre = async () => {
        // Prevenir múltiples envíos simultáneos
        if (isEnviando) {
            return;
        }
        
        const balanceSinJustificar = getGrandPaymentTotal() - sumJustificaciones;
        // No permitir enviar el cierre si no está cuadrado (según la UI: "Cierre Cuadrado")
        if (Math.abs(balanceSinJustificar) >= 0.01) {
            showDialog(
                'Balance No Cuadrado',
                'No se puede enviar el cierre: el balance no está cuadrado. Debe quedar "Cierre Cuadrado" antes de enviar.',
                'warning'
            );
            return;
        }
        
        // Activar estado de envío
        setIsEnviando(true);
        
        try {
            // Convertir facturado y cobrado a suma antes de exportar
            const mediosPagoExport = paymentEntries.map(entry => ({
                ...entry,
                facturado: parseSumExpression(entry.facturado || "0"),
                cobrado: parseSumExpression(entry.cobrado || "0") // Usar parseSumExpression para soportar sumas
            }));
            
            // Procesar justificaciones para convertir valores de ajuste a números
            const justificacionesProcessed = justificacionesData.map(justificacion => ({
                ...justificacion,
                ajuste: normalizeNumber(justificacion.ajuste || "0") // Convertir string a número
            }));
            
            // Fecha en formato DD/MM/YYYY
            const pad = (n) => n.toString().padStart(2, '0');
            const fechaStr = `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
            const exportData = {
                fecha: fechaStr,
                tienda: selectedTienda,
                usuario: selectedUsuario,
                total_billetes: parseFloat(totalEfectivo.toFixed(2)),
                final_balance: parseFloat(finalTotal.toFixed(2)),
                brinks_total: parseFloat(brinksTotal.toFixed(2)),
                medios_pago: JSON.stringify(mediosPagoExport),
                justificaciones: justificacionesProcessed, // Usar las justificaciones procesadas
                grand_difference_total: parseFloat(getGrandPaymentTotal().toFixed(2)),
                balance_sin_justificar: parseFloat(balanceSinJustificar.toFixed(2)),
                responsable: responsable,
                comentarios: comentarios
            };
            
            const response = await fetchWithFallback('/api/cierres-completo', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(exportData)
            });
            
            if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
            await response.json();
            
            showDialog(
                'Cierre Exitoso',
                'La información del cierre ha sido enviada correctamente a la base de datos.',
                'success',
                () => {
                    // Resetear todos los estados para permitir un nuevo cierre
                    setPanelVisible(false);
                    setBillEntries(JSON.parse(JSON.stringify(initialBills)));
                    setBrinksEntries([{ codigo: "", monto: 0 }]);
                    setPaymentEntries([]);
                    setResponsable("");
                    setComentarios("");
                    setSumJustificaciones(0);
                    setJustificacionesData([]);
                    
                    // Forzar el reinicio completo del módulo de justificaciones
                    setJustificacionesKey(prev => prev + 1);
                    
                    // Resetear la fecha a hoy para el próximo cierre
                    setFecha(new Date());
                    
                    // Activar el reset del header
                    setResetHeader(true);
                    setTimeout(() => setResetHeader(false), 100); // Reset después de un breve delay
                }
            );
        } catch (err) {
            console.error("Error guardando el cierre:", err);
            showDialog(
                'Error al Enviar',
                `Error al enviar el cierre: ${err.message}`,
                'error'
            );
        } finally {
            // Siempre desactivar el estado de envío al finalizar (éxito o error)
            setIsEnviando(false);
        }
    };

    // Formatea la fecha a DD/MM/YYYY
    const formatFechaDDMMYYYY = (date) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };

    const handleImprimir = () => {
        const data = {
            fecha: formatFechaDDMMYYYY(fecha),
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
        <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh', py: 2 }}>
            <Container maxWidth="xl">
            <HeaderControls
                fecha={fecha} setFecha={setFecha}
                tiendas={tiendas} selectedTienda={selectedTienda} setSelectedTienda={setSelectedTienda}
                usuarios={usuarios} selectedUsuario={selectedUsuario} setSelectedUsuario={setSelectedUsuario}
                onCerrarCaja={togglePanelCierre}
                resetHeader={resetHeader}
            />
            
            <Collapse in={panelVisible} timeout={500}>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* COLUMNA IZQUIERDA - ENTRADA DE DATOS PRIMARIOS */}
                    <Grid item xs={12} md={4} lg={3}>
                        {/* TÍTULO DE SUBSECCIÓN */}
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                color: theme.palette.primary.main, 
                                fontWeight: 500, 
                                mb: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            <TrendingUpIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                            Datos Primarios
                        </Typography>
                        
                        <Stack spacing={2}>
                            {/* 1. BILLS PANEL - Efectivo físico (datos primarios) */}
                            <BillsPanel
                                billEntries={billEntries}
                                updateRowTotal={updateRowTotal}
                                finalTotal={finalTotal}
                            />
                            {/* 2. BRINKS PANEL - Depósitos (datos primarios) */}
                            <BrinksPanel
                                brinksEntries={brinksEntries}
                                setBrinksEntries={setBrinksEntries}
                                onTotalChange={setBrinksTotal}
                            />
                        </Stack>
                    </Grid>

                    {/* COLUMNA DERECHA - PROCESAMIENTO Y ANÁLISIS */}
                    <Grid item xs={12} md={8} lg={9}>
                        {/* TÍTULO DE SUBSECCIÓN */}
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                color: theme.palette.primary.main, 
                                fontWeight: 500, 
                                mb: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                            }}
                        >
                            <TrendingDownIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                            Análisis y Validación
                        </Typography>
                        
                        <Stack spacing={2}>
                            {/* 3. PAYMENT METHODS PANEL - Análisis de medios de pago */}
                            <PaymentMethodsPanel
                                medios_pago={dataAjustes.medios_pago}
                                paymentEntries={paymentEntries}
                                setPaymentEntries={setPaymentEntries}
                                dynamicEfectivo={dynamicEfectivo}
                                billEntries={billEntries}
                                brinksEntries={brinksEntries}
                            />
                            {/* 4. JUSTIFICACIONES PANEL - Gestión de diferencias */}
                            <JustificacionesPanel
                                key={justificacionesKey}
                                paymentEntries={paymentEntries}
                                ajustesMotivos={dataAjustes.motivos_error_pago}
                                fecha={fecha}
                                selectedUsuario={selectedUsuario}
                                onSumChange={setSumJustificaciones}
                                onJustificacionesChange={setJustificacionesData}
                            />
                            {/* 5. FINALIZATION PANEL - Cierre y validación final */}
                            <FinalizationPanel
                                tarjetasTotal={getGrandPaymentTotal()}
                                sumJustificaciones={sumJustificaciones}
                                responsable={responsable}
                                setResponsable={setResponsable}
                                comentarios={comentarios}
                                setComentarios={setComentarios}
                                onEnviarCierre={confirmCierre}
                                onImprimir={handleImprimir}
                                isEnviando={isEnviando}
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
            
            {/* Diálogo personalizado */}
            <CustomDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                title={dialogConfig.title}
                message={dialogConfig.message}
                type={dialogConfig.type}
                onConfirm={dialogConfig.onConfirm}
                confirmText={dialogConfig.confirmText}
                showCancel={dialogConfig.showCancel}
            />
            </Container>
        </Box>
    );
}

export default CierreCaja;


