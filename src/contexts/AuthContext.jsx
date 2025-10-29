import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar usuario de localStorage al iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log de intento fallido
        try {
          await fetch('http://localhost:3001/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: email,
              action: 'FAILED_LOGIN',
              entityType: 'auth',
              details: { reason: data.error || 'Credenciales inválidas', email }
            })
          });
        } catch (auditError) {
          console.error('Error al registrar intento fallido:', auditError);
        }
        
        throw new Error(data.error || 'Error de autenticación');
      }

      if (data.success && data.user) {
        // Guardar usuario en state y localStorage
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Log de login exitoso
        try {
          await fetch('http://localhost:3001/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              username: data.user.username,
              action: 'LOGIN',
              entityType: 'auth',
              details: { 
                email: data.user.email,
                role: data.user.role,
                sucursales: data.user.sucursales 
              }
            })
          });
        } catch (auditError) {
          console.error('Error al registrar login:', auditError);
        }
        
        return { success: true };
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    // Log de logout
    if (currentUser) {
      try {
        await fetch('http://localhost:3001/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            username: currentUser.username,
            action: 'LOGOUT',
            entityType: 'auth',
            details: { email: currentUser.email }
          })
        });
      } catch (auditError) {
        console.error('Error al registrar logout:', auditError);
      }
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    // Admin tiene todos los permisos
    if (currentUser.permissions?.includes('*')) return true;
    
    // Verificar permiso específico
    return currentUser.permissions?.includes(permission) || false;
  };

  // Verificar si el usuario puede acceder a una página
  const canAccessPage = (page) => {
    if (!currentUser) return false;
    
    // Admin siempre puede acceder a todo
    if (currentUser.role === 'admin') return true;
    
    // Mapear páginas a permisos específicos
    const pagePermissions = {
      home: null, // Todos pueden acceder
      cierrecaja: 'create_cierre',
      diferencias: 'view_diferencias',
      controlmensual: 'view_cierres',
      modificar: 'modify_any_cierre',
      exportar: 'export_data',
      ajustes: 'manage_settings',
      imprimir: null, // Todos pueden imprimir
    };
    
    const requiredPermission = pagePermissions[page];
    
    // Si la página no requiere permiso específico, permitir acceso
    if (!requiredPermission) return true;
    
    // Verificar si tiene el permiso requerido
    return hasPermission(requiredPermission);
  };

  // Verificar si el usuario tiene acceso a una sucursal
  const hasAccessToSucursal = (sucursal) => {
    if (!currentUser) return false;
    
    // Admin y supervisor tienen acceso a todas
    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
      return true;
    }
    
    // Cajero solo a sus sucursales asignadas
    return currentUser.sucursales?.includes(sucursal) || false;
  };

  // Actualizar usuario (útil para cambios de perfil)
  const updateUser = (updates) => {
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    canAccessPage,
    hasAccessToSucursal,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
