import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: 'alumno' | 'profesor' | 'admin';
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // Track whether login() was called explicitly so checkAuth doesn't race-overwrite it
  const loginCalledRef = useRef(false);

  const checkAuth = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/whoami', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // Only update from server if login() hasn't already set the user
        // (prevents race condition between navigate-after-login and initial checkAuth)
        if (!loginCalledRef.current) {
          setUser(data.user || null);
        }
      } else {
        if (!loginCalledRef.current) {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Error checking auth:', err);
      if (!loginCalledRef.current) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData: User) => {
    loginCalledRef.current = true;
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3001/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      loginCalledRef.current = false;
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
