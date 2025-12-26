// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext minimal — guarda token + user em localStorage.
 * - Intenção: simples, testável, sem dependências externas.
 * - Segurança: para produção preferir cookie HttpOnly; aqui usamos localStorage
 *   por simplicidade pedagógica (vou explicar depois).
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('token'); } catch { return null; }
  });

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // loading flag for UI when we call login/save
  const [loading, setLoading] = useState(false);

  // Save token & user (call after successful login)
  function saveLogin(newToken, userData = null) {
    try {
      if (newToken) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth save error', err);
    }
  }

  // Logout clears everything
  function logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {
      console.error('Auth logout error', err);
    }
    setToken(null);
    setUser(null);
  }

  // Optional: a helper to return auth headers for API calls
  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Expose a small API
  const value = { token, user, loading, setLoading, saveLogin, logout, authHeaders };

   return (
  <AuthContext.Provider value={value}>
    {children}  
  </AuthContext.Provider>
);
}

// Hook for components
export function useAuth() {
  return useContext(AuthContext);
}
