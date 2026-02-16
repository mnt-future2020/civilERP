import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('erp_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('erp_token');
      const storedUser = localStorage.getItem('erp_user');
      
      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid and get latest permissions
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          localStorage.setItem('erp_user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Auth verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, [logout]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('erp_token', access_token);
      localStorage.setItem('erp_user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { access_token, user: newUser } = response.data;
      
      localStorage.setItem('erp_token', access_token);
      localStorage.setItem('erp_user', JSON.stringify(newUser));
      
      setToken(access_token);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  // Refresh user permissions (useful after role changes)
  const refreshPermissions = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('erp_user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  }, [token]);

  const api = axios.create({
    baseURL: API_URL
  });

  // Add token to every request dynamically
  api.interceptors.request.use(
    (config) => {
      const currentToken = localStorage.getItem('erp_token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  // Permission checking utilities
  const permissions = useMemo(() => user?.permissions || {}, [user]);

  const hasPermission = useCallback((module, action) => {
    if (!permissions[module]) return false;
    return permissions[module][action] === true;
  }, [permissions]);

  const canView = useCallback((module) => hasPermission(module, 'view'), [hasPermission]);
  const canCreate = useCallback((module) => hasPermission(module, 'create'), [hasPermission]);
  const canEdit = useCallback((module) => hasPermission(module, 'edit'), [hasPermission]);
  const canDelete = useCallback((module) => hasPermission(module, 'delete'), [hasPermission]);

  // Check if user is admin (either legacy role or has admin module access)
  const isAdmin = useMemo(() => {
    return user?.role === 'admin' || hasPermission('admin', 'view');
  }, [user, hasPermission]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    api,
    isAuthenticated: !!token && !!user,
    // RBAC utilities
    permissions,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isAdmin,
    refreshPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
