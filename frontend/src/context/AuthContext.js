import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify token is still valid
          const response = await authAPI.getMe();
          setUser(response.data.data);
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } catch (error) {
          console.error('Auth init error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, role) => {
    const response = await authAPI.login({ email, password, role });
    if (response.data?.data?.tempToken) {
      sessionStorage.setItem('tempToken', response.data.data.tempToken);
    }
    return response.data;
  };

  const verifyMFA = async (tempToken, otp) => {
    const response = await authAPI.verifyMFA({ tempToken, otp });
    if (response.data.success) {
      const { accessToken, user: userData } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    return response.data;
  };

  const setSession = (accessToken, userData) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    return response.data;
  };

  const verifyEmail = async (email, otp) => {
    const response = await authAPI.verifyEmail({ email, otp });
    return response.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const resendOTP = async (email, purpose) => {
    const response = await authAPI.resendOTP({ email, purpose });
    return response.data;
  };

  const value = {
    user,
    loading,
    login,
    verifyMFA,
    register,
    verifyEmail,
    logout,
    resendOTP,
    setSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
