import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { UserRole } from '@smartdairy/shared';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  farmId: string | null;
  farmName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; role?: UserRole; farmName?: string }) => Promise<any>;
  quickLogin: (role: 'ADMIN' | 'FARM_MANAGER' | 'VETERINARIAN' | 'OPERATOR') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartdairy_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('[Auth] Token invalid or expired:', err);
          logout();
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('smartdairy_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string; role?: UserRole; farmName?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(userData);
      if (res.success && res.token) {
        localStorage.setItem('smartdairy_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: 'ADMIN' | 'FARM_MANAGER' | 'VETERINARIAN' | 'OPERATOR') => {
    const creds: Record<string, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@smartdairy.local', pass: 'Admin@123' },
      FARM_MANAGER: { email: 'manager@smartdairy.local', pass: 'Manager@123' },
      VETERINARIAN: { email: 'vet@smartdairy.local', pass: 'Vet@123' },
      OPERATOR: { email: 'operator@smartdairy.local', pass: 'Operator@123' }
    };

    const target = creds[role];
    if (target) {
      await login(target.email, target.pass);
    }
  };

  const logout = () => {
    localStorage.removeItem('smartdairy_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        quickLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
