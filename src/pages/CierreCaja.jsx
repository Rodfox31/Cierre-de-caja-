import React, { useState, useEffect } from "react";
import Imprimir from "./imprimir";
import { useTheme } from "@mui/material/styles";
import { API_BASE_URL } from '../config';


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Funciones auxiliares
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function formatCurrency(value) {
  return "$ " + value.toLocaleString("es-CL", { minimumFractionDigits: 2 });
}
function parseCurrency(valueStr) {
  if (typeof valueStr === "number") return valueStr;
  try {
    const normalized = valueStr.replace(/\./g, "").replace(",", ".");
    return parseFloat(normalized) || 0;
  } catch {
    return 0.0;
  }
}

const initialBills = [
  { label: "$ 20.000,00", value: 20000, cantidad: 0, total: 0 },
  { label: "$ 10.000,00", value: 10000, cantidad: 0, total: 0 },
  { label: "$ 2.000,00", value: 2000, cantidad: 0, total: 0 },
  { label: "$ 1.000,00", value: 1000, cantidad: 0, total: 0 },
  { label: "$ 500,00", value: 500, cantidad: 0, total: 0 },
  { label: "$ 200,00", value: 200, cantidad: 0, total: 0 },
  { label: "$ 100,00", value: 100, cantidad: 0, total: 0 },
  { label: "$ 50,00", value: 50, cantidad: 0, total: 0 },
  { label: "$ 20,00", value: 20, cantidad: 0, total: 0 },
  { label: "$ 10,00", value: 10, cantidad: 0, total: 0 }
];

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Bloque 1: HeaderControls – Controles de Encabezado
////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function HeaderControls({
  fecha,
  setFecha,
  tiendas,
  selectedTienda,
  setSelectedTienda,
  usuarios,
  selectedUsuario,
  setSelectedUsuario,
  onCerrarCaja
}) {
  const theme = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [disabled, setDisabled] = useState(false); // nuevo estado

  // === ESTILOS ===

  const groupStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  };

  const labelStyle = {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    marginBottom: "4px",
    fontWeight: 500,
  };

  const inputStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "10px",
    padding: "10px 14px",
    color: theme.palette.text.primary,
    width: "160px",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
  };

  const inputHoverStyle = {
    ...inputStyle,
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 4px ${theme.palette.primary.light}`,
  };

  const expandedContainerStyle = {
    maxHeight: "140px",
    padding: "16px",
    borderRadius: "16px",
    boxShadow: pressed
      ? "0 6px 12px rgba(0, 0, 0, 0.5)"
      : "0 8px 18px rgba(0, 0, 0, 0.25)",
  };

  const collapsedContainerStyle = {
    maxHeight: "60px",
    padding: "8px 12px",
    borderRadius: "10px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
  };

  const containerStyle = {
    transition: "max-height 0.4s ease, opacity 0.4s ease, transform 0.3s ease, padding 0.3s, border-radius 0.3s",
    overflow: "hidden",
    opacity: collapsed ? 0.9 : 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "12px",
    background: theme.palette.custom.appBarGradient,
    transform: pressed ? "scale(0.99)" : "scale(1)",
    ...(!collapsed ? expandedContainerStyle : collapsedContainerStyle),
  };

  const compactTextStyle = {
    fontSize: "0.8rem",
    color: theme.palette.text.primary,
    fontWeight: 500,
    display: "flex",
    gap: "12px",
    alignItems: "center",
  };

  const expandedButtonStyle = {
    padding: "14px 28px",
    fontSize: "0.95rem",
    borderRadius: "12px",
    boxShadow: pressed
      ? "0 3px 6px rgba(0, 0, 0, 0.35)"
      : "0 6px 12px rgba(0, 0, 0, 0.25)",
  };

  const collapsedButtonStyle = {
    padding: "6px 14px",
    fontSize: "0.75rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  };

  const disabledButtonStyle = {
    opacity: 0,
    pointerEvents: "none",
    transform: "scale(0.95)",
    transition: "opacity 0.4s ease, transform 0.3s ease",
  };

  const buttonStyle = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${
      theme.palette.primary.dark || theme.palette.primary.main
    })`,
    border: "none",
    color: theme.palette.text.primary,
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: 600,
    transform: pressed ? "scale(0.97)" : "scale(1)",
    ...(collapsed ? collapsedButtonStyle : expandedButtonStyle),
    ...(disabled ? disabledButtonStyle : {}),
  };

  // === FUNCIONES ===

  const iconText = (emoji, text) => (
    <span>{emoji} {text}</span>
  );

  const handleCerrarCaja = () => {
    setPressed(true);
    setDisabled(true); // activa ocultamiento del botón
    setCollapsed(true);
    setTimeout(() => {
      setPressed(false);
      onCerrarCaja();
    }, 300);
  };

  // === COMPONENTE ===

  return (
    <div style={containerStyle}>
      {collapsed ? (
        <div style={compactTextStyle}>
          {iconText("📅", fecha.toISOString().split("T")[0])}
          {iconText("🏪", selectedTienda)}
          {iconText("👤", selectedUsuario)}
        </div>
      ) : (
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={groupStyle}>
            <label style={labelStyle} htmlFor="input-fecha">Fecha</label>
            <input
              id="input-fecha"
              type="date"
              value={fecha.toISOString().split("T")[0]}
              onChange={(e) => setFecha(new Date(e.target.value))}
              style={inputStyle}
              onMouseOver={(e) => Object.assign(e.target.style, inputHoverStyle)}
              onMouseOut={(e) => Object.assign(e.target.style, inputStyle)}
              aria-label="Seleccionar fecha"
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle} htmlFor="select-tienda">Tienda</label>
            <select
              id="select-tienda"
              value={selectedTienda}
              onChange={(e) => setSelectedTienda(e.target.value)}
              style={inputStyle}
              onMouseOver={(e) => Object.assign(e.target.style, inputHoverStyle)}
              onMouseOut={(e) => Object.assign(e.target.style, inputStyle)}
              aria-label="Seleccionar tienda"
            >
              {tiendas?.length > 0
                ? tiendas.map((t) => <option key={t} value={t}>{t}</option>)
                : <option value="error">Error: Sin datos</option>}
            </select>
          </div>

          <div style={groupStyle}>
            <label style={labelStyle} htmlFor="select-usuario">Usuario</label>
            <select
              id="select-usuario"
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              style={inputStyle}
              onMouseOver={(e) => Object.assign(e.target.style, inputHoverStyle)}
              onMouseOut={(e) => Object.assign(e.target.style, inputStyle)}
              aria-label="Seleccionar usuario"
            >
              {usuarios?.length > 0
                ? usuarios.map((u, idx) => <option key={idx} value={u}>{u}</option>)
                : <option value="error">Error: Sin datos</option>}
            </select>
          </div>
        </div>
      )}

      <button
        onClick={handleCerrarCaja}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={buttonStyle}
        aria-label="Cerrar caja"
        title="Cerrar caja"
        disabled={disabled}
      >
        CERRAR CAJA
      </button>
    </div>
  );
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// BLOQUE 2: BillsPanel – Panel de Billetes

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BillsPanel({ billEntries, updateRowTotal, finalTotal }) {
  const theme = useTheme();

  // === ESTILOS ===

  const localInputStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "8px",
    padding: "8px 12px",
    color: theme.palette.text.primary,
    width: "80px",
    textAlign: "center",
    fontSize: "0.85rem",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  };

  const panelStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "16px",
    padding: "20px",
    minWidth: "360px",
    color: theme.palette.text.primary,
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 100px 1fr",
    gap: "8px 12px",
    alignItems: "center",
    width: "100%",
  };

  const headerCellStyle = {
    fontWeight: 600,
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    paddingBottom: "4px",
  };

  const dataCellStyle = {
    fontSize: "0.85rem",
    color: theme.palette.text.primary,
  };

  const totalCellStyle = {
    ...dataCellStyle,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums"
  };

  const footerStyle = {
    marginTop: "16px",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 600,
    fontSize: "0.8rem",
    paddingTop: "12px",
    borderTop: `1px solid ${theme.palette.divider}`
  };

  // === COMPONENTE ===

  return (
    <div style={panelStyle}>
      <div style={gridStyle}>
        <div style={headerCellStyle}>Billete</div>
        <div style={headerCellStyle}>Cant.</div>
        <div style={{ ...headerCellStyle, textAlign: "right" }}>Total</div>

        {billEntries.map((bill, index) => (
          <React.Fragment key={index}>
            <div style={dataCellStyle}>{bill.label}</div>
            <div>
              <input
                type="number"
                placeholder="0"
                value={bill.cantidad || ""}
                onChange={(e) => updateRowTotal(index, e.target.value)}
                style={localInputStyle}
              />
            </div>
            <div style={totalCellStyle}>
              {bill.total ? formatCurrency(bill.total) : "$  -"}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div style={footerStyle}>
        <div>Fondo de caja: $ -10.000,00</div>
        <div>Cash Total: {formatCurrency(finalTotal)}</div>
      </div>
    </div>
  );
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 2.1: BrinksPanel – Panel de Brinks
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function BrinksPanel({ brinksEntries, setBrinksEntries, onTotalChange }) {
  const theme = useTheme();
  const total = brinksEntries.reduce(
    (acc, entry) => acc + (parseFloat(entry.monto) || 0),
    0
  );

  useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  const updateBrinksRow = (index, field, value) => {
    const newEntries = [...brinksEntries];
    newEntries[index][field] = field === "monto" ? (parseFloat(value) || 0) : value;
    setBrinksEntries(newEntries);
  };

  const addNewRow = () => {
    setBrinksEntries([
      ...brinksEntries,
      { codigo: "", monto: 0 }
    ]);
  };

  // === ESTILOS ===

  const panelStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "16px",
    padding: "20px",
    maxWidth: "420px",
    marginTop: "16px",
    color: theme.palette.text.primary,
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    transition: "all 0.3s ease"
  };

  const headerContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px"
  };

  const titleStyle = {
    fontSize: "1rem",
    fontWeight: "bold",
    margin: 0,
    color: theme.palette.text.primary
  };

  const addButtonStyle = {
    background: theme.palette.primary.main,
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    color: theme.palette.primary.contrastText,
    cursor: "pointer",
    fontSize: "1.2rem",
    lineHeight: "28px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "background 0.3s, transform 0.2s ease-in-out",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 130px",
    gap: "6px 10px",
    alignItems: "center",
    width: "100%",
  };

  const headerStyle = {
    fontWeight: 600,
    fontSize: "0.85rem",
    textAlign: "left",
    color: theme.palette.text.secondary,
    paddingBottom: "2px",
  };

  const inputStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "8px",
    padding: "10px 14px",
    color: theme.palette.text.primary,
    fontSize: "0.85rem",
    width: "100%",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  };

  const totalStyle = {
    marginTop: "8px",
    fontWeight: "bold",
    textAlign: "right",
    fontSize: "0.9rem",
    paddingTop: "8px",
    borderTop: `1px solid ${theme.palette.divider}`
  };

  // === COMPONENTE ===

  return (
    <div style={panelStyle}>
      <div style={headerContainerStyle}>
        <h3 style={titleStyle}>Brinks</h3>
        <button
          onClick={addNewRow}
          style={addButtonStyle}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title="Agregar nueva fila"
        >
          +
        </button>
      </div>

      <div style={{ ...gridStyle, marginBottom: "4px" }}>
        <div style={headerStyle}>Código</div>
        <div style={headerStyle}>Monto</div>
      </div>

      {brinksEntries.map((entry, idx) => (
        <div key={idx} style={{ ...gridStyle, animation: "fadeIn 0.3s ease" }}>
          <input
            type="text"
            placeholder="Código"
            value={entry.codigo || ""}
            onChange={(e) => updateBrinksRow(idx, "codigo", e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="0"
            value={entry.monto || ""}
            onChange={(e) => updateBrinksRow(idx, "monto", e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      <div style={totalStyle}>
        Total Brinks: {formatCurrency(total)}
      </div>
    </div>
  );
}


function PaymentMethodsPanel({ medios_pago, paymentEntries, setPaymentEntries, dynamicEfectivo }) {
  const theme = useTheme();

  const localInputStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "6px",
    padding: "6px 10px",
    color: theme.palette.text.primary,
    width: "90px",
    fontSize: "0.8rem",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "inset 0 1px 1px rgba(0,0,0,0.04)",
  };

  useEffect(() => {
    if ((!paymentEntries || paymentEntries.length === 0) && medios_pago && medios_pago.length > 0) {
      const initialEntries = medios_pago.map((medio, index) => ({
        medio,
        facturado: index === 0 ? dynamicEfectivo.toString() : "",
        cobrado: "",
        difference: "$  -",
        differenceVal: 0,
        orden: "",
        cliente: "",
        ajuste: 0,
        motivo: ""
      }));
      setPaymentEntries(initialEntries);
    }
  }, [medios_pago, paymentEntries, setPaymentEntries, dynamicEfectivo]);

  const updatePaymentRow = (index, field, value) => {
    const newEntries = [...paymentEntries];
    newEntries[index][field] = value;
    const facturadoVal = parseCurrency(newEntries[index].facturado || "0");
    const cobradoVal = parseCurrency(newEntries[index].cobrado || "0");
    const diff = facturadoVal - cobradoVal;
    newEntries[index].differenceVal = diff;
    newEntries[index].difference = diff ? formatCurrency(diff) : "$  -";
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
      newEntries[0].difference = diff ? formatCurrency(diff) : "$  -";
      setPaymentEntries(newEntries);
    }
  }, [dynamicEfectivo]);

  const getGrandTotal = () =>
    paymentEntries.reduce((acc, row) => acc + (row.differenceVal || 0), 0);

  // === ESTILOS ===

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "140px 100px 100px 100px",
    gap: "6px 10px",
    alignItems: "center",
    justifyItems: "start",
    marginTop: "6px"
  };

  const headerCellStyle = {
    fontWeight: 600,
    fontSize: "0.8rem",
    textAlign: "left",
    color: theme.palette.text.secondary
  };

  const dataCellStyle = {
    fontSize: "0.8rem",
    textAlign: "left",
    color: theme.palette.text.primary
  };

  const differenceStyle = (val) => ({
    ...dataCellStyle,
    fontWeight: val !== 0 ? 600 : 400,
    textAlign: "right",
    color:
      val > 0
        ? theme.palette.success.main
        : val < 0
        ? theme.palette.error.main
        : theme.palette.text.disabled
  });

  const panelStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "12px",
    padding: "16px",
    width: "580px",
    color: theme.palette.text.primary,
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  };

  const totalRowStyle = {
    ...gridStyle,
    marginTop: "12px",
    fontWeight: 600,
    fontSize: "0.85rem",
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: "8px"
  };

  return (
    <div style={panelStyle}>
      <div style={gridStyle}>
        <div style={headerCellStyle}>Medio</div>
        <div style={headerCellStyle}>Cobrado</div>  {/* antes Facturado */}
        <div style={headerCellStyle}>Facturado</div> {/* antes Cobrado */}
        <div style={{ ...headerCellStyle, textAlign: "right" }}>Diferencia</div>
      </div>

      {(!medios_pago || medios_pago.length === 0) && (
        <div style={{ color: "red", marginTop: "8px", textAlign: "left" }}>
          Error: Sin datos de medios de pago
        </div>
      )}

      {paymentEntries.map((entry, idx) => (
        <div key={idx} style={gridStyle}>
          <div style={dataCellStyle}>{entry.medio}</div>

          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]+"
            placeholder="Facturado"
            value={entry.facturado}
            onChange={(e) => updatePaymentRow(idx, "facturado", e.target.value)}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
            }}
            style={localInputStyle}
            readOnly={idx === 0}
          />

          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9.,]+"
            placeholder="Cobrado"
            value={entry.cobrado}
            onChange={(e) => updatePaymentRow(idx, "cobrado", e.target.value)}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/[^0-9.,]/g, "");
            }}
            style={localInputStyle}
          />

          <div style={differenceStyle(entry.differenceVal)}>
            {entry.difference}
          </div>
        </div>
      ))}

      <div style={totalRowStyle}>
        <div style={{ gridColumn: "1", textAlign: "left" }}>Gran Total</div>
        <div style={{ gridColumn: "2 / 4" }}></div>
        <div style={{ textAlign: "right" }}>
          {formatCurrency(getGrandTotal())}
        </div>
      </div>
    </div>
  );
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 4.1: JustificacionesPanel
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function JustificacionesPanel({ paymentEntries, ajustesMotivos, fecha, onSumChange, onJustificacionesChange }) {
  const theme = useTheme();
  const rows = paymentEntries.filter((row) => Math.abs(row.differenceVal) > 0.01);

  const [justificaciones, setJustificaciones] = useState(
    rows.map(() => ({
      fecha: fecha.toLocaleDateString("es-CL"),
      orden: "",
      cliente: "",
      monto_dif: rows[0]?.difference || "0",
      ajuste: 0,
      motivo: ajustesMotivos && ajustesMotivos.length > 0 ? ajustesMotivos[0] : ""
    }))
  );

  useEffect(() => {
    setJustificaciones((prev) => {
      if (prev.length !== rows.length) {
        return rows.map((_, idx) => prev[idx] || {
          fecha: fecha.toLocaleDateString("es-CL"),
          orden: "",
          cliente: "",
          monto_dif: rows[idx]?.difference || "0",
          ajuste: 0,
          motivo: ajustesMotivos && ajustesMotivos.length > 0 ? ajustesMotivos[0] : ""
        });
      }
      return prev;
    });
  }, [rows, ajustesMotivos, fecha]);

  const updateJustificacion = (index, field, value) => {
    const newJustificaciones = [...justificaciones];
    newJustificaciones[index][field] = field === "ajuste" ? parseFloat(value) || 0 : value;
    setJustificaciones(newJustificaciones);
  };

  useEffect(() => {
    const sum = justificaciones.reduce((acc, j) => acc + (j.ajuste || 0), 0);
    if (typeof onSumChange === "function") onSumChange(sum);
  }, [justificaciones, onSumChange]);

  useEffect(() => {
    if (typeof onJustificacionesChange === "function") onJustificacionesChange(justificaciones);
  }, [justificaciones, onJustificacionesChange]);

  // === ESTILOS ===

  const panelStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "16px",
    padding: "16px",
    color: theme.palette.text.primary,
    width: "770px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
    fontSize: "0.8rem"
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "80px 90px 100px 90px 80px 1fr",
    gap: "10px",
    alignItems: "center",
    marginBottom: "8px"
  };

  const headerStyle = {
    ...gridStyle,
    fontWeight: 600,
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    paddingBottom: "4px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    textAlign: "center"
  };

  const inputStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "6px",
    padding: "6px 10px",
    fontSize: "0.8rem",
    color: theme.palette.text.primary,
    width: "100%",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)"
  };

  const selectStyle = {
    ...inputStyle,
    width: "100%"
  };

  return (
    <div style={panelStyle}>
      <h4 style={{ marginBottom: "12px", textAlign: "center", fontSize: "0.95rem", fontWeight: 600 }}>
        Justificaciones
      </h4>

      <div style={headerStyle}>
        <div>Fecha</div>
        <div>N° Orden</div>
        <div>Cliente</div>
        <div>Monto Dif.</div>
        <div>Ajuste</div>
        <div>Motivo</div>
      </div>

      {rows.length > 0 ? (
        rows.map((row, idx) => (
          <div key={idx} style={gridStyle}>
            <div>{fecha.toLocaleDateString("es-CL")}</div>

            <input
              type="text"
              placeholder="Orden"
              value={justificaciones[idx]?.orden || ""}
              onChange={(e) => updateJustificacion(idx, "orden", e.target.value)}
              style={inputStyle}
            />

            <input
              type="text"
              placeholder="Cliente"
              value={justificaciones[idx]?.cliente || ""}
              onChange={(e) => updateJustificacion(idx, "cliente", e.target.value)}
              style={inputStyle}
            />

            <div style={{ textAlign: "right" }}>{row.difference}</div>

            <input
              type="number"
              placeholder="0"
              value={justificaciones[idx]?.ajuste || ""}
              onChange={(e) => updateJustificacion(idx, "ajuste", e.target.value)}
              style={inputStyle}
            />

            <select
              value={justificaciones[idx]?.motivo || ""}
              onChange={(e) => updateJustificacion(idx, "motivo", e.target.value)}
              style={selectStyle}
            >
              {ajustesMotivos &&
                ajustesMotivos.map((motivo, i) => (
                  <option key={i} value={motivo}>
                    {motivo}
                  </option>
                ))}
            </select>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", marginTop: "8px", color: theme.palette.text.disabled }}>
          No hay diferencias
        </div>
      )}
    </div>
  );
}


////////////////////////////////////////////////////////////////////////////////////////////////
// BLOQUE 4.2: FinalizationPanel
////////////////////////////////////////////////////////////////////////////////////////////////
function FinalizationPanel({ 
  tarjetasTotal,
  sumJustificaciones,
  responsable, 
  setResponsable, 
  comentarios, 
  setComentarios, 
  onEnviarCierre,
  finalTotal,
  brinksTotal,
  onImprimir
}) {
  const theme = useTheme();
  const balanceSinJustificar = tarjetasTotal - sumJustificaciones;

  const balanceColor =
    balanceSinJustificar >= 0
      ? theme.palette.success.main
      : theme.palette.error.main;

  // === ESTILOS ===

  const containerStyle = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: "16px",
    padding: "20px",
    marginTop: "20px",
    textAlign: "left",
    color: theme.palette.text.primary,
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
    // 💬 Ajustá este valor para cambiar el ancho del panel
    width: "100%", 
    maxWidth: "1360px"
  };

  const labelStyle = {
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "6px",
    display: "block",
    color: "#ffffff"
  };

  const inputResponsableStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "0.85rem",
    width: "240px",
    marginBottom: "12px",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
    transition: "border-color 0.3s ease",
    color: "#ffffff" // 👈 texto blanco dentro del input
  };
  

  const textareaStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "0.85rem",
    width: "100%",
    minHeight: "80px",
    resize: "none",
    marginBottom: "16px",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
    transition: "border-color 0.3s ease",
    color: "#ffffff" // 👈 texto blanco dentro del textarea
  };

  const buttonStyle = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${
      theme.palette.primary.dark || theme.palette.primary.main
    })`,
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    color: "#ffffff",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.3s ease",
    fontWeight: 600,
    fontSize: "0.85rem",
    boxShadow: "0 3px 6px rgba(0,0,0,0.15)"
  };

  const buttonHoverStyle = {
    transform: "scale(1.04)",
    boxShadow: "0 5px 10px rgba(0,0,0,0.25)"
  };

  const buttonActiveStyle = {
    transform: "scale(0.96)",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  };

  const buttonGroupStyle = {
    display: "flex",
    gap: "12px",
    marginTop: "8px"
  };

  const balanceTextStyle = {
    fontWeight: 700,
    fontSize: "1rem",
    color: "#ffffff",
    marginBottom: "16px"
  };

  // === COMPONENTE ===

  return (
    <div style={containerStyle}>
      <div style={balanceTextStyle}>
        Balance sin justificar: {formatCurrency(balanceSinJustificar)}
      </div>

      <label style={labelStyle}>Responsable</label>
      <input
        type="text"
        placeholder="Nombre del responsable"
        value={responsable}
        onChange={(e) => setResponsable(e.target.value)}
        style={inputResponsableStyle}
      />

      <label style={labelStyle}>Comentarios</label>
      <textarea
        placeholder="Escribe aquí tus comentarios"
        value={comentarios}
        onChange={(e) => setComentarios(e.target.value)}
        style={textareaStyle}
      />

      <div style={buttonGroupStyle}>
        <button
          onClick={onEnviarCierre}
          style={buttonStyle}
          onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
          onMouseDown={(e) => Object.assign(e.currentTarget.style, buttonActiveStyle)}
          onMouseUp={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
        >
          Enviar cierre 🖅
        </button>

        <button
          onClick={onImprimir}
          style={buttonStyle}
          onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
          onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
          onMouseDown={(e) => Object.assign(e.currentTarget.style, buttonActiveStyle)}
          onMouseUp={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
        >
          Imprimir 🖨️
        </button>
      </div>
    </div>
  );
}


// COMPONENTE PRINCIPAL: CierreCaja
function CierreCaja() {
  const theme = useTheme();
  const appContainerStyle = {
    margin: "0 auto",
    padding: "16px",
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily
  };

  const [fecha, setFecha] = useState(new Date());
  const [tiendas, setTiendas] = useState([]);
  const [asignaciones, setAsignaciones] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [selectedTienda, setSelectedTienda] = useState("");
  const [selectedUsuario, setSelectedUsuario] = useState("");
  const [panelVisible, setPanelVisible] = useState(false);
  const [billEntries, setBillEntries] = useState(initialBills);
  const [totalEfectivo, setTotalEfectivo] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [brinksEntries, setBrinksEntries] = useState([{ codigo: "", monto: 0 }]);
  const [brinksTotal, setBrinksTotal] = useState(0);
  const [dataAjustes, setDataAjustes] = useState({
    tiendas: [],
    medios_pago: [],
    asignaciones: {},
    motivos_error_pago: []
  });
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
        setSelectedTienda(ajustesData.tiendas[0]);
        if (
          ajustesData.asignaciones &&
          ajustesData.asignaciones[ajustesData.tiendas[0]] &&
          ajustesData.asignaciones[ajustesData.tiendas[0]].length > 0
        ) {
          const usuariosTienda = ajustesData.asignaciones[ajustesData.tiendas[0]].map(u => u.usuario);
          setUsuarios(usuariosTienda);
          setSelectedUsuario(usuariosTienda[0] || "");
        } else {
          setUsuarios(ajustesData.usuarios || []);
          setSelectedUsuario((ajustesData.usuarios && ajustesData.usuarios[0]) || "");
        }
      }
    }
    fetchAjustes();
  }, []);

  useEffect(() => {
    if (asignaciones && asignaciones[selectedTienda]) {
      setUsuarios(asignaciones[selectedTienda].map(u => u.usuario));
      setSelectedUsuario(asignaciones[selectedTienda][0]?.usuario || "");
    }
  }, [selectedTienda, asignaciones]);

  useEffect(() => {
    const sum = billEntries.reduce((acc, entry) => acc + (entry.total || 0), 0);
    setTotalEfectivo(sum);
    const fondo = 10000;
    setFinalTotal(sum - fondo);
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
      const queryUrl = `${API_BASE_URL}/api/cierres/existe?fecha=${encodeURIComponent(
        fechaStr
      )}&tienda=${encodeURIComponent(selectedTienda)}&usuario=${encodeURIComponent(
        selectedUsuario
      )}`;
      const response = await fetch(queryUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      if (result.existe) {
        alert("Cierre ya completado, revisar");
        return;
      }
      setPanelVisible(!panelVisible);
    } catch (error) {
      console.error("Error al conectar con la base de datos:", error);
      alert("Error al conectar con la base de datos.");
    }
  };

  // ── MODIFICADO: confirmCierre ahora incluye balance_sin_justificar, responsable y comentarios ──
  const confirmCierre = async () => {
    const fechaStr = fecha.toLocaleDateString("es-CL");
    // Calculamos el balance sin justificar
    const balanceSinJustificar = getGrandPaymentTotal() - sumJustificaciones;
    const exportData = {
      fecha: fechaStr,
      tienda: selectedTienda,
      usuario: selectedUsuario,
      total_billetes: parseFloat(totalEfectivo.toFixed(2)),
      final_balance: parseFloat(finalTotal.toFixed(2)),
      brinks_total: parseFloat(brinksTotal.toFixed(2)),
      // Convertimos paymentEntries a string para almacenar en la DB como JSON
      medios_pago: JSON.stringify(paymentEntries),
      justificaciones: justificacionesData,
      grand_difference_total: parseFloat(getGrandPaymentTotal().toFixed(2)),
      balance_sin_justificar: parseFloat(balanceSinJustificar.toFixed(2)), // NUEVO CAMPO
      responsable: responsable,  // NUEVO CAMPO
      comentarios: comentarios   // NUEVO CAMPO
    };
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/cierres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      alert("Información enviada a la DB correctamente.");
      setPanelVisible(false);
      setBillEntries(initialBills);
      setBrinksEntries([{ codigo: "", monto: 0 }]);
    } catch (err) {
      console.error("Error guardando el cierre:", err);
      alert(`Error al enviar cierre: ${err.message}`);
    }
  };

  const getGrandPaymentTotal = () =>
    paymentEntries.reduce((acc, row) => acc + (row.differenceVal || 0), 0);
  const dynamicEfectivo = finalTotal + brinksTotal;

  const handleImprimir = () => {
    const data = {
      fecha: fecha.toLocaleDateString("es-CL"),
      tienda: selectedTienda,
      usuario: selectedUsuario,
      nombre: selectedUsuario,
      mediosPago: paymentEntries,
      granTotalMedios: formatCurrency(getGrandPaymentTotal()),
      brinks: brinksEntries,
      brinksTotal: formatCurrency(brinksTotal),
      justificaciones: justificacionesData
    };
    setResumenData(data);
    setMostrarResumen(true);
  };

  return (
    <div style={appContainerStyle}>
      <HeaderControls
        fecha={fecha}
        setFecha={setFecha}
        tiendas={tiendas}
        selectedTienda={selectedTienda}
        setSelectedTienda={setSelectedTienda}
        usuarios={usuarios}
        selectedUsuario={selectedUsuario}
        setSelectedUsuario={setSelectedUsuario}
        onCerrarCaja={togglePanelCierre}
      />
      {panelVisible && (
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div>
            <BillsPanel
              billEntries={billEntries}
              updateRowTotal={updateRowTotal}
              finalTotal={finalTotal}
            />
            <BrinksPanel
              brinksEntries={brinksEntries}
              setBrinksEntries={setBrinksEntries}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
            <div style={{ display: "flex", gap: "16px" }}>
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
            </div>
            <FinalizationPanel
              tarjetasTotal={getGrandPaymentTotal()}
              sumJustificaciones={sumJustificaciones}
              responsable={responsable}
              setResponsable={setResponsable}
              comentarios={comentarios}
              setComentarios={setComentarios}
              onEnviarCierre={confirmCierre}
              finalTotal={finalTotal}
              brinksTotal={brinksTotal}
              onImprimir={handleImprimir}
            />
          </div>
        </div>
      )}
      {mostrarResumen && (
        <Imprimir
          open={mostrarResumen}
          resumenData={resumenData}
          onClose={() => setMostrarResumen(false)}
        />
      )}
    </div>
  );
}

//
// Función auxiliar para cargar ajustes desde el backend
//
async function loadAjustesFromBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/localStorage`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error loading ajustes from backend:", error);
    return {
      tiendas: [],
      medios_pago: [],
      asignaciones: {},
      motivos_error_pago: []
    };
  }
}

export default CierreCaja;
