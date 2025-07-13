import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Importa Axios para realizar peticiones HTTP
import { API_BASE_URL } from '../config';
import { keyframes } from '@emotion/react';

// Datos iniciales de configuración
const initialData = {
  tiendas: ["NMmirami", "NNottaviaca", "NNmirato"],
  usuarios: ["UsuarioX", "UsuarioY"],
  motivos_error_pago: [],
  medios_pago: [],
  asignaciones: {
    "NMmirami": [],
    "NNottaviaca": [],
    "NNmirato": []
  },
  config_font_size: 14,
  config_theme: "Oscuro",
  config_language: "Español",
  config_debug: false,
  config_logging: false
};

// Animación de aparición (fade in)
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Componente principal de ajustes
function AjustesTab() {
  // Estado para almacenar los datos de configuración
  const [data, setData] = useState(initialData);
  // Estado para controlar la pestaña activa (Gestión, Cierre, Configuraciones)
  const [mode, setMode] = useState("Gestion");

  // Al montar el componente, se obtienen los datos desde el backend
  useEffect(() => {
    // Realiza una petición GET con Axios para obtener los datos
    axios.get(`${API_BASE_URL}/localStorage`) // Ajusta la URL según corresponda
      .then(response => {
        const jsonData = response.data;
        console.log("JSON recibido desde backend:", jsonData);
        // Se omiten propiedades que no se requieren
        const { cajas, usuario_legacy, ...filteredData } = jsonData;
        // Combina los datos recibidos con los valores iniciales para mantener los defaults
        const mergedData = {
          ...initialData,
          ...filteredData,
          tiendas: filteredData.tiendas || initialData.tiendas,
          usuarios: filteredData.usuarios || initialData.usuarios,
          asignaciones: filteredData.asignaciones || initialData.asignaciones,
          motivos_error_pago: filteredData.motivos_error_pago || initialData.motivos_error_pago,
          medios_pago: filteredData.medios_pago || initialData.medios_pago,
          config_font_size: filteredData.config_font_size !== undefined ? filteredData.config_font_size : initialData.config_font_size,
          config_theme: filteredData.config_theme || initialData.config_theme,
          config_language: filteredData.config_language || initialData.config_language,
          config_debug: filteredData.config_debug !== undefined ? filteredData.config_debug : initialData.config_debug,
          config_logging: filteredData.config_logging !== undefined ? filteredData.config_logging : initialData.config_logging
        };
        console.log("Datos combinados:", mergedData);
        setData(mergedData);
      })
      .catch(error => {
        console.error("Error al cargar los ajustes desde el backend:", error);
      });
  }, []);

  // Función para guardar los datos en el backend
  const saveData = () => {
    // Realiza una petición POST con Axios para enviar los datos
    axios.post(`${API_BASE_URL}/localStorage`, data, {
      headers: { "Content-Type": "application/json" }
    })
      .then(response => {
        console.log("Archivo actualizado correctamente en el backend:", response.data);
      })
      .catch(error => {
        console.error("Error al actualizar el archivo en el backend:", error);
      });
  };

  // Estilos para el contenedor principal (incluye animación de aparición)
  const containerStyle = {
    backgroundColor: "#1F1F1F",
    color: "#E0E0E0",
    padding: "24px",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: `${fadeIn} 0.6s ease-out`,
    width: "100%",
    background: "linear-gradient(135deg, #1F1F1F 0%, #252528 100%)",
  };

  // Estilos para la tarjeta principal con bordes suaves y sombra sutil
  const cardStyle = {
    backgroundColor: "#2D2D2D",
    border: "1px solid rgba(74, 144, 226, 0.1)",
    borderRadius: "16px",
    padding: "28px",
    marginBottom: "24px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(74, 144, 226, 0.05)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: `${fadeIn} 0.7s ease-out`,
    backdropFilter: "blur(8px)",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "1px",
      background: "linear-gradient(90deg, transparent, rgba(74, 144, 226, 0.3), transparent)",
    }
  };

  // Función que genera los estilos para los botones según su estado activo
  const buttonStyle = (active) => ({
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: active ? "600" : "500",
    letterSpacing: "0.3px",
    border: active ? "1px solid rgba(74, 144, 226, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    cursor: "pointer",
    background: active
      ? "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)"
      : "linear-gradient(135deg, rgba(45, 45, 45, 0.8) 0%, rgba(35, 35, 35, 0.9) 100%)",
    color: active ? "#FFFFFF" : "#E0E0E0",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: active ? "translateY(-1px)" : "translateY(0)",
    boxShadow: active 
      ? "0 4px 16px rgba(74, 144, 226, 0.25), 0 2px 8px rgba(0,0,0,0.3)" 
      : "0 2px 8px rgba(0,0,0,0.2)",
    backdropFilter: "blur(4px)",
    position: "relative",
    overflow: "hidden",
    "&:hover": {
      transform: active ? "translateY(-2px)" : "translateY(-1px)",
      boxShadow: active 
        ? "0 6px 20px rgba(74, 144, 226, 0.3), 0 4px 12px rgba(0,0,0,0.4)"
        : "0 4px 12px rgba(0,0,0,0.3)",
    }
  });

  // Estilos para los inputs con mayor padding y bordes sutiles
  const inputStyle = {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(45, 45, 45, 0.6)",
    color: "#E0E0E0",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    width: "100%",
    marginBottom: "10px",
    fontSize: "13px",
    fontWeight: "400",
    letterSpacing: "0.2px",
    backdropFilter: "blur(4px)",
    outline: "none",
    "&:focus": {
      border: "1px solid rgba(74, 144, 226, 0.4)",
      backgroundColor: "rgba(45, 45, 45, 0.8)",
      boxShadow: "0 0 0 3px rgba(74, 144, 226, 0.1)",
      transform: "translateY(-1px)"
    },
    "&:hover": {
      border: "1px solid rgba(255, 255, 255, 0.12)",
      backgroundColor: "rgba(45, 45, 45, 0.7)"
    }
  };

  // Estilos para los elementos de lista con fondo semitransparente y sombra sutil
  const listItemStyle = {
    padding: "14px 18px",
    margin: "6px 0",
    borderRadius: "8px",
    backgroundColor: "rgba(45, 45, 45, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    backdropFilter: "blur(4px)",
    position: "relative",
    fontSize: "13px",
    "&:hover": {
      backgroundColor: "rgba(45, 45, 45, 0.6)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)"
    }
  };

  // Renderizado principal del componente con la barra de navegación y contenido según la pestaña activa
  return (
    <div style={containerStyle}>
      {/* Barra de navegación para seleccionar el modo */}
      <div style={{ 
        display: "flex", 
        marginBottom: "28px", 
        gap: "6px",
        padding: "4px",
        backgroundColor: "rgba(45, 45, 45, 0.3)",
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(8px)"
      }}>
        <button onClick={() => setMode("Gestion")} style={buttonStyle(mode === "Gestion")}>
          Gestión
        </button>
        <button onClick={() => setMode("Cierre")} style={buttonStyle(mode === "Cierre")}>
          Actualización del cierre
        </button>
        <button onClick={() => setMode("Configuraciones")} style={buttonStyle(mode === "Configuraciones")}>
          Configuraciones
        </button>
      </div>

      {/* Tarjeta principal que contiene el contenido de cada pestaña */}
      <div style={cardStyle}>
        {mode === "Gestion" && <GestionFrame data={data} setData={setData} saveData={saveData} styles={{ inputStyle, listItemStyle, buttonStyle }} />}
        {mode === "Cierre" && <CierreFrame data={data} setData={setData} saveData={saveData} styles={{ inputStyle, listItemStyle, buttonStyle }} />}
        {mode === "Configuraciones" && <ConfiguracionesFrame data={data} setData={setData} saveData={saveData} styles={{ inputStyle, buttonStyle }} />}
      </div>
    </div>
  );
}

