import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import { PasswordInput } from '../../components/PasswordInput';
import { ForcaSenha } from '../../components/ForcaSenha';
import { senhaValida as checarSenha } from '../../utils/senha';

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

export function AlterarSenha() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);

  const novaValida = checarSenha(nova);
  const senhasIguais = nova === confirmar;
  const podeEnviar = atual.length > 0 && novaValida && senhasIguais;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!novaValida) {
      toast('A nova senha não atende todos os requisitos.', 'error');
      return;
    }
    if (!senhasIguais) {
      toast('As senhas não coincidem.', 'error');
      return;
    }
    setEnviando(true);
    try {
      await api.put('/auth/password', { currentPassword: atual, newPassword: nova });
      // Decisão: após trocar a senha, encerra a sessão e volta ao login.
      toast('Senha alterada com sucesso! Entre novamente com a nova senha.');
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // erro (ex.: "Senha atual incorreta") já exibido em toast pelo interceptor
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">Alterar senha</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-md rounded-xl bg-white p-6 shadow"
      >
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Senha atual
        </label>
        <PasswordInput
          required
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <PasswordInput
          required
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          className={inputClass}
        />

        {/* Barra de força + checklist de requisitos */}
        <ForcaSenha senha={nova} />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Confirmar nova senha
        </label>
        <PasswordInput
          required
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className={`${inputClass} mb-1 ${
            confirmar.length > 0
              ? senhasIguais
                ? 'border-emerald-400'
                : 'border-red-400'
              : ''
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
          disabled={enviando || !podeEnviar}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? 'Alterando…' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
}
