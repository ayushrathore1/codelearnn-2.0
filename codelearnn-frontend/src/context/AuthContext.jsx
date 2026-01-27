import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

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
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      const redirectToWaitlist = err.response?.data?.redirectToWaitlist || false;
      setError(message);
      throw { success: false, message, redirectToWaitlist };
    }
  };

  const register = async (name, email, password, subscribedNewsletter = false) => {
    try {
      setError(null);
      const response = await authAPI.register({ name, email, password, subscribedNewsletter });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      const redirectToWaitlist = err.response?.data?.redirectToWaitlist || false;
      setError(message);
      throw { success: false, message, redirectToWaitlist };
    }
  };

  const sendLoginOTP = async (email) => {
    try {
      setError(null);
      const response = await authAPI.sendOTP(email);
      return { success: true, message: response.data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      const redirectToWaitlist = err.response?.data?.redirectToWaitlist || false;
      const waitTime = err.response?.data?.waitTime || null;
      setError(message);
      throw { success: false, message, redirectToWaitlist, waitTime };
    }
  };

  const verifyLoginOTP = async (email, otp) => {
    try {
      setError(null);
      const response = await authAPI.verifyOTP(email, otp);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
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
