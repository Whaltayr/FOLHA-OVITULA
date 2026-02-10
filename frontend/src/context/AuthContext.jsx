import { createContext, useState, useContext, useEffect } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restaurar sessão ao recarregar página
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      console.log("🟣 [AUTH-CONTEXT] Sessão restaurada do LocalStorage:", JSON.parse(storedUser));
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log("🟣 [AUTH-CONTEXT] A tentar fazer login...");
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      console.log("🟣 [AUTH-CONTEXT] Resposta do Login:", data);

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        console.log("🟣 [AUTH-CONTEXT] Login OK! Token guardado.");
        return true;
      }
    } catch (error) {
      console.error("🟣 [AUTH-CONTEXT] Erro no login:", error);
      throw error;
    }
    return false;
  };

  const logout = () => {
    console.log("🟣 [AUTH-CONTEXT] Logout efetuado");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);