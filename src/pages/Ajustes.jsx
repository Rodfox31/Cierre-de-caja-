import React, { useState, useEffect } from 'react';
import { fetchWithFallback, axiosWithFallback } from '../config';
import { keyframes } from '@emotion/react';
import { useTheme, alpha } from '@mui/material/styles';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getRoleLabel, getRoleBadgeColor, ROLES } from '../utils/permissions';

// Datos iniciales de configuración
const initialData = {
  tiendas: ["Recoleta", "Alto Palermo", "Unicenter", "Solar", "Cordoba", "Rosario"],
  motivos_error_pago: [],
  medios_pago: [],
  config_font_size: 14
};

// Animación de aparición (fade in)
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Componente principal de ajustes
function AjustesTab() {
  const theme = useTheme();
  const { currentUser } = useAuth();
  
  // Estado para almacenar los datos de configuración
  const [data, setData] = useState(initialData);
  // Estado para controlar la pestaña activa (Gestión, Cierre, Backups, Usuarios)
  const [mode, setMode] = useState("Gestion");

  // Al montar el componente, se obtienen los datos desde el backend
  useEffect(() => {
    axiosWithFallback('/localStorage')
      .then(response => {
        const jsonData = response.data;
        console.log("JSON recibido desde backend:", jsonData);
        // Se omiten propiedades que no se requieren
        const { cajas, usuario_legacy, usuarios, asignaciones, user_passwords, ...filteredData } = jsonData;
        // Combina los datos recibidos con los valores iniciales para mantener los defaults
        const mergedData = {
          ...initialData,
          ...filteredData,
          tiendas: filteredData.tiendas || initialData.tiendas,
          motivos_error_pago: filteredData.motivos_error_pago || initialData.motivos_error_pago,
          medios_pago: filteredData.medios_pago || initialData.medios_pago,
          config_font_size: filteredData.config_font_size !== undefined ? filteredData.config_font_size : initialData.config_font_size
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
    axiosWithFallback('/localStorage', {
      method: 'post',
      data,
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
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    padding: "24px",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: `${fadeIn} 0.6s ease-out`,
    width: "100%",
    background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
  };

  // Estilos para la tarjeta principal con bordes suaves y sombra sutil
  const cardStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
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
    border: active ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
    borderRadius: "8px",
    cursor: "pointer",
    background: active
      ? `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`,
    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: active ? "translateY(-1px)" : "translateY(0)",
    boxShadow: active 
      ? `0 4px 16px ${alpha(theme.palette.info.main, 0.25)}, 0 2px 8px rgba(0,0,0,0.3)` 
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
    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    color: theme.palette.text.primary,
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
          🏪 Gestión
        </button>
        <button onClick={() => setMode("Cierre")} style={buttonStyle(mode === "Cierre")}>
          📝 Actualización del cierre
        </button>
        <button onClick={() => setMode("Backups")} style={buttonStyle(mode === "Backups")}>
          💾 Respaldos
        </button>
        {/* Solo mostrar pestaña de Usuarios si es admin */}
        {currentUser?.role === 'admin' && (
          <button onClick={() => setMode("Usuarios")} style={buttonStyle(mode === "Usuarios")}>
            👥 Usuarios y Roles
          </button>
        )}
      </div>

      {/* Tarjeta principal que contiene el contenido de cada pestaña */}
      <div style={cardStyle}>
        {mode === "Gestion" && <GestionFrame data={data} setData={setData} saveData={saveData} styles={{ inputStyle, listItemStyle, buttonStyle }} />}
        {mode === "Cierre" && <CierreFrame data={data} setData={setData} saveData={saveData} styles={{ inputStyle, listItemStyle, buttonStyle }} />}
        {mode === "Backups" && <BackupManager styles={{ inputStyle, buttonStyle }} />}
        {mode === "Usuarios" && currentUser?.role === 'admin' && <UsuariosFrame styles={{ inputStyle, listItemStyle, buttonStyle }} />}
      </div>
    </div>
  );
}

// Componente para la gestión de tiendas y usuarios
function GestionFrame({ data, setData, saveData, styles }) {
  const theme = useTheme();
  
  // Estados locales para manejar la tienda seleccionada, nuevos elementos y búsqueda
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [newTienda, setNewTienda] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allUsers, setAllUsers] = useState([]); // Usuarios desde la DB
  const [loading, setLoading] = useState(false);
  
  // Cargar usuarios desde la API al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/users');
      const result = await response.json();
      
      if (result.success) {
        setAllUsers(result.users);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Selecciona una tienda de la lista
  const handleSelectTienda = (tienda) => {
    setSelectedTienda(tienda);
  };

  // Agrega una nueva tienda
  const agregarTienda = () => {
    if (newTienda && !data.tiendas.includes(newTienda)) {
      data.tiendas.push(newTienda);
      setData({ ...data });
      saveData();
    }
    setNewTienda("");
  };

  // Elimina la tienda seleccionada
  const eliminarTienda = () => {
    if (selectedTienda) {
      data.tiendas = data.tiendas.filter((t) => t !== selectedTienda);
      setSelectedTienda(null);
      setData({ ...data });
      saveData();
      loadUsers(); // Recargar usuarios
    }
  };

  // Asignar usuario existente a la tienda seleccionada
  const asignarUsuarioExistente = async (userId) => {
    if (!selectedTienda) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/users/assign-tienda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tienda: selectedTienda,
          action: 'add',
          assignedBy: currentUser // Para auditoría
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadUsers(); // Recargar lista de usuarios
      } else {
        alert('Error asignando usuario: ' + result.error);
      }
    } catch (error) {
      console.error('Error asignando usuario:', error);
      alert('Error asignando usuario');
    }
  };

  // Remover usuario de la tienda seleccionada
  const removerUsuario = async (userId) => {
    if (!selectedTienda) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/users/assign-tienda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tienda: selectedTienda,
          action: 'remove',
          assignedBy: currentUser // Para auditoría
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        loadUsers(); // Recargar lista de usuarios
      } else {
        alert('Error removiendo usuario: ' + result.error);
      }
    } catch (error) {
      console.error('Error removiendo usuario:', error);
      alert('Error removiendo usuario');
    }
  };

  // Filtrar usuarios de la tienda seleccionada
  const usuariosTienda = selectedTienda
    ? allUsers.filter(user => 
        user.sucursales && user.sucursales.includes(selectedTienda)
      )
    : [];
  
  // Aplicar búsqueda
  const filteredUsuarios = usuariosTienda.filter(usr =>
    (usr.username && usr.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (usr.full_name && usr.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (usr.email && usr.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Usuarios disponibles para asignar (que NO estén en la tienda seleccionada)
  const usuariosDisponibles = selectedTienda
    ? allUsers.filter(user => 
        !user.sucursales || !user.sucursales.includes(selectedTienda)
      )
    : [];

  // Renderiza la sección de gestión de tiendas y usuarios
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Sección de Tiendas */}
      <div style={{ flex: 1 }}>
        <h3 style={{ 
          color: theme.palette.info.main, 
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
            background: `linear-gradient(90deg, ${theme.palette.info.main}, ${alpha(theme.palette.info.main, 0.3)})`,
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
                  ? alpha(theme.palette.info.main, 0.15) 
                  : alpha(theme.palette.background.paper, 0.4),
                border: selectedTienda === tienda 
                  ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` 
                  : `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
                cursor: "pointer",
                fontWeight: selectedTienda === tienda ? "500" : "400",
                color: selectedTienda === tienda ? theme.palette.text.primary : theme.palette.text.secondary,
                boxShadow: selectedTienda === tienda 
                  ? `0 4px 16px ${alpha(theme.palette.info.main, 0.15)}, 0 2px 8px rgba(0,0,0,0.3)`
                  : "0 2px 8px rgba(0,0,0,0.2)",
                "&:hover": {
                  backgroundColor: selectedTienda === tienda 
                    ? alpha(theme.palette.info.main, 0.2) 
                    : alpha(theme.palette.background.paper, 0.6),
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
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
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
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
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
          color: theme.palette.info.main, 
          marginBottom: "16px", 
          fontSize: "1.05rem",
          fontWeight: "600",
          letterSpacing: "0.3px"
        }}>
          {selectedTienda ? `Usuarios en ${selectedTienda}` : "Seleccione una tienda"}
        </h3>
        {selectedTienda && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: theme.palette.text.secondary }}>
                Cargando usuarios...
              </div>
            ) : (
              <>
                {/* Input para búsqueda de usuarios */}
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.inputStyle}
                />
                
                {/* Lista de usuarios asignados a esta tienda */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: theme.palette.text.secondary, marginBottom: '10px' }}>
                    Usuarios asignados ({filteredUsuarios.length})
                  </h4>
                  <ul style={{ listStyleType: "none", padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredUsuarios.map((usr) => (
                      <li key={usr.id} style={styles.listItemStyle}>
                        <div>
                          <div style={{ fontWeight: "500", color: theme.palette.info.main, fontSize: "13px" }}>
                            {usr.username}
                          </div>
                          <div style={{ fontSize: "12px", color: alpha(theme.palette.text.primary, 0.7) }}>
                            {usr.full_name}
                          </div>
                          <div style={{ fontSize: "11px", color: alpha(theme.palette.text.primary, 0.5) }}>
                            {usr.email}
                          </div>
                        </div>
                        <button 
                          onClick={() => removerUsuario(usr.id)} 
                          style={{ 
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                            color: theme.palette.text.primary,
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
                          Remover
                        </button>
                      </li>
                    ))}
                    {filteredUsuarios.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: theme.palette.text.secondary, fontSize: '0.9rem' }}>
                        No hay usuarios asignados a esta tienda
                      </div>
                    )}
                  </ul>
                </div>
                
                {/* Lista de usuarios disponibles para asignar */}
                {usuariosDisponibles.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: theme.palette.text.secondary, marginBottom: '10px' }}>
                      Usuarios disponibles para asignar ({usuariosDisponibles.length})
                    </h4>
                    <ul style={{ listStyleType: "none", padding: 0, maxHeight: '250px', overflowY: 'auto' }}>
                      {usuariosDisponibles.map((usr) => (
                        <li key={usr.id} style={{
                          ...styles.listItemStyle,
                          backgroundColor: alpha(theme.palette.background.paper, 0.3)
                        }}>
                          <div>
                            <div style={{ fontWeight: "500", fontSize: "13px" }}>
                              {usr.username}
                            </div>
                            <div style={{ fontSize: "12px", color: alpha(theme.palette.text.primary, 0.7) }}>
                              {usr.full_name}
                            </div>
                            <div style={{ fontSize: "11px", color: alpha(theme.palette.text.primary, 0.5) }}>
                              {usr.email}
                            </div>
                          </div>
                          <button 
                            onClick={() => asignarUsuarioExistente(usr.id)} 
                            style={{ 
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                              color: theme.palette.text.primary,
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: "500",
                              letterSpacing: "0.2px",
                              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                              "&:hover": {
                                transform: "translateY(-1px)",
                                boxShadow: "0 4px 12px rgba(90, 200, 90, 0.3)"
                              }
                            }}>
                            Asignar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente para la gestión de motivos de error de pago y medios de pago
function CierreFrame({ data, setData, saveData, styles }) {
  const theme = useTheme();
  
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
          color: theme.palette.info.main, 
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
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
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
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  color: theme.palette.text.primary,
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
          color: theme.palette.info.main, 
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
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
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
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  color: theme.palette.text.primary,
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

// ================================================================================================
// COMPONENTE PARA GESTIÓN DE RESPALDOS
// ================================================================================================
function BackupManager({ styles }) {
  const theme = useTheme();
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  // Cargar lista de respaldos
  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await axiosWithFallback('/api/backup/list');
      setBackups(response.data.backups || []);
      setStats(response.data.stats || null);
      setMessage({ text: '', type: '' });
    } catch (error) {
      setMessage({ text: `Error cargando respaldos: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Crear respaldo manual
  const createBackup = async () => {
    if (!confirm('¿Desea crear un respaldo de la base de datos ahora?')) return;
    
    setLoading(true);
    setMessage({ text: 'Creando respaldo...', type: 'info' });
    
    try {
      const response = await axiosWithFallback('/api/backup/create', { method: 'POST' });
      setMessage({ text: 'Respaldo creado exitosamente', type: 'success' });
      loadBackups(); // Recargar lista
    } catch (error) {
      setMessage({ text: `Error creando respaldo: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Exportar mes a CSV
  const exportCSV = async () => {
    setLoading(true);
    setMessage({ text: 'Exportando a CSV...', type: 'info' });
    
    try {
      const response = await axiosWithFallback('/api/backup/export-csv', {
        method: 'POST',
        data: { month: exportMonth, year: exportYear }
      });
      
      if (response.data.exported) {
        setMessage({ 
          text: `CSV exportado: ${response.data.file.fileName} (${response.data.file.recordCount} registros)`, 
          type: 'success' 
        });
      } else {
        setMessage({ text: 'No hay datos para exportar en el período seleccionado', type: 'warning' });
      }
      
      loadBackups(); // Recargar lista
    } catch (error) {
      setMessage({ text: `Error exportando CSV: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Verificar respaldo
  const verifyBackup = async (backupPath) => {
    setLoading(true);
    setMessage({ text: 'Verificando respaldo...', type: 'info' });
    
    try {
      const response = await axiosWithFallback('/api/backup/verify', {
        method: 'POST',
        data: { backupPath }
      });
      
      setMessage({ 
        text: `✓ Respaldo verificado (${response.data.details.recordCount} registros)`, 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ text: `✗ Respaldo corrupto: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cargar respaldos al montar
  useEffect(() => {
    loadBackups();
  }, []);

  // Formatear tamaño de archivo
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        color: theme.palette.success.main, 
        marginBottom: "20px", 
        fontSize: "1.05rem",
        fontWeight: "600",
        letterSpacing: "0.3px",
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💾 Sistema de Respaldos Automáticos
      </h3>

      {/* Mensaje de estado */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: 
            message.type === 'success' ? alpha(theme.palette.success.main, 0.1) :
            message.type === 'error' ? alpha(theme.palette.error.main, 0.1) :
            message.type === 'warning' ? alpha(theme.palette.warning.main, 0.1) :
            alpha(theme.palette.info.main, 0.1),
          border: `1px solid ${
            message.type === 'success' ? alpha(theme.palette.success.main, 0.3) :
            message.type === 'error' ? alpha(theme.palette.error.main, 0.3) :
            message.type === 'warning' ? alpha(theme.palette.warning.main, 0.3) :
            alpha(theme.palette.info.main, 0.3)
          }`,
          color: theme.palette.text.primary
        }}>
          {message.text}
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '14px',
            backgroundColor: alpha(theme.palette.background.paper, 0.3),
            borderRadius: '8px',
            border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`
          }}>
            <div style={{ fontSize: '11px', color: theme.palette.text.secondary, marginBottom: '4px' }}>
              Total de Respaldos
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: theme.palette.primary.main }}>
              {stats.totalBackups}
            </div>
          </div>
          
          <div style={{
            padding: '14px',
            backgroundColor: alpha(theme.palette.background.paper, 0.3),
            borderRadius: '8px',
            border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`
          }}>
            <div style={{ fontSize: '11px', color: theme.palette.text.secondary, marginBottom: '4px' }}>
              Espacio Usado
            </div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: theme.palette.info.main }}>
              {stats.totalSizeMB} MB
            </div>
          </div>
          
          {stats.newestBackup && (
            <div style={{
              padding: '14px',
              backgroundColor: alpha(theme.palette.background.paper, 0.3),
              borderRadius: '8px',
              border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`
            }}>
              <div style={{ fontSize: '11px', color: theme.palette.text.secondary, marginBottom: '4px' }}>
                Último Respaldo
              </div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: theme.palette.success.main }}>
                {new Date(stats.newestBackup.created).toLocaleString('es-CL')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones principales */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={createBackup} 
          disabled={loading}
          style={{ 
            ...styles.buttonStyle(false),
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
            fontWeight: "500",
            letterSpacing: "0.2px",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
          {loading ? '⏳ Procesando...' : '💾 Crear Respaldo Ahora'}
        </button>
        
        <button 
          onClick={loadBackups} 
          disabled={loading}
          style={{ 
            ...styles.buttonStyle(false),
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            fontWeight: "500",
            letterSpacing: "0.2px",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
          🔄 Actualizar Lista
        </button>
      </div>

      {/* Exportar CSV */}
      <div style={{
        padding: '16px',
        marginBottom: '20px',
        backgroundColor: alpha(theme.palette.background.paper, 0.3),
        borderRadius: '8px',
        border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`
      }}>
        <h4 style={{ 
          color: theme.palette.warning.main, 
          marginBottom: '12px', 
          fontSize: '0.95rem',
          fontWeight: '600'
        }}>
          📊 Exportar Mes a CSV
        </h4>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={exportMonth}
            onChange={(e) => setExportMonth(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: '13px'
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2000, i).toLocaleString('es-CL', { month: 'long' })}
              </option>
            ))}
          </select>
          
          <select 
            value={exportYear}
            onChange={(e) => setExportYear(parseInt(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: '13px'
            }}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          
          <button 
            onClick={exportCSV}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              border: 'none',
              color: '#fff',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '13px'
            }}
          >
            📥 Exportar
          </button>
        </div>
      </div>

      {/* Lista de respaldos */}
      <div style={{
        backgroundColor: alpha(theme.palette.background.paper, 0.3),
        borderRadius: '8px',
        border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h4 style={{ 
          padding: '12px 16px',
          margin: 0,
          borderBottom: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
          color: theme.palette.text.primary, 
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          📂 Respaldos Disponibles ({backups.length})
        </h4>
        
        {backups.length === 0 ? (
          <div style={{ 
            padding: '30px', 
            textAlign: 'center', 
            color: theme.palette.text.secondary,
            fontStyle: 'italic'
          }}>
            No hay respaldos disponibles. Crea uno usando el botón de arriba.
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {backups.map((backup, index) => (
              <div 
                key={index}
                style={{
                  padding: '12px',
                  marginBottom: '6px',
                  backgroundColor: alpha(theme.palette.background.default, 0.3),
                  borderRadius: '6px',
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: theme.palette.text.primary,
                    marginBottom: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {backup.fileName}
                  </div>
                  <div style={{ fontSize: '11px', color: theme.palette.text.secondary }}>
                    📅 {backup.created} • 💾 {formatSize(backup.size)} • 
                    {backup.ageInDays === 0 ? ' Hoy' : ` Hace ${backup.ageInDays} día${backup.ageInDays > 1 ? 's' : ''}`}
                  </div>
                </div>
                
                <button
                  onClick={() => verifyBackup(backup.path)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    color: theme.palette.info.main,
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  ✓ Verificar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información de respaldos automáticos */}
      <div style={{
        marginTop: '20px',
        padding: '14px',
        backgroundColor: alpha(theme.palette.info.main, 0.05),
        borderRadius: '8px',
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
      }}>
        <div style={{ fontSize: '12px', color: theme.palette.text.secondary, lineHeight: '1.6' }}>
          <strong style={{ color: theme.palette.info.main }}>ℹ️ Información:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Los respaldos se crean automáticamente todos los días a las 2:00 AM</li>
            <li>Se exporta un CSV mensual automáticamente el día 1 de cada mes a las 3:00 AM</li>
            <li>Se mantienen respaldos de los últimos 30 días + 1 por mes del último año</li>
            <li>Los archivos se guardan en la carpeta <code>backups/</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Componente para gestión de usuarios y roles (solo admin)
// ═══════════════════════════════════════════════════════════════════════
function UsuariosFrame({ styles }) {
  const theme = useTheme();
  const [subTab, setSubTab] = useState('usuarios'); // 'usuarios' o 'roles'

  // Estilos para los sub-tabs
  const subTabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: isActive ? 700 : 500,
    transition: 'all 0.3s',
    borderBottom: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
  });

  return (
    <div style={{ 
      color: theme.palette.text.primary,
      minHeight: '70vh',
    }}>
      <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>
        👥 Usuarios y Roles
      </h3>

      {/* Sub-navegación */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <button
          onClick={() => setSubTab('usuarios')}
          style={subTabButtonStyle(subTab === 'usuarios')}
        >
          👤 Usuarios
        </button>
        <button
          onClick={() => setSubTab('roles')}
          style={subTabButtonStyle(subTab === 'roles')}
        >
          🔐 Configuración de Roles
        </button>
      </div>

      {/* Contenido según sub-tab */}
      {subTab === 'usuarios' && <UsuariosTab styles={styles} />}
      {subTab === 'roles' && <RolesConfigTab styles={styles} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-componente: Tab de Usuarios
// ═══════════════════════════════════════════════════════════════════════
function UsuariosTab({ styles }) {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState(''); // Buscador
  const [filterTienda, setFilterTienda] = useState(''); // Filtro por tienda
  const [filterRole, setFilterRole] = useState(''); // Filtro por rol
  const [filterStatus, setFilterStatus] = useState('all'); // Filtro por estado (all/active/inactive)
  
  // Ordenamiento
  const [sortBy, setSortBy] = useState('username'); // Campo de ordenamiento
  const [sortOrder, setSortOrder] = useState('asc'); // Orden (asc/desc)
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15); // Usuarios por página
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cajero',
    sucursales: [],
  });

  // Obtener sucursales disponibles desde localStorage
  const [availableSucursales, setAvailableSucursales] = useState([]);
  
  useEffect(() => {
    // Cargar sucursales disponibles
    axiosWithFallback('/localStorage')
      .then(response => {
        const tiendas = response.data.tiendas || [];
        setAvailableSucursales(tiendas);
      })
      .catch(error => {
        console.error('Error cargando sucursales:', error);
      });
  }, []);

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosWithFallback('/api/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Validaciones
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Validar que cajeros tengan al menos una sucursal
    if (newUser.role === 'cajero' && (!newUser.sucursales || newUser.sucursales.length === 0)) {
      alert('Los cajeros deben tener al menos una sucursal asignada');
      return;
    }

    try {
      const response = await axiosWithFallback('/api/users', {
        method: 'post',
        data: {
          ...newUser,
          createdBy: currentUser // Para auditoría
        },
      });

      if (response.data.success) {
        alert('Usuario creado exitosamente');
        setShowCreateModal(false);
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'cajero',
          sucursales: [],
        });
        loadUsers();
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleUpdateUser = async () => {
    if (!editForm) return;

    // Validar que cajeros tengan al menos una sucursal
    if (editForm.role === 'cajero' && (!editForm.sucursales || editForm.sucursales.length === 0)) {
      alert('Los cajeros deben tener al menos una sucursal asignada');
      return;
    }

    try {
      const updates = {
        role: editForm.role,
        sucursales: editForm.sucursales,
        active: editForm.active,
        updatedBy: currentUser // Para auditoría
      };

      // Solo incluir password si se cambió
      if (editForm.newPassword && editForm.newPassword.length >= 4) {
        updates.password = editForm.newPassword;
      }

      const response = await axiosWithFallback(`/api/users/${editForm.id}`, {
        method: 'put',
        data: updates,
      });

      if (response.data.success) {
        alert('Usuario actualizado exitosamente');
        setEditingUser(null);
        setEditForm(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      alert(error.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await axiosWithFallback(`/api/users/${userId}`, {
        method: 'delete',
        data: {
          deletedBy: currentUser // Para auditoría
        }
      });

      if (response.data.success) {
        alert('Usuario eliminado exitosamente');
        loadUsers();
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      sucursales: user.sucursales || [],
      active: user.active,
      newPassword: '',
    });
  };

  const toggleSucursal = (sucursal) => {
    if (editForm) {
      const sucursales = editForm.sucursales || [];
      if (sucursales.includes(sucursal)) {
        setEditForm({ ...editForm, sucursales: sucursales.filter(s => s !== sucursal) });
      } else {
        setEditForm({ ...editForm, sucursales: [...sucursales, sucursal] });
      }
    } else if (showCreateModal) {
      const sucursales = newUser.sucursales || [];
      if (sucursales.includes(sucursal)) {
        setNewUser({ ...newUser, sucursales: sucursales.filter(s => s !== sucursal) });
      } else {
        setNewUser({ ...newUser, sucursales: [...sucursales, sucursal] });
      }
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: theme.palette.text.secondary }}>
      Cargando usuarios...
    </div>;
  }

  // Filtrar, ordenar y paginar usuarios
  let processedUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTienda = !filterTienda || 
      (user.sucursales && user.sucursales.includes(filterTienda));
    
    const matchesRole = !filterRole || user.role === filterRole;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.active) ||
      (filterStatus === 'inactive' && !user.active);
    
    return matchesSearch && matchesTienda && matchesRole && matchesStatus;
  });

  // Ordenar usuarios
  processedUsers.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Manejar valores null/undefined
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Convertir a string para comparación
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Calcular paginación
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = processedUsers.slice(startIndex, endIndex);

  // Función para cambiar ordenamiento
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Volver a primera página al ordenar
  };

  // Resetear a página 1 cuando cambian filtros
  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div style={{ color: theme.palette.text.primary }}>
      {/* Botón para crear nuevo usuario */}
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          ...styles.buttonStyle(true),
          marginBottom: '20px',
          backgroundColor: theme.palette.success.main,
        }}
      >
        ➕ Crear Nuevo Usuario
      </button>

      {/* Buscador y filtros */}
      <div style={{
        backgroundColor: alpha(theme.palette.background.default, 0.4),
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Búsqueda */}
        <div style={{ flex: '1 1 250px', minWidth: '200px' }}>
          <TextField
            label="Buscar usuario"
            variant="outlined"
            fullWidth
            size="small"
            value={searchTerm}
            onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
            placeholder="Nombre, usuario o email..."
            InputProps={{
              style: { color: theme.palette.text.primary },
            }}
            InputLabelProps={{
              style: { color: theme.palette.text.secondary },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />
        </div>

        {/* Filtro por Rol */}
        <div style={{ flex: '0 1 150px', minWidth: '120px' }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: theme.palette.text.secondary }}>
              Rol
            </InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => handleFilterChange(setFilterRole)(e.target.value)}
              label="Rol"
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="cajero">Cajero</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Filtro por Estado */}
        <div style={{ flex: '0 1 150px', minWidth: '120px' }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: theme.palette.text.secondary }}>
              Estado
            </InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => handleFilterChange(setFilterStatus)(e.target.value)}
              label="Estado"
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="active">✅ Activos</MenuItem>
              <MenuItem value="inactive">❌ Inactivos</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Filtro por Tienda */}
        <div style={{ flex: '0 1 180px', minWidth: '150px' }}>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: theme.palette.text.secondary }}>
              Tienda
            </InputLabel>
            <Select
              value={filterTienda}
              onChange={(e) => handleFilterChange(setFilterTienda)(e.target.value)}
              label="Tienda"
              sx={{
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {availableSucursales.map(tienda => (
                <MenuItem key={tienda} value={tienda}>{tienda}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Botón limpiar filtros */}
        {(searchTerm || filterTienda || filterRole || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterTienda('');
              setFilterRole('');
              setFilterStatus('all');
              setCurrentPage(1);
            }}
            style={{
              ...styles.buttonStyle(true),
              backgroundColor: alpha(theme.palette.error.main, 0.2),
              color: theme.palette.error.main,
              padding: '8px 16px',
              height: '40px',
              flex: '0 0 auto',
            }}
          >
            🗑️ Limpiar
          </button>
        )}
      </div>

      {/* Ordenamiento y contador */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ 
          color: theme.palette.text.secondary,
          fontSize: '14px',
        }}>
          Mostrando {startIndex + 1}-{Math.min(endIndex, processedUsers.length)} de {processedUsers.length} usuarios
          {processedUsers.length !== users.length && ` (${users.length} total)`}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: theme.palette.text.secondary }}>
            Ordenar por:
          </span>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              sx={{
                color: theme.palette.text.primary,
                fontSize: '13px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.3),
                },
              }}
            >
              <MenuItem value="username">Nombre usuario</MenuItem>
              <MenuItem value="full_name">Nombre completo</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="role">Rol</MenuItem>
              <MenuItem value="active">Estado</MenuItem>
              <MenuItem value="created_at">Fecha creación</MenuItem>
            </Select>
          </FormControl>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              ...styles.buttonStyle(false),
              padding: '6px 12px',
              fontSize: '16px',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
            title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Modal para crear usuario */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            backgroundColor: theme.palette.background.paper,
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 700, color: theme.palette.primary.main }}>
              ➕ Crear Nuevo Usuario
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>Usuario:</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                style={styles.inputStyle}
                placeholder="nombre_usuario"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>Email:</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={styles.inputStyle}
                placeholder="usuario@empresa.com"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>Contraseña:</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                style={styles.inputStyle}
                placeholder="Mínimo 4 caracteres"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>Rol:</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['cajero', 'supervisor', 'admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => setNewUser({ ...newUser, role })}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: newUser.role === role ? `2px solid ${theme.palette.primary.main}` : `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                      backgroundColor: newUser.role === role ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                      color: theme.palette.text.primary,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {getRoleLabel(role)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>
                Sucursales asignadas:
                {newUser.role === 'cajero' && <span style={{ color: theme.palette.error.main, marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px',
                padding: '12px',
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              }}>
                {availableSucursales.map(sucursal => {
                  const isSelected = newUser.sucursales?.includes(sucursal);
                  return (
                    <button
                      key={sucursal}
                      onClick={() => toggleSucursal(sucursal)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSelected ? theme.palette.success.main : alpha(theme.palette.divider, 0.1),
                        color: isSelected ? 'white' : theme.palette.text.primary,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{sucursal}
                    </button>
                  );
                })}
              </div>
              {newUser.role === 'admin' && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  Admin tiene acceso a todas las sucursales automáticamente
                </div>
              )}
              {newUser.role === 'supervisor' && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  Supervisor tiene acceso a todas las sucursales automáticamente
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleCreateUser}
                style={{
                  ...styles.buttonStyle(true),
                  backgroundColor: theme.palette.success.main,
                  flex: 1,
                  padding: '12px',
                }}
              >
                ✓ Crear Usuario
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUser({
                    username: '',
                    email: '',
                    password: '',
                    role: 'cajero',
                    sucursales: [],
                  });
                }}
                style={{
                  ...styles.buttonStyle(false),
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                  color: theme.palette.error.main,
                  flex: 1,
                  padding: '12px',
                }}
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar usuario */}
      {editingUser && editForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }} onClick={() => { setEditingUser(null); setEditForm(null); }}>
          <div style={{
            backgroundColor: theme.palette.background.paper,
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 700, color: theme.palette.primary.main }}>
              ✏️ Editar Usuario: {editForm.username}
            </h3>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: alpha(theme.palette.info.main, 0.1), borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: theme.palette.text.secondary }}>
                <strong>Email:</strong> {editForm.email}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>Rol:</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['cajero', 'supervisor', 'admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => setEditForm({ ...editForm, role })}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      border: editForm.role === role ? `2px solid ${theme.palette.primary.main}` : `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                      backgroundColor: editForm.role === role ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                      color: theme.palette.text.primary,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    {getRoleLabel(role)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>
                Sucursales asignadas:
                {editForm.role === 'cajero' && <span style={{ color: theme.palette.error.main, marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '10px',
                padding: '12px',
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              }}>
                {availableSucursales.map(sucursal => {
                  const isSelected = editForm.sucursales?.includes(sucursal);
                  return (
                    <button
                      key={sucursal}
                      onClick={() => toggleSucursal(sucursal)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSelected ? theme.palette.success.main : alpha(theme.palette.divider, 0.1),
                        color: isSelected ? 'white' : theme.palette.text.primary,
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {isSelected ? '✓ ' : ''}{sucursal}
                    </button>
                  );
                })}
              </div>
              {editForm.role === 'admin' && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  Admin tiene acceso a todas las sucursales automáticamente
                </div>
              )}
              {editForm.role === 'supervisor' && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  Supervisor tiene acceso a todas las sucursales automáticamente
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 600 }}>
                Cambiar contraseña (opcional):
              </label>
              <input
                type="password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                style={styles.inputStyle}
                placeholder="Dejar vacío para no cambiar"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editForm.active === 1}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked ? 1 : 0 })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Usuario activo</span>
              </label>
              <div style={{ marginLeft: '28px', marginTop: '4px', fontSize: '12px', color: theme.palette.text.secondary }}>
                Los usuarios inactivos no pueden iniciar sesión
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleUpdateUser}
                style={{
                  ...styles.buttonStyle(true),
                  backgroundColor: theme.palette.primary.main,
                  flex: 1,
                  padding: '12px',
                }}
              >
                💾 Guardar Cambios
              </button>
              <button
                onClick={() => { setEditingUser(null); setEditForm(null); }}
                style={{
                  ...styles.buttonStyle(false),
                  backgroundColor: alpha(theme.palette.divider, 0.1),
                  flex: 1,
                  padding: '12px',
                }}
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      <div style={{
        backgroundColor: alpha(theme.palette.background.default, 0.4),
        borderRadius: '8px',
        padding: '16px',
      }}>
        {paginatedUsers.length === 0 ? (
          <p style={{ color: theme.palette.text.secondary, textAlign: 'center', padding: '20px' }}>
            {users.length === 0 ? 'No hay usuarios registrados' : 'No se encontraron usuarios con los filtros aplicados'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  opacity: user.active ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '16px' }}>{user.username}</strong>
                      <span style={{
                        backgroundColor: user.role === 'admin' ? theme.palette.error.main :
                                        user.role === 'supervisor' ? theme.palette.warning.main :
                                        theme.palette.info.main,
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {getRoleLabel(user.role)}
                      </span>
                      {!user.active && (
                        <span style={{
                          backgroundColor: alpha(theme.palette.error.main, 0.2),
                          color: theme.palette.error.main,
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          🔒 INACTIVO
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '13px', color: theme.palette.text.secondary, marginBottom: '8px' }}>
                      📧 {user.email}
                    </div>

                    {user.sucursales && user.sucursales.length > 0 && (
                      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', color: theme.palette.text.secondary, marginBottom: '4px' }}>
                          Sucursales:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {user.sucursales.map(suc => (
                            <span key={suc} style={{
                              backgroundColor: alpha(theme.palette.success.main, 0.15),
                              color: theme.palette.success.main,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                            }}>
                              {suc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user.last_login && (
                      <div style={{ fontSize: '12px', color: theme.palette.text.secondary, marginTop: '8px' }}>
                        🕐 Último acceso: {new Date(user.last_login).toLocaleString('es-AR')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => openEditModal(user)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                      title="Editar usuario"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: alpha(theme.palette.error.main, 0.15),
                        color: theme.palette.error.main,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                      title="Eliminar usuario"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '20px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              ...styles.buttonStyle(false),
              padding: '8px 16px',
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            ← Anterior
          </button>

          {/* Números de página */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Mostrar solo algunas páginas alrededor de la actual
              const showPage = 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 2 && page <= currentPage + 2);
              
              const showEllipsis = 
                (page === currentPage - 3 && currentPage > 4) ||
                (page === currentPage + 3 && currentPage < totalPages - 3);

              if (showEllipsis) {
                return <span key={page} style={{ padding: '8px 4px', color: theme.palette.text.secondary }}>...</span>;
              }

              if (!showPage && page !== currentPage - 3 && page !== currentPage + 3) {
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    ...styles.buttonStyle(page === currentPage),
                    padding: '8px 12px',
                    minWidth: '40px',
                    backgroundColor: page === currentPage 
                      ? theme.palette.primary.main 
                      : alpha(theme.palette.background.paper, 0.6),
                    color: page === currentPage 
                      ? 'white' 
                      : theme.palette.text.primary,
                    border: page === currentPage
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  }}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...styles.buttonStyle(false),
              padding: '8px 16px',
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-componente: Tab de Configuración de Roles
// ═══════════════════════════════════════════════════════════════════════
function RolesConfigTab({ styles }) {
  const theme = useTheme();
  const [rolesConfig, setRolesConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('supervisor'); // Rol seleccionado en el desplegable

  // Lista de todos los permisos disponibles con descripciones
  const permissionsInfo = {
    // Gestión de usuarios
    manage_users: { label: 'Gestionar usuarios', category: 'Gestión de Usuarios' },
    
    // Configuración del sistema
    manage_settings: { label: 'Gestionar configuración del sistema', category: 'Configuración del Sistema' },
    manage_backups: { label: 'Gestionar respaldos', category: 'Configuración del Sistema' },
    
    // Visualización de datos
    view_all_data: { label: 'Ver todos los datos (sin restricciones)', category: 'Visualización de Datos' },
    view_assigned_sucursales: { label: 'Ver sucursales asignadas', category: 'Visualización de Datos' },
    view_own_sucursal: { label: 'Ver solo su sucursal', category: 'Visualización de Datos' },
    view_analytics: { label: 'Ver analíticas y estadísticas', category: 'Visualización de Datos' },
    
    // Operaciones con cierres
    create_cierre: { label: 'Crear cierres de caja', category: 'Operaciones con Cierres' },
    view_cierres: { label: 'Ver cierres (según sucursales)', category: 'Operaciones con Cierres' },
    view_own_cierres: { label: 'Ver solo sus propios cierres', category: 'Operaciones con Cierres' },
    modify_any_cierre: { label: 'Modificar cualquier cierre', category: 'Operaciones con Cierres' },
    modify_justifications: { label: 'Modificar justificaciones', category: 'Operaciones con Cierres' },
    delete_cierres: { label: 'Eliminar cierres', category: 'Operaciones con Cierres' },
    
    // Reportes y exportación
    view_diferencias: { label: 'Ver diferencias', category: 'Reportes y Exportación' },
    view_reports: { label: 'Ver reportes', category: 'Reportes y Exportación' },
    export_data: { label: 'Exportar todos los datos', category: 'Reportes y Exportación' },
    export_own_data: { label: 'Exportar solo sus datos', category: 'Reportes y Exportación' },
  };

  // Agrupar permisos por categoría
  const permissionsByCategory = {};
  Object.keys(permissionsInfo).forEach(perm => {
    const category = permissionsInfo[perm].category;
    if (!permissionsByCategory[category]) {
      permissionsByCategory[category] = [];
    }
    permissionsByCategory[category].push(perm);
  });

  useEffect(() => {
    loadRolesConfig();
  }, []);

  const loadRolesConfig = async () => {
    setLoading(true);
    try {
      const response = await axiosWithFallback('/localStorage');
      const config = response.data.roles_config || {
        admin: ['*'], // Admin siempre tiene todos los permisos
        supervisor: [
          'view_assigned_sucursales',
          'view_cierres',
          'modify_justifications',
          'view_diferencias',
          'view_reports',
          'export_own_data',
          'view_analytics',
        ],
        cajero: [
          'create_cierre',
          'view_own_cierres',
          'view_own_sucursal',
        ],
      };
      setRolesConfig(config);
    } catch (error) {
      console.error('Error cargando configuración de roles:', error);
      alert('Error al cargar configuración de roles');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permission) => {
    // Admin siempre tiene todos los permisos (*)
    if (selectedRole === 'admin') {
      alert('El rol de Administrador siempre tiene todos los permisos y no puede modificarse.');
      return;
    }

    const rolePermissions = rolesConfig[selectedRole] || [];
    let updatedPermissions;

    if (rolePermissions.includes(permission)) {
      // Remover permiso
      updatedPermissions = rolePermissions.filter(p => p !== permission);
    } else {
      // Agregar permiso
      updatedPermissions = [...rolePermissions, permission];
    }

    setRolesConfig({
      ...rolesConfig,
      [selectedRole]: updatedPermissions,
    });
  };

  const handleSaveRolesConfig = async () => {
    setSaving(true);
    try {
      // Primero obtenemos el localStorage actual
      const currentData = await axiosWithFallback('/localStorage');
      
      // Actualizamos con la nueva configuración de roles
      const updatedData = {
        ...currentData.data,
        roles_config: rolesConfig,
      };

      // Guardamos todo de vuelta
      const response = await axiosWithFallback('/localStorage', {
        method: 'post',
        data: updatedData,
      });

      if (response.status === 200) {
        alert('✅ Configuración de roles guardada exitosamente.\n\nLos usuarios deberán cerrar sesión y volver a iniciar para que los cambios surtan efecto.');
      }
    } catch (error) {
      console.error('Error guardando configuración de roles:', error);
      alert('❌ Error al guardar configuración de roles');
    } finally {
      setSaving(false);
    }
  };

  const hasPermission = (permission) => {
    const rolePermissions = rolesConfig[selectedRole] || [];
    return rolePermissions.includes('*') || rolePermissions.includes(permission);
  };

  const getRoleColor = (role) => {
    if (role === 'admin') return theme.palette.error.main;
    if (role === 'supervisor') return theme.palette.warning.main;
    return theme.palette.info.main;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: theme.palette.text.secondary }}>
      Cargando configuración de roles...
    </div>;
  }

  return (
    <div style={{ color: theme.palette.text.primary }}>
      {/* Selector de rol */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '8px',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <label style={{
          display: 'block',
          fontSize: '12px',
          fontWeight: 600,
          color: theme.palette.text.secondary,
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Seleccionar Rol
        </label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: '14px',
            fontWeight: 500,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: '6px',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
            transition: 'all 0.2s',
          }}
        >
          <option value="admin" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>👑 Administrador (Solo lectura)</option>
          <option value="supervisor" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>👔 Supervisor</option>
          <option value="cajero" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>💼 Cajero</option>
        </select>
        {selectedRole === 'admin' && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: theme.palette.text.secondary,
            fontStyle: 'italic',
          }}>
            ⚠️ El rol Administrador tiene todos los permisos y no puede modificarse
          </div>
        )}
      </div>

      {/* Panel de permisos del rol seleccionado */}
      <div style={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: '8px',
        padding: '16px',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <div style={{
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: theme.palette.text.primary,
            marginBottom: '4px',
          }}>
            {getRoleLabel(selectedRole)}
          </div>
          <div style={{ fontSize: '12px', color: theme.palette.text.secondary }}>
            {selectedRole === 'admin' && 'Acceso total al sistema'}
            {selectedRole === 'supervisor' && 'Gestión y supervisión'}
            {selectedRole === 'cajero' && 'Operaciones básicas'}
          </div>
        </div>

        {/* Permisos por categoría */}
        {selectedRole === 'admin' ? (
          <div style={{
            padding: '24px',
            backgroundColor: alpha(theme.palette.background.default, 0.3),
            borderRadius: '6px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary }}>
              Todos los permisos habilitados
            </div>
          </div>
        ) : (
          <div>
            {Object.keys(permissionsByCategory).map((category, idx) => (
              <div key={category} style={{ marginBottom: idx < Object.keys(permissionsByCategory).length - 1 ? '16px' : '0' }}>
                <h5 style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {category}
                </h5>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}>
                  {permissionsByCategory[category].map(permission => {
                    const isChecked = hasPermission(permission);
                    return (
                      <label
                        key={permission}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = alpha(theme.palette.primary.main, 0.03);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(permission)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                            accentColor: theme.palette.success.main,
                          }}
                        />
                        <span style={{
                          fontSize: '13px',
                          color: theme.palette.text.primary,
                          fontWeight: isChecked ? 500 : 400,
                        }}>
                          {permissionsInfo[permission].label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
      }}>
        <button
          onClick={loadRolesConfig}
          disabled={saving}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            backgroundColor: 'transparent',
            color: theme.palette.text.secondary,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          � Recargar
        </button>

        <button
          onClick={handleSaveRolesConfig}
          disabled={saving}
          style={{
            padding: '8px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: saving ? alpha(theme.palette.success.main, 0.5) : theme.palette.success.main,
            color: 'white',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {saving ? '💾 Guardando...' : '� Guardar'}
        </button>
      </div>
    </div>
  );
}

export default AjustesTab;
