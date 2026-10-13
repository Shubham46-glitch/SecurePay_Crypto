import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('crypto_auth_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const data = await authService.getProfile();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('crypto_auth_token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        localStorage.removeItem('crypto_auth_token');
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password });
      if (data.success) {
        localStorage.setItem('crypto_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.',
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register({ name, email, password });
      if (data.success) {
        localStorage.setItem('crypto_auth_token', data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('crypto_auth_token');
    setToken('');
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await authService.getProfile();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (err) {}
  };

  const refreshBalance = (newBalance) => {
    if (typeof newBalance === 'number') {
      setUser((prev) => (prev ? { ...prev, balance: newBalance } : prev));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshBalance,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
