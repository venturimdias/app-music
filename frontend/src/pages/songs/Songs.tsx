import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { AdicionarPlaylist } from '../../components/AdicionarPlaylist';
import { useToast } from '../../components/Toast';
import type { Song } from '../../types';

const selectClass =
  'shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

const OPCOES_POR_PAGINA = [10, 20, 40, 80];

type Opcao = { id: number; titulo: string };
type Filtros = { tempos: Opcao[]; momentos: Opcao[]; artistas: Opcao[] };
type RespostaSongs = { items: Song[]; total: number; page: number; limit: number };

export function Songs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdm = user?.perfil === 'ADM';

  // dados
  const [songs, setSongs] = useState<Song[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [opcoes, setOpcoes] = useState<Filtros>({ tempos: [], momentos: [], artistas: [] });

  // filtros (texto com debounce; selects imediatos)
  const [busca, setBusca] = useState('');
  const [buscaDescricao, setBuscaDescricao] = useState('');
  const [buscaDebounce, setBuscaDebounce] = useState('');
  const [descDebounce, setDescDebounce] = useState('');
  const [filtroTempo, setFiltroTempo] = useState(0);
  const [filtroMomento, setFiltroMomento] = useState(0);
  const [filtroArtista, setFiltroArtista] = useState(0);

  // paginação
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);

  // Opções dos filtros: tempos/momentos/artistas em uso (endpoint dedicado,
  // acessível a qualquer usuário autenticado).
  useEffect(() => {
    api
      .get<Filtros>('/songs/filtros')
      .then((res) => setOpcoes(res.data))
      .catch(() => {});
  }, []);

  // Debounce dos campos de texto. Ao confirmar o termo, volta para a 1ª página.
  useEffect(() => {
    const id = setTimeout(() => {
      setBuscaDebounce(busca);
      setDescDebounce(buscaDescricao);
      setPagina(1);
    }, 350);
    return () => clearTimeout(id);
  }, [busca, buscaDescricao]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params: Record<string, string | number> = { page: pagina, limit: porPagina };
      if (buscaDebounce.trim()) params.titulo = buscaDebounce.trim();
      if (descDebounce.trim()) params.letra = descDebounce.trim();
      if (filtroTempo) params.tempoId = filtroTempo;
      if (filtroMomento) params.momentoId = filtroMomento;
      if (filtroArtista) params.artistaId = filtroArtista;
      const res = await api.get<RespostaSongs>('/songs', { params });
      setSongs(res.data.items);
      setTotal(res.data.total);
    } finally {
      setCarregando(false);
    }
  }, [pagina, porPagina, buscaDebounce, descDebounce, filtroTempo, filtroMomento, filtroArtista]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const temFiltro = Boolean(
    busca || buscaDescricao || filtroTempo || filtroMomento || filtroArtista,
  );

  function limparFiltros() {
    setBusca('');
    setBuscaDescricao('');
    setFiltroTempo(0);
    setFiltroMomento(0);
    setFiltroArtista(0);
    setPagina(1);
  }

  // Troca de filtro de seleção: aplica e volta para a 1ª página.
  function aoMudarSelect(setter: (v: number) => void, valor: number) {
    setter(valor);
    setPagina(1);
  }

  async function excluir(song: Song) {
    if (!window.confirm(`Excluir a música "${song.titulo}"?`)) return;
    try {
      await api.delete(`/songs/${song.id}`);
      toast('Música excluída');
      // Se era o único item da página, recua uma página; senão recarrega.
      if (songs.length === 1 && pagina > 1) setPagina((p) => p - 1);
      else await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  function juntar(itens: { titulo: string }[]) {
    return itens.length ? itens.map((i) => i.titulo).join(', ') : '—';
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = (pagina - 1) * porPagina + songs.length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Músicas</h1>
        {isAdm && (
          <Link
            to="/songs/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Nova música
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-2 flex flex-nowrap items-center gap-2 overflow-x-auto">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título…"
          className={`${selectClass} w-48 shrink-0`}
        />
        <input
          value={buscaDescricao}
          onChange={(e) => setBuscaDescricao(e.target.value)}
          placeholder="Buscar trecho na letra…"
          className={`${selectClass} w-48 shrink-0`}
        />
        <select
          value={filtroTempo}
          onChange={(e) => aoMudarSelect(setFiltroTempo, Number(e.target.value))}
          className={selectClass}
        >
          <option value={0}>Todos os tempos</option>
          {opcoes.tempos.map((t) => (
            <option key={t.id} value={t.id}>{t.titulo}</option>
          ))}
        </select>
        <select
          value={filtroMomento}
          onChange={(e) => aoMudarSelect(setFiltroMomento, Number(e.target.value))}
          className={selectClass}
        >
          <option value={0}>Todos os momentos</option>
          {opcoes.momentos.map((m) => (
            <option key={m.id} value={m.id}>{m.titulo}</option>
          ))}
        </select>
        <select
          value={filtroArtista}
          onChange={(e) => aoMudarSelect(setFiltroArtista, Number(e.target.value))}
          className={selectClass}
        >
          <option value={0}>Todos os artistas</option>
          {opcoes.artistas.map((a) => (
            <option key={a.id} value={a.id}>{a.titulo}</option>
          ))}
        </select>
      </div>

      {/* Linha abaixo: limpar filtros + contador */}
      <div className="mb-4 flex items-center gap-2">
        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Limpar filtros
          </button>
        )}
        <span className="ml-auto shrink-0 whitespace-nowrap text-sm text-slate-400">
          {total} música{total !== 1 && 's'}
          {temFiltro && ' encontrada' + (total !== 1 ? 's' : '')}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Momento(s)</th>
              <th className={`${isAdm ? 'w-64' : 'w-32'} px-4 py-3 text-right`}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  Carregando…
                </td>
              </tr>
            ) : songs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  {temFiltro
                    ? 'Nenhuma música encontrada com esses filtros.'
                    : 'Nenhuma música cadastrada.'}
                </td>
              </tr>
            ) : (
              songs.map((song) => (
                <tr
                  key={song.id}
                  onClick={() => navigate(`/songs/${song.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-indigo-700">
                    {song.titulo}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{juntar(song.momentos)}</td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AdicionarPlaylist
                      song={song}
                      className="rounded-md px-3 py-1 text-emerald-700 hover:bg-emerald-50"
                    >
                      + Playlist
                    </AdicionarPlaylist>
                    {isAdm && (
                      <>
                        <button
                          onClick={() => navigate(`/songs/${song.id}/edit`)}
                          className="ml-1 rounded-md px-3 py-1 text-indigo-600 hover:bg-indigo-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluir(song)}
                          className="ml-1 rounded-md px-3 py-1 text-red-600 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {!carregando && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Por página
            <select
              value={porPagina}
              onChange={(e) => aoMudarSelect(setPorPagina, Number(e.target.value))}
              className={selectClass}
            >
              {OPCOES_POR_PAGINA.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <span className="text-sm text-slate-400">
            {inicio}–{fim} de {total}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-2 text-sm text-slate-500">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
