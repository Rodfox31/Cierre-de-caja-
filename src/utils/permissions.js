// ═══════════════════════════════════════════════════════════════════════
// Definición de roles y permisos del sistema
// ═══════════════════════════════════════════════════════════════════════

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  CAJERO: 'cajero',
};

export const PERMISSIONS = {
  // Gestión de usuarios
  MANAGE_USERS: 'manage_users',
  
  // Configuración del sistema
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BACKUPS: 'manage_backups',
  
  // Visualización de datos
  VIEW_ALL_DATA: 'view_all_data',
  VIEW_ASSIGNED_SUCURSALES: 'view_assigned_sucursales',
  VIEW_OWN_SUCURSAL: 'view_own_sucursal',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Operaciones con cierres
  CREATE_CIERRE: 'create_cierre',
  VIEW_CIERRES: 'view_cierres',
  VIEW_OWN_CIERRES: 'view_own_cierres',
  MODIFY_ANY_CIERRE: 'modify_any_cierre',
  MODIFY_JUSTIFICATIONS: 'modify_justifications',
  DELETE_CIERRES: 'delete_cierres',
  
  // Reportes y exportación
  VIEW_DIFERENCIAS: 'view_diferencias',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  EXPORT_OWN_DATA: 'export_own_data',
};

// Permisos asignados a cada rol
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    '*', // Admin tiene todos los permisos
  ],
  
  [ROLES.SUPERVISOR]: [
    PERMISSIONS.VIEW_ASSIGNED_SUCURSALES,
    PERMISSIONS.VIEW_CIERRES,
    PERMISSIONS.MODIFY_JUSTIFICATIONS,
    PERMISSIONS.VIEW_DIFERENCIAS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_OWN_DATA,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  [ROLES.CAJERO]: [
    PERMISSIONS.CREATE_CIERRE,
    PERMISSIONS.VIEW_OWN_CIERRES,
    PERMISSIONS.VIEW_OWN_SUCURSAL,
  ],
};

// Páginas accesibles por rol
export const PAGE_ACCESS = {
  home: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CAJERO],
  cierrecaja: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CAJERO],
  diferencias: [ROLES.ADMIN, ROLES.SUPERVISOR],
  controlmensual: [ROLES.ADMIN, ROLES.SUPERVISOR],
  modificar: [ROLES.ADMIN, ROLES.SUPERVISOR],
  exportar: [ROLES.ADMIN, ROLES.SUPERVISOR],
  ajustes: [ROLES.ADMIN], // Solo admin
  imprimir: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CAJERO],
};

// ═══════════════════════════════════════════════════════════════════════
// Funciones helper
// ═══════════════════════════════════════════════════════════════════════

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {Object} user - Usuario con role y permissions
 * @param {string} permission - Permiso a verificar
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Admin tiene todos los permisos
  if (user.permissions?.includes('*')) return true;
  
  // Verificar permiso específico
  return user.permissions?.includes(permission) || false;
};

/**
 * Verifica si un usuario puede acceder a una página
 * @param {Object} user - Usuario con role
 * @param {string} page - Nombre de la página (lowercase)
 * @returns {boolean}
 */
export const canAccessPage = (user, page) => {
  if (!user) return false;
  
  const pageLower = page.toLowerCase();
  
  // Admin puede acceder a todo
  if (user.role === ROLES.ADMIN) return true;
  
  // Verificar acceso por rol
  return PAGE_ACCESS[pageLower]?.includes(user.role) || false;
};

/**
 * Verifica si un usuario tiene acceso a una sucursal específica
 * @param {Object} user - Usuario con role y sucursales
 * @param {string} sucursal - Nombre de la sucursal
 * @returns {boolean}
 */
export const hasAccessToSucursal = (user, sucursal) => {
  if (!user) return false;
  
  // Admin y supervisor tienen acceso a todas
  if (user.role === ROLES.ADMIN || user.role === ROLES.SUPERVISOR) {
    return true;
  }
  
  // Cajero solo a sus sucursales asignadas
  return user.sucursales?.includes(sucursal) || false;
};

/**
 * Obtiene los permisos por defecto para un rol
 * @param {string} role - Rol del usuario
 * @returns {Array<string>}
 */
export const getDefaultPermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Verifica si el usuario puede modificar un cierre específico
 * @param {Object} user - Usuario actual
 * @param {Object} cierre - Cierre a verificar
 * @returns {boolean}
 */
export const canModifyCierre = (user, cierre) => {
  if (!user || !cierre) return false;
  
  // Admin puede modificar cualquier cierre
  if (hasPermission(user, PERMISSIONS.MODIFY_ANY_CIERRE)) {
    return true;
  }
  
  // Supervisor puede modificar justificaciones
  if (hasPermission(user, PERMISSIONS.MODIFY_JUSTIFICATIONS)) {
    return hasAccessToSucursal(user, cierre.tienda);
  }
  
  return false;
};

/**
 * Verifica si el usuario puede ver un cierre específico
 * @param {Object} user - Usuario actual
 * @param {Object} cierre - Cierre a verificar
 * @returns {boolean}
 */
export const canViewCierre = (user, cierre) => {
  if (!user || !cierre) return false;
  
  // Admin puede ver todo
  if (hasPermission(user, PERMISSIONS.VIEW_ALL_DATA)) {
    return true;
  }
  
  // Supervisor puede ver cierres de sucursales asignadas
  if (hasPermission(user, PERMISSIONS.VIEW_CIERRES)) {
    return hasAccessToSucursal(user, cierre.tienda);
  }
  
  // Cajero solo puede ver sus propios cierres
  if (hasPermission(user, PERMISSIONS.VIEW_OWN_CIERRES)) {
    return cierre.usuario === user.username && hasAccessToSucursal(user, cierre.tienda);
  }
  
  return false;
};

/**
 * Filtra cierres según los permisos del usuario
 * @param {Array<Object>} cierres - Array de cierres
 * @param {Object} user - Usuario actual
 * @returns {Array<Object>}
 */
export const filterCierresByPermissions = (cierres, user) => {
  if (!user || !Array.isArray(cierres)) return [];
  
  // Admin ve todo
  if (hasPermission(user, PERMISSIONS.VIEW_ALL_DATA)) {
    return cierres;
  }
  
  // Filtrar por permisos
  return cierres.filter(cierre => canViewCierre(user, cierre));
};

/**
 * Obtiene el nombre legible de un rol
 * @param {string} role - Rol del usuario
 * @returns {string}
 */
export const getRoleLabel = (role) => {
  const labels = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.CAJERO]: 'Cajero',
  };
  return labels[role] || role;
};

/**
 * Obtiene el color del badge para un rol
 * @param {string} role - Rol del usuario
 * @returns {string}
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    [ROLES.ADMIN]: 'error',
    [ROLES.SUPERVISOR]: 'warning',
    [ROLES.CAJERO]: 'info',
  };
  return colors[role] || 'default';
};
