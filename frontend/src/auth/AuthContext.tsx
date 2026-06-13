import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../api/client';
import type { Plan } from '../types';

export interface AuthUser {
  sub: number;
  email: string;
  perfilId: number;
  perfil: 'ADM' | 'PARTICIPANTE';
  plan: Plan | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nome: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<AuthUser>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    await api.post('/auth/login', { email, password });
    const me = await api.get<AuthUser>('/auth/me');
    setUser(me.data);
  }

  async function register(nome: string, email: string, password: string) {
    await api.post('/auth/register', { nome, email, password });
    await login(email, password);
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  async function refreshUser() {
    const me = await api.get<AuthUser>('/auth/me');
    setUser(me.data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
