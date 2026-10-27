import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('campufix_token');
    const storedUser = localStorage.getItem('campufix_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('campufix_token');
        localStorage.removeItem('campufix_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: u, token: t } = res.data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('campufix_token', t);
    localStorage.setItem('campufix_user', JSON.stringify(u));
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { user: u, token: t } = res.data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('campufix_token', t);
    localStorage.setItem('campufix_user', JSON.stringify(u));
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    localStorage.removeItem('campufix_token');
    localStorage.removeItem('campufix_user');
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      const u = res.data.data.user;
      setUser(u);
      localStorage.setItem('campufix_user', JSON.stringify(u));
    } catch { /* token expired handled by interceptor */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
