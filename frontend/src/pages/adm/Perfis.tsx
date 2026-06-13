import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Perfil } from '../../types';

export function Perfis() {
  const { toast } = useToast();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Perfil | null>(null);
  const [titulo, setTitulo] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await api.get<Perfil[]>('/perfil');
      setPerfis(res.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditando(null);
    setTitulo('');
    setModalAberto(true);
  }

  function abrirEdicao(perfil: Perfil) {
    setEditando(perfil);
    setTitulo(perfil.titulo);
    setModalAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/perfil/${editando.id}`, { titulo });
        toast('Perfil atualizado');
      } else {
        await api.post('/perfil', { titulo });
        toast('Perfil criado');
      }
      setModalAberto(false);
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(perfil: Perfil) {
    if (!window.confirm(`Excluir o perfil "${perfil.titulo}"?`)) return;
    try {
      await api.delete(`/perfil/${perfil.id}`);
      toast('Perfil excluído');
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Perfis</h1>
        <button
          onClick={abrirNovo}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Novo perfil
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="w-40 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando ? (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-slate-400">
                  Carregando…
                </td>
              </tr>
            ) : (
              perfis.map((perfil) => (
                <tr key={perfil.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {perfil.titulo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => abrirEdicao(perfil)}
                        className="rounded-md px-3 py-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(perfil)}
                        className="rounded-md px-3 py-1 text-red-600 hover:bg-red-50"
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
        title={editando ? 'Editar perfil' : 'Novo perfil'}
        open={modalAberto}
        onClose={() => setModalAberto(false)}
      >
        <form onSubmit={salvar}>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Título *
          </label>
          <input
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
