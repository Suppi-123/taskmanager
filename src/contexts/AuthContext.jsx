// File: src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in when app loads
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // For this demo, we'll just check hardcoded credentials
    if (userData.username === 'user' && userData.password === 'user') {
      const user = { id: 1, username: userData.username };
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(user));
      return Promise.resolve(user);
    } else {
      return Promise.reject(new Error('Invalid credentials'));
    }
  };

  const register = (userData) => {
    // In a real app, you would send this to your backend
    // For demo purposes, let's simulate registration
    if (userData.username === 'user') {
      return Promise.reject(new Error('Username already exists'));
    }
    
    // For demo, we'll just log the user in after registration
    const user = { id: 2, username: userData.username };
    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(user));
    return Promise.resolve(user);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    message.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;