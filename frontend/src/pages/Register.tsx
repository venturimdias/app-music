import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { User, Mail, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { PasswordInput } from '../components/PasswordInput';
import { AuthLayout } from '../components/AuthLayout';
import { ForcaSenha } from '../components/ForcaSenha';
import { senhaValida as checarSenha } from '../utils/senha';
import { RecaptchaError, obterTokenRecaptcha } from '../auth/recaptcha';

const inputBase =
  'w-full rounded-md border py-2 pl-10 text-sm transition-colors focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/40';
const iconClass = 'pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-neutral-400';

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

  const senhaValida = checarSenha(password);
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

  const bordaConfirmar =
    confirmar.length > 0
      ? senhasIguais
        ? 'border-success-400'
        : 'border-danger-400'
      : 'border-nevoa';

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-6">
          <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-teal-600">
            Comece agora
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-marinho">
            Criar sua conta
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Monte seu grupo de canto e organize a primeira celebração em minutos.
          </p>
        </div>

        {/* Nome */}
        <label className="mb-1 block font-display text-sm font-medium text-marinho">Nome</label>
        <div className="relative mb-4">
          <User size={16} className={iconClass} />
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className={`${inputBase} border-nevoa pr-3`}
          />
        </div>

        {/* Email */}
        <label className="mb-1 block font-display text-sm font-medium text-marinho">Email</label>
        <div className="relative mb-4">
          <Mail size={16} className={iconClass} />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@igreja.com"
            className={`${inputBase} border-nevoa pr-3`}
          />
        </div>

        {/* Senha */}
        <label className="mb-1 block font-display text-sm font-medium text-marinho">Senha</label>
        <div className="relative">
          <Lock size={16} className={iconClass} />
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={`${inputBase} border-nevoa`}
          />
        </div>

        {/* Barra de força + checklist de requisitos */}
        <ForcaSenha senha={password} />

        {/* Confirmar senha */}
        <label className="mb-1 block font-display text-sm font-medium text-marinho">
          Confirmar senha
        </label>
        <div className="relative mb-1">
          <KeyRound size={16} className={iconClass} />
          <PasswordInput
            required
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repita a senha"
            className={`${inputBase} ${bordaConfirmar}`}
          />
        </div>
        {confirmar.length > 0 && !senhasIguais && (
          <p className="mb-3 text-xs text-danger-600">As senhas não coincidem.</p>
        )}
        {confirmar.length > 0 && senhasIguais && (
          <p className="mb-3 text-xs text-success-600">Senhas conferem.</p>
        )}
        {confirmar.length === 0 && <div className="mb-4" />}

        <button
          type="submit"
          disabled={enviando || !senhaValida || !senhasIguais}
          className="w-full rounded-md bg-teal-600 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="mt-5 text-center text-sm text-neutral-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-display font-semibold text-teal-700 hover:underline">
            Entrar
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
