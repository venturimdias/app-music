import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { PasswordInput } from '../components/PasswordInput';
import { AuthLayout } from '../components/AuthLayout';
import { RecaptchaError, obterTokenRecaptcha } from '../auth/recaptcha';

const inputClass =
  'w-full rounded-md border border-nevoa py-2 pl-10 text-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40';

export function Login() {
  const { login } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const recaptchaToken = await obterTokenRecaptcha(executeRecaptcha, 'login');
      await login(email, password, recaptchaToken);
      // Volta para a página que o usuário tentou acessar, ou a home.
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      // Erros de API já viram toast pelo interceptor; os do reCAPTCHA mostramos aqui.
      if (err instanceof RecaptchaError) toast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-6">
            <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
              Bem-vindo de volta
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-marinho">
              Entrar no grupo
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Acesse o repertório e as celebrações do seu grupo de canto.
            </p>
          </div>

          <label className="mb-1 block font-display text-sm font-medium text-marinho">
            Email
          </label>
          <div className="relative mb-4">
            <Mail
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@igreja.com"
              className={`${inputClass} pr-3`}
            />
          </div>

          <label className="mb-1 block font-display text-sm font-medium text-marinho">
            Senha
          </label>
          <div className="relative mb-6">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-neutral-400"
            />
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-teal-600 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-display font-semibold text-teal-700 hover:underline">
              Criar conta
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-neutral-400">
            Este site é protegido por reCAPTCHA e está sujeito à{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Política de Privacidade
            </a>{' '}
            e aos{' '}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Termos de Serviço
            </a>{' '}
            do Google.
          </p>
        </form>
    </AuthLayout>
  );
}
