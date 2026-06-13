import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';

// Tempo, Momento e Artista têm o mesmo formato ({ titulo, descricao? }) —
// esta página genérica atende os três, parametrizada pela rota do backend.
interface ItemBase {
  id: number;
  titulo: string;
  descricao: string | null;
}

interface CadastroBaseProps {
  recurso: 'tempo' | 'momento' | 'artista';
  tituloPagina: string;
  nomeItem: string; // ex.: "tempo" → botão "Novo tempo"
}

export function CadastroBase({ recurso, tituloPagina, nomeItem }: CadastroBaseProps) {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemBase[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ItemBase | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await api.get<ItemBase[]>(`/${recurso}`);
      setItens(res.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurso]);

  function abrirNovo() {
    setEditando(null);
    setTitulo('');
    setDescricao('');
    setModalAberto(true);
  }

  function abrirEdicao(item: ItemBase) {
    setEditando(item);
    setTitulo(item.titulo);
    setDescricao(item.descricao ?? '');
    setModalAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const body = { titulo, descricao: descricao || undefined };
      if (editando) {
        await api.put(`/${recurso}/${editando.id}`, body);
        toast(`${tituloPagina}: registro atualizado`);
      } else {
        await api.post(`/${recurso}`, body);
        toast(`${tituloPagina}: registro criado`);
      }
      setModalAberto(false);
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(item: ItemBase) {
    if (!window.confirm(`Excluir "${item.titulo}"?`)) return;
    try {
      await api.delete(`/${recurso}/${item.id}`);
      toast('Registro excluído');
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{tituloPagina}</h1>
        <button
          onClick={abrirNovo}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Novo {nomeItem}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="w-40 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Carregando…
                </td>
              </tr>
            ) : itens.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Nenhum registro cadastrado.
                </td>
              </tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {item.titulo}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.descricao ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => abrirEdicao(item)}
                        className="rounded-md px-3 py-1 text-indigo-600 hover:bg-indigo-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluir(item)}
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
        title={editando ? `Editar ${nomeItem}` : `Novo ${nomeItem}`}
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
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Descrição
          </label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
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
