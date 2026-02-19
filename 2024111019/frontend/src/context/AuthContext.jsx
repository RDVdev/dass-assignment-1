import { createContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Use sessionStorage so each tab has its own independent session
const store = sessionStorage;

export const getAuthHeader = () => ({
  headers: { 'x-auth-token': store.getItem('token') }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = store.getItem('token');
    const storedUser = store.getItem('user');
    if (token && storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    store.setItem('token', res.data.token);
    store.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, data);
    store.setItem('token', res.data.token);
    store.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const googleLogin = async (credential) => {
    const res = await axios.post(`${API_URL}/api/auth/google`, { credential });
    store.setItem('token', res.data.token);
    store.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    store.removeItem('token');
    store.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, getAuthHeader());
      const u = { id: res.data._id, role: res.data.role, name: res.data.name, email: res.data.email, onboardingComplete: res.data.onboardingComplete };
      store.setItem('user', JSON.stringify(u));
      setUser(u);
    } catch { /* silent */ }
  };

  const value = useMemo(() => ({ user, loading, login, register, googleLogin, logout, refreshUser, setUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
