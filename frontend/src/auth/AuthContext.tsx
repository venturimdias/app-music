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
  nome: string;
  email: string;
  perfilId: number;
  perfil: 'ADM' | 'PARTICIPANTE' | 'DEMO';
  plan: Plan | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, recaptchaToken: string) => Promise<void>;
  register: (
    nome: string,
    email: string,
    password: string,
    recaptchaToken: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Marca que existe (provavelmente) uma sessão ativa. Não é segurança — a
// autenticação real é o cookie httpOnly validado no backend. Serve só para
// evitar um GET /auth/me (e o 401 no console) quando o usuário está deslogado.
const CHAVE_SESSAO = 'app-music:sessao';

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
    // Sem indício de sessão, nem consulta o backend (evita o 401 no F5 deslogado).
    if (!localStorage.getItem(CHAVE_SESSAO)) {
      setLoading(false);
      return;
    }
    api
      .get<AuthUser>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        // Cookie expirou/inválido: limpa a flag para não tentar de novo.
        localStorage.removeItem(CHAVE_SESSAO);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string, recaptchaToken: string) {
    await api.post('/auth/login', { email, password, recaptchaToken });
    const me = await api.get<AuthUser>('/auth/me');
    localStorage.setItem(CHAVE_SESSAO, '1');
    setUser(me.data);
  }

  async function register(
    nome: string,
    email: string,
    password: string,
    recaptchaToken: string,
  ) {
    await api.post('/auth/register', { nome, email, password, recaptchaToken });
    const me = await api.get<AuthUser>('/auth/me');
    localStorage.setItem(CHAVE_SESSAO, '1');
    setUser(me.data);
  }

  async function logout() {
    await api.post('/auth/logout');
    localStorage.removeItem(CHAVE_SESSAO);
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
