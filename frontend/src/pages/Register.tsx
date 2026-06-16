import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { PasswordInput } from '../components/PasswordInput';
import { RecaptchaError, obterTokenRecaptcha } from '../auth/recaptcha';

// Regras da senha
const REGRAS = [
  { label: '1 letra maiúscula',  ok: (v: string) => /[A-Z]/.test(v) },
  { label: '1 letra minúscula',  ok: (v: string) => /[a-z]/.test(v) },
  { label: '2 números',          ok: (v: string) => (v.match(/\d/g) ?? []).length >= 2 },
  { label: '1 caractere especial', ok: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { label: 'mínimo 8 caracteres', ok: (v: string) => v.length >= 8 },
];

function forcaSenha(senha: string): number {
  return REGRAS.filter((r) => r.ok(senha)).length; // 0–5
}

const barraColor = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-500'];
const barraLabel = ['', 'Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte'];

const inputClass =
  'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:border-indigo-500';

export function Register() {
  const { register } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);

  const forca = forcaSenha(password);
  const senhaValida = forca === REGRAS.length;
  const senhasIguais = password === confirmar;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!senhaValida) {
      toast('A senha não atende todos os requisitos.');
      return;
    }
    if (!senhasIguais) {
      toast('As senhas não coincidem.');
      return;
    }
    setEnviando(true);
    try {
      const recaptchaToken = await obterTokenRecaptcha(executeRecaptcha, 'register');
      await register(nome, email, password, recaptchaToken);
      toast('Conta criada com sucesso!');
      navigate('/songs', { replace: true });
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
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">Criar conta</h1>

        {/* Nome */}
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`${inputClass} mb-4 border-slate-300`}
        />

        {/* Email */}
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mb-4 border-slate-300`}
        />

        {/* Senha */}
        <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
        <PasswordInput
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${inputClass} border-slate-300`}
        />

        {/* Barra de força */}
        <div className="mt-2 mb-1">
            <div className="flex gap-1">
              {REGRAS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < forca ? barraColor[forca] : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className={`mt-1 text-xs font-medium ${forca >= 4 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {barraLabel[forca]}
            </p>
          </div>

        {/* Checklist de requisitos */}
        <ul className="mb-4 mt-2 space-y-0.5">
            {REGRAS.map((r) => {
              const ok = r.ok(password);
              return (
                <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className="text-base leading-none">{ok ? '✓' : '○'}</span>
                  {r.label}
                </li>
              );
            })}
          </ul>

        {/* Confirmar senha */}
        <label className="mb-1 block text-sm font-medium text-slate-700">Confirmar senha</label>
        <PasswordInput
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={`${inputClass} mb-1 ${
            confirmar.length > 0
              ? senhasIguais
                ? 'border-emerald-400'
                : 'border-red-400'
              : 'border-slate-300'
          }`}
        />
        {confirmar.length > 0 && !senhasIguais && (
          <p className="mb-3 text-xs text-red-500">As senhas não coincidem.</p>
        )}
        {confirmar.length > 0 && senhasIguais && (
          <p className="mb-3 text-xs text-emerald-600">Senhas conferem.</p>
        )}
        {confirmar.length === 0 && <div className="mb-4" />}

        <button
          type="submit"
          disabled={enviando || !senhaValida || !senhasIguais}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Entrar
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