// Componente para la gestión de tiendas y usuarios
function GestionFrame({ data, setData, saveData, styles }) {
  // Estados locales para manejar la tienda seleccionada, nuevos elementos y búsqueda
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [newTienda, setNewTienda] = useState("");
  const [usuario, setUsuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selecciona una tienda de la lista
  const handleSelectTienda = (tienda) => {
    setSelectedTienda(tienda);
  };

  // Agrega una nueva tienda y crea su asignación vacía
  const agregarTienda = () => {
    if (newTienda && !data.tiendas.includes(newTienda)) {
      data.tiendas.push(newTienda);
      data.asignaciones[newTienda] = [];
      setData({ ...data });
      saveData();
    }
    setNewTienda("");
  };

  // Elimina la tienda seleccionada y su asignación
  const eliminarTienda = () => {
    if (selectedTienda) {
      data.tiendas = data.tiendas.filter((t) => t !== selectedTienda);
      delete data.asignaciones[selectedTienda];
      setSelectedTienda(null);
      setData({ ...data });
      saveData();
    }
  };

  // Asigna un usuario a la tienda seleccionada
  const asignarUsuario = () => {
    if (selectedTienda && usuario.trim() && nombre.trim()) {
      const asignados = data.asignaciones[selectedTienda] || [];
      if (!asignados.find((u) => u.usuario === usuario.trim())) {
        asignados.push({ usuario: usuario.trim(), nombre: nombre.trim() });
        data.asignaciones[selectedTienda] = asignados;
        setData({ ...data });
        saveData();
      }
      setUsuario("");
      setNombre("");
    }
  };

  // Remueve un usuario asignado de la lista
  const removerUsuario = (index) => {
    if (selectedTienda && index >= 0) {
      data.asignaciones[selectedTienda].splice(index, 1);
      setData({ ...data });
      saveData();
    }
  };

  // Filtra la lista de usuarios asignados según el término de búsqueda
  const filteredUsuarios = selectedTienda
    ? (data.asignaciones[selectedTienda] || []).filter(usr =>
        usr.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usr.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Renderiza la sección de gestión de tiendas y usuarios
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Sección de Tiendas */}
      <div style={{ flex: 1 }}>
        <h3 style={{ 
          color: "#4A90E2", 
          marginBottom: "16px", 
          fontSize: "1.05rem",
          fontWeight: "600",
          letterSpacing: "0.3px",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-4px",
            left: "0",
            width: "40px",
            height: "2px",
            background: "linear-gradient(90deg, #4A90E2, rgba(74, 144, 226, 0.3))",
            borderRadius: "2px"
          }
        }}>Tiendas</h3>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {data.tiendas.map((tienda) => (
            <li
              key={tienda}
              onClick={() => handleSelectTienda(tienda)}
              style={{
                ...styles.listItemStyle,
                backgroundColor: selectedTienda === tienda 
                  ? "rgba(74, 144, 226, 0.15)" 
                  : "rgba(45, 45, 45, 0.4)",
                border: selectedTienda === tienda 
                  ? "1px solid rgba(74, 144, 226, 0.3)" 
                  : "1px solid rgba(255, 255, 255, 0.06)",
                cursor: "pointer",
                fontWeight: selectedTienda === tienda ? "500" : "400",
                color: selectedTienda === tienda ? "#FFFFFF" : "#E0E0E0",
                boxShadow: selectedTienda === tienda 
                  ? "0 4px 16px rgba(74, 144, 226, 0.15), 0 2px 8px rgba(0,0,0,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  backgroundColor: selectedTienda === tienda 
                    ? "rgba(74, 144, 226, 0.2)" 
                    : "rgba(45, 45, 45, 0.6)",
                }
              }}
            >
              {tienda}
            </li>
          ))}
        </ul>
        {/* Input para agregar una nueva tienda */}
        <input
          type="text"
          placeholder="Nueva Tienda"
          value={newTienda}
          onChange={(e) => setNewTienda(e.target.value)}
          style={styles.inputStyle}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={agregarTienda} 
            style={{ 
              ...styles.buttonStyle(false),
              background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
              border: "1px solid rgba(74, 144, 226, 0.2)",
              flex: 1,
              fontWeight: "500",
              letterSpacing: "0.3px"
            }}>
            ➕ Agregar Tienda
          </button>
          <button 
            onClick={eliminarTienda} 
            style={{ 
              ...styles.buttonStyle(false),
              background: "linear-gradient(135deg, #C85A5A 0%, #B04747 100%)",
              border: "1px solid rgba(200, 90, 90, 0.2)",
              flex: 1,
              fontWeight: "500",
              letterSpacing: "0.3px"
            }}>
            🗑️ Eliminar Tienda
          </button>
        </div>
      </div>

      {/* Sección de Usuarios */}
      <div style={{ flex: 2 }}>
        <h3 style={{ 
          color: "#4A90E2", 
          marginBottom: "16px", 
          fontSize: "1.05rem",
          fontWeight: "600",
          letterSpacing: "0.3px"
        }}>
          {selectedTienda ? `Usuarios en ${selectedTienda}` : "Seleccione una tienda"}
        </h3>
        {selectedTienda && (
          <>
            {/* Input para búsqueda de usuarios */}
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.inputStyle}
            />
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {filteredUsuarios.map((usr, idx) => (
                <li key={idx} style={styles.listItemStyle}>
                  <div>
                    <div style={{ fontWeight: "500", color: "#4A90E2", fontSize: "13px" }}>{usr.usuario}</div>
                    <div style={{ fontSize: "12px", color: "rgba(224,224,224,0.7)" }}>{usr.nombre}</div>
                  </div>
                  <button 
                    onClick={() => removerUsuario(idx)} 
                    style={{ 
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #C85A5A 0%, #B04747 100%)",
                      border: "1px solid rgba(200, 90, 90, 0.2)",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "500",
                      letterSpacing: "0.2px",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 12px rgba(200, 90, 90, 0.3)"
                      }
                    }}>
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
            {/* Inputs para asignar un nuevo usuario */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <input
                type="text"
                placeholder="Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                style={styles.inputStyle}
              />
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={styles.inputStyle}
              />
            </div>
            <button 
              onClick={asignarUsuario} 
              style={{ 
                ...styles.buttonStyle(false),
                background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
                border: "1px solid rgba(74, 144, 226, 0.2)",
                width: "100%",
                marginTop: "10px",
                fontWeight: "500",
                letterSpacing: "0.3px"
              }}>
              👤 Asignar Usuario
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Componente para la gestión de motivos de error de pago y medios de pago
function CierreFrame({ data, setData, saveData, styles }) {
  // Estados locales para manejar nuevos motivos y medios
  const [newMotivo, setNewMotivo] = useState("");
  const [newMedio, setNewMedio] = useState("");

  // Agrega un nuevo motivo de error de pago
  const agregarMotivo = () => {
    if (newMotivo && !data.motivos_error_pago.includes(newMotivo)) {
      data.motivos_error_pago.push(newMotivo);
      setData({ ...data });
      saveData();
    }
    setNewMotivo("");
  };

  // Elimina un motivo de error de pago
  const eliminarMotivo = (index) => {
    data.motivos_error_pago.splice(index, 1);
    setData({ ...data });
    saveData();
  };

  // Agrega un nuevo medio de pago
  const agregarMedio = () => {
    if (newMedio && !data.medios_pago.includes(newMedio)) {
      data.medios_pago.push(newMedio);
      setData({ ...data });
      saveData();
    }
    setNewMedio("");
  };

  // Elimina un medio de pago
  const eliminarMedio = (index) => {
    data.medios_pago.splice(index, 1);
    setData({ ...data });
    saveData();
  };

  // Renderiza la sección de motivos de error de pago y medios de pago
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Sección de Motivos de Error de Pago */}
      <div style={{ flex: 1 }}>
        <h3 style={{ 
          color: "#4A90E2", 
          marginBottom: "16px", 
          fontSize: "1.05rem",
          fontWeight: "600",
          letterSpacing: "0.3px"
        }}>Motivos de Error de Pago</h3>
        <input
          type="text"
          placeholder="Ingrese motivo"
          value={newMotivo}
          onChange={(e) => setNewMotivo(e.target.value)}
          style={styles.inputStyle}
        />
        <button 
          onClick={agregarMotivo} 
          style={{ 
            ...styles.buttonStyle(false),
            background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
            width: "100%",
            marginBottom: "12px",
            fontWeight: "500",
            letterSpacing: "0.2px"
          }}>
          ➕ Agregar Motivo
        </button>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {data.motivos_error_pago.map((motivo, idx) => (
            <li key={idx} style={styles.listItemStyle}>
              <span>{motivo}</span>
              <button 
                onClick={() => eliminarMotivo(idx)} 
                style={{ 
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #C85A5A 0%, #B04747 100%)",
                  border: "1px solid rgba(200, 90, 90, 0.2)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                  letterSpacing: "0.2px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Sección de Medios de Pago */}
      <div style={{ flex: 1 }}>
        <h3 style={{ 
          color: "#4A90E2", 
          marginBottom: "16px", 
          fontSize: "1.05rem",
          fontWeight: "600",
          letterSpacing: "0.3px"
        }}>Medios de Pago</h3>
        <input
          type="text"
          placeholder="Ingrese medio"
          value={newMedio}
          onChange={(e) => setNewMedio(e.target.value)}
          style={styles.inputStyle}
        />
        <button 
          onClick={agregarMedio} 
          style={{ 
            ...styles.buttonStyle(false),
            background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
            width: "100%",
            marginBottom: "12px",
            fontWeight: "500",
            letterSpacing: "0.2px"
          }}>
          ➕ Agregar Medio
        </button>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {data.medios_pago.map((medio, idx) => (
            <li key={idx} style={styles.listItemStyle}>
              <span>{medio}</span>
              <button 
                onClick={() => eliminarMedio(idx)} 
                style={{ 
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #C85A5A 0%, #B04747 100%)",
                  border: "1px solid rgba(200, 90, 90, 0.2)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                  letterSpacing: "0.2px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Componente para gestionar configuraciones adicionales
function ConfiguracionesFrame({ data, setData, saveData, styles }) {
  // Estados locales para cada configuración
  const [fontSize, setFontSize] = useState(data.config_font_size);
  const [theme, setTheme] = useState(data.config_theme);
  const [language, setLanguage] = useState(data.config_language);
  const [debug, setDebug] = useState(data.config_debug);
  const [logging, setLogging] = useState(data.config_logging);

  // Restaura las configuraciones a los valores por defecto
  const restoreDefaults = () => {
    setFontSize(14);
    setTheme("Oscuro");
    setLanguage("Español");
    setDebug(false);
    setLogging(false);
    alert("Configuraciones restauradas a los valores por defecto.");
  };

  // Guarda las configuraciones actuales en el estado y en el backend
  const saveConfigurations = () => {
    const newData = {
      ...data,
      config_font_size: fontSize,
      config_theme: theme,
      config_language: language,
      config_debug: debug,
      config_logging: logging
    };
    setData(newData);
    saveData();
    alert("Configuraciones guardadas correctamente.");
  };

  // Renderiza la sección de configuraciones adicionales
  return (
    <div>
      <h3 style={{ 
        color: "#4A90E2", 
        marginBottom: "20px", 
        fontSize: "1.05rem",
        fontWeight: "600",
        letterSpacing: "0.3px"
      }}>Configuraciones adicionales</h3>
      
      {/* Configuración del tamaño de fuente */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "16px", 
        gap: "14px",
        padding: "14px",
        backgroundColor: "rgba(45, 45, 45, 0.3)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <label style={{ 
          flex: "0 0 160px", 
          fontSize: "13px",
          fontWeight: "500",
          letterSpacing: "0.2px",
          color: "#E0E0E0"
        }}>Tamaño de fuente:</label>
        <input
          type="number"
          min="8"
          max="32"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          style={{
            ...styles.inputStyle,
            maxWidth: "100px",
            margin: "0"
          }}
        />
      </div>
      
      {/* Configuración del tema */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "16px", 
        gap: "14px",
        padding: "14px",
        backgroundColor: "rgba(45, 45, 45, 0.3)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <label style={{ 
          flex: "0 0 160px", 
          fontSize: "13px",
          fontWeight: "500",
          letterSpacing: "0.2px",
          color: "#E0E0E0"
        }}>Tema:</label>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)} 
          style={{ 
            ...styles.inputStyle,
            cursor: "pointer",
            padding: "10px 14px",
            fontSize: "13px",
            margin: "0"
          }}>
          <option value="Oscuro">Oscuro</option>
          <option value="Claro">Claro</option>
          <option value="Azul">Azul</option>
        </select>
      </div>
      
      {/* Configuración del idioma */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "16px", 
        gap: "14px",
        padding: "14px",
        backgroundColor: "rgba(45, 45, 45, 0.3)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <label style={{ 
          flex: "0 0 160px", 
          fontSize: "13px",
          fontWeight: "500",
          letterSpacing: "0.2px",
          color: "#E0E0E0"
        }}>Idioma:</label>
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)} 
          style={{ 
            ...styles.inputStyle,
            cursor: "pointer",
            padding: "10px 14px",
            fontSize: "13px",
            margin: "0"
          }}>
          <option value="Español">Español</option>
          <option value="Inglés">Inglés</option>
          <option value="Francés">Francés</option>
        </select>
      </div>
      
      {/* Configuración del modo de depuración */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "16px", 
        gap: "14px",
        padding: "14px",
        backgroundColor: "rgba(45, 45, 45, 0.3)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <label style={{ 
          flex: "0 0 160px", 
          fontSize: "13px",
          fontWeight: "500",
          letterSpacing: "0.2px",
          color: "#E0E0E0"
        }}>Modo de depuración:</label>
        <input
          type="checkbox"
          checked={debug}
          onChange={(e) => setDebug(e.target.checked)}
          style={{ 
            transform: "scale(1.2)",
            accentColor: "#4A90E2",
            cursor: "pointer"
          }}
        />
      </div>
      
      {/* Configuración del registro de eventos */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        marginBottom: "22px", 
        gap: "14px",
        padding: "14px",
        backgroundColor: "rgba(45, 45, 45, 0.3)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.05)"
      }}>
        <label style={{ 
          flex: "0 0 160px", 
          fontSize: "13px",
          fontWeight: "500",
          letterSpacing: "0.2px",
          color: "#E0E0E0"
        }}>Registro de eventos:</label>
        <input
          type="checkbox"
          checked={logging}
          onChange={(e) => setLogging(e.target.checked)}
          style={{ 
            transform: "scale(1.2)",
            accentColor: "#4A90E2",
            cursor: "pointer"
          }}
        />
      </div>
      
      {/* Botones para restaurar y guardar las configuraciones */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button 
          onClick={restoreDefaults} 
          style={{ 
            ...styles.buttonStyle(false),
            background: "linear-gradient(135deg, #D4A574 0%, #C19660 100%)",
            border: "1px solid rgba(212, 165, 116, 0.2)",
            flex: 1,
            fontWeight: "500",
            letterSpacing: "0.2px"
          }}>
          🔄 Restaurar valores por defecto
        </button>
        <button 
          onClick={saveConfigurations} 
          style={{ 
            ...styles.buttonStyle(false),
            background: "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
            border: "1px solid rgba(74, 144, 226, 0.2)",
            flex: 1,
            fontWeight: "500",
            letterSpacing: "0.2px"
          }}>
          💾 Guardar Configuraciones
        </button>
      </div>
    </div>
  );
}

export default AjustesTab;
