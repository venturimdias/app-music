import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { PasswordInput } from '../components/PasswordInput';
import { RecaptchaError, obterTokenRecaptcha } from '../auth/recaptcha';

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
      // Volta para a página que o usuário tentou acessar, ou /songs.
      navigate(location.state?.from ?? '/songs', { replace: true });
    } catch (err) {
      // Erros de API já viram toast pelo interceptor; os do reCAPTCHA mostramos aqui.
      if (err instanceof RecaptchaError) toast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md"
      >
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">
          ♪ LouvorApp
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Cifras litúrgicas e playlists
        </p>

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Senha
        </label>
        <PasswordInput
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Não tem conta?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Cadastre-se
          </Link>
        </p>

        <p className="mt-4 text-center text-[11px] text-slate-400">
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
    </div>
  );
}
