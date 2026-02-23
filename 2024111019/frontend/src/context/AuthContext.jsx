import { createContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Hybrid storage: sessionStorage for per-tab isolation, localStorage as persistent backup.
// On new tab/browser reopen, if sessionStorage is empty we restore from localStorage.
const saveAuth = (token, user) => {
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', user);
  localStorage.setItem('token', token);
  localStorage.setItem('user', user);
};

const clearAuth = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');
const getUser  = () => sessionStorage.getItem('user')  || localStorage.getItem('user');

// Bootstrap: if sessionStorage is empty (new tab / browser reopened), copy from localStorage
(() => {
  if (!sessionStorage.getItem('token') && localStorage.getItem('token')) {
    sessionStorage.setItem('token', localStorage.getItem('token'));
    sessionStorage.setItem('user',  localStorage.getItem('user'));
  }
})();

export const getAuthHeader = () => ({
  headers: { 'x-auth-token': getToken() }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getUser();
    if (token && storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    saveAuth(res.data.token, JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, data);
    saveAuth(res.data.token, JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const googleLogin = async (credential) => {
    const res = await axios.post(`${API_URL}/api/auth/google`, { credential });
    saveAuth(res.data.token, JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, getAuthHeader());
      const u = { id: res.data._id, role: res.data.role, name: res.data.name, email: res.data.email, onboardingComplete: res.data.onboardingComplete };
      saveAuth(getToken(), JSON.stringify(u));
      setUser(u);
    } catch { /* silent */ }
  };

  const value = useMemo(() => ({ user, loading, login, register, googleLogin, logout, refreshUser, setUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
