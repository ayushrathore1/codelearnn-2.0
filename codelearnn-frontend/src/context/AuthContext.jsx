import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { setCharchaToken, removeCharchaToken } from '../services/charchaApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return safe defaults if context is not available (e.g., during HMR)
  if (!context) {
    return {
      user: null,
      loading: true,
      error: null,
      login: async () => ({ success: false, message: 'Auth not initialized' }),
      register: async () => ({ success: false, message: 'Auth not initialized' }),
      signup: async () => ({ success: false, message: 'Auth not initialized' }),
      sendLoginOTP: async () => ({ success: false, message: 'Auth not initialized' }),
      verifyLoginOTP: async () => ({ success: false, message: 'Auth not initialized' }),
      logout: () => {},
      updateUser: () => {},
      isAuthenticated: false
    };
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.data);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        removeCharchaToken(); // Also clear Charcha token
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token, user, charchaToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Store Charcha token if available (SSO integration)
      if (charchaToken) {
        setCharchaToken(charchaToken);
      }
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw { success: false, message };
    }
  };

  const register = async (name, email, password, subscribedNewsletter = false) => {
    try {
      setError(null);
      const response = await authAPI.register({ name, email, password, subscribedNewsletter });
      const { token, user, charchaToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Store Charcha token if available (SSO integration)
      if (charchaToken) {
        setCharchaToken(charchaToken);
      }
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw { success: false, message };
    }
  };

  const sendLoginOTP = async (email) => {
    try {
      setError(null);
      const response = await authAPI.sendOTP(email);
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      const waitTime = err.response?.data?.waitTime || null;
      setError(message);
      throw { success: false, message, waitTime };
    }
  };

  const verifyLoginOTP = async (email, otp) => {
    try {
      setError(null);
      const response = await authAPI.verifyOTP(email, otp);
      const { token, user, charchaToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      // Store Charcha token if available (SSO integration)
      if (charchaToken) {
        setCharchaToken(charchaToken);
      }
      
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      const attemptsRemaining = err.response?.data?.attemptsRemaining;
      setError(message);
      throw { success: false, message, attemptsRemaining };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    removeCharchaToken(); // Also clear Charcha token (SSO)
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    signup: register, // Alias for register
    sendLoginOTP,
    verifyLoginOTP,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

