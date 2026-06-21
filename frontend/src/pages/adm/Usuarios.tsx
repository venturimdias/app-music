import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Perfil, Usuario } from '../../types';

export function Usuarios() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perfilId, setPerfilId] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const [resUsuarios, resPerfis] = await Promise.all([
        api.get<Usuario[]>('/usuario'),
        api.get<Perfil[]>('/perfil'),
      ]);
      setUsuarios(resUsuarios.data);
      setPerfis(resPerfis.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function tituloPerfil(id: number) {
    return perfis.find((p) => p.id === id)?.titulo ?? id;
  }

  function abrirNovo() {
    setEditando(null);
    setNome('');
    setEmail('');
    setPassword('');
    setPerfilId(perfis[0]?.id ?? 0);
    setModalAberto(true);
  }

  function abrirEdicao(usuario: Usuario) {
    setEditando(usuario);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setPassword(''); // em branco = não troca a senha
    setPerfilId(usuario.perfilId);
    setModalAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/usuario/${editando.id}`, {
          nome,
          email,
          perfilId,
          ...(password ? { password } : {}),
        });
        toast('Usuário atualizado');
      } else {
        await api.post('/usuario', { nome, email, password, perfilId });
        toast('Usuário criado');
      }
      setModalAberto(false);
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(usuario: Usuario) {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}"?`)) return;
    try {
      await api.delete(`/usuario/${usuario.id}`);
      toast('Usuário excluído');
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-marinho">Usuários</h1>
        <button
          onClick={abrirNovo}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Novo usuário
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Plano</th>
              <th className="w-40 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {carregando ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {usuario.nome}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{usuario.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                      {tituloPerfil(usuario.perfilId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {usuario.plan && !usuario.plan.is_free ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                        ✓ {usuario.plan.name}
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                        {usuario.plan?.name ?? 'Gratuito'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => abrirEdicao(usuario)}
                        className="rounded-md px-3 py-1 text-teal-600 hover:bg-teal-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(usuario)}
                        className="rounded-md px-3 py-1 text-danger-600 hover:bg-danger-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editando ? 'Editar usuário' : 'Novo usuário'}
        open={modalAberto}
        onClose={() => setModalAberto(false)}
      >
        <form onSubmit={salvar}>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Nome *
          </label>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Email *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Senha {editando ? '(deixe em branco para manter)' : '*'}
          </label>
          <input
            type="password"
            required={!editando}
            minLength={password ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Perfil *
          </label>
          <select
            required
            value={perfilId}
            onChange={(e) => setPerfilId(Number(e.target.value))}
            className="mb-6 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          >
            {perfis.map((perfil) => (
              <option key={perfil.id} value={perfil.id}>
                {perfil.titulo}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
