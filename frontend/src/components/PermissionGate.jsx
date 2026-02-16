import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * PermissionGate - Renders children only if user has required permission
 * 
 * @param {string} module - Module name (e.g., 'projects', 'financial', 'hrms')
 * @param {string} action - Action type ('view', 'create', 'edit', 'delete')
 * @param {React.ReactNode} children - Content to render if permission granted
 * @param {React.ReactNode} fallback - Optional fallback content if permission denied
 * @param {boolean} requireAdmin - If true, requires admin role
 */
export const PermissionGate = ({ 
  module, 
  action, 
  children, 
  fallback = null,
  requireAdmin = false 
}) => {
  const { hasPermission, isAdmin } = useAuth();
  
  if (requireAdmin && !isAdmin) {
    return fallback;
  }
  
  if (module && action && !hasPermission(module, action)) {
    return fallback;
  }
  
  return children;
};

/**
 * CanView - Shorthand for view permission check
 */
export const CanView = ({ module, children, fallback = null }) => (
  <PermissionGate module={module} action="view" fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * CanCreate - Shorthand for create permission check
 */
export const CanCreate = ({ module, children, fallback = null }) => (
  <PermissionGate module={module} action="create" fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * CanEdit - Shorthand for edit permission check
 */
export const CanEdit = ({ module, children, fallback = null }) => (
  <PermissionGate module={module} action="edit" fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * CanDelete - Shorthand for delete permission check
 */
export const CanDelete = ({ module, children, fallback = null }) => (
  <PermissionGate module={module} action="delete" fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * AdminOnly - Renders children only for admin users
 */
export const AdminOnly = ({ children, fallback = null }) => (
  <PermissionGate requireAdmin fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * usePermission - Hook to check permissions in components
 */
export const usePermission = (module, action) => {
  const { hasPermission } = useAuth();
  return hasPermission(module, action);
};

export default PermissionGate;
