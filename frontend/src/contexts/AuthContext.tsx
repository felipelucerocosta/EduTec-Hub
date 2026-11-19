import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_URL } from '../config/api';
import { joinUserRoom, joinAdminRoom } from '../services/socket';

export interface User {
  id: number;
  nombre: string;
  correo: string;
  rol: 'alumno' | 'profesor' | 'admin' | 'preceptor';
  estado_acceso?: 'ACTIVO' | 'PENDIENTE_DE_ASIGNACION' | 'SUSPENDIDO';
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
  // Inicialización inmediata desde localStorage para evitar parpadeos y preservar estado/rol en recargas F5
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('edutech_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  // Track whether login() was called explicitly so checkAuth doesn't race-overwrite it
  const loginCalledRef = useRef(false);

  const checkAuth = async () => {
    const maxRetries = 3;
    const retryDelay = 700;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${API_URL}/whoami`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Only update from server if login() hasn't already set the user
          // (prevents race condition between navigate-after-login and initial checkAuth)
          if (!loginCalledRef.current) {
            if (data.user) {
              setUser(data.user);
              try {
                localStorage.setItem('edutech_user', JSON.stringify(data.user));
              } catch (_e) {}
            } else {
              // Sesión en el servidor no existe o expiró
              setUser(null);
              try {
                localStorage.removeItem('edutech_user');
              } catch (_e) {}
            }
          }
          break; // Éxito, salir del loop
        } else if (res.status === 503 && attempt < maxRetries) {
          // Backend arrancando (Vite proxy retornó 503 mientras Express se levanta en dev)
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          // Error 401, 403 u otro definitivo
          if (!loginCalledRef.current) {
            setUser(null);
            try {
              localStorage.removeItem('edutech_user');
            } catch (_e) {}
          }
          break;
        }
      } catch (err) {
        if (attempt < maxRetries) {
          // Fallo transitorio de red al iniciar concurrently
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        console.error('Error checking auth:', err);
        // Si ya teníamos usuario en caché de localStorage, no lo destruimos ante fallo de conexión
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      joinUserRoom(user.id);
      if (user.rol === 'admin' || user.isAdmin) {
        joinAdminRoom();
      }
    }
  }, [user]);

  const login = (userData: User) => {
    loginCalledRef.current = true;
    setUser(userData);
    try {
      localStorage.setItem('edutech_user', JSON.stringify(userData));
    } catch (_e) {}
    setLoading(false);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      loginCalledRef.current = false;
      setUser(null);
      try {
        localStorage.removeItem('edutech_user');
      } catch (_e) {}
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
