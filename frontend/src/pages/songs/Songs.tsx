import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { AdicionarPlaylist } from '../../components/AdicionarPlaylist';
import { useToast } from '../../components/Toast';
import { normalizar } from '../../utils/texto';
import type { Song } from '../../types';

const selectClass =
  'rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

export function Songs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [carregando, setCarregando] = useState(true);
  const isAdm = user?.perfil === 'ADM';

  // filtros
  const [busca, setBusca] = useState('');
  const [buscaDescricao, setBuscaDescricao] = useState('');
  const [filtroTempo, setFiltroTempo] = useState(0);
  const [filtroMomento, setFiltroMomento] = useState(0);
  const [filtroArtista, setFiltroArtista] = useState(0);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await api.get<Song[]>('/songs');
      setSongs(res.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Opções dos filtros derivadas das próprias músicas
  // (GET /tempo|momento|artista é restrito a ADM no backend).
  const opcoes = useMemo(() => {
    const tempos = new Map<number, string>();
    const momentos = new Map<number, string>();
    const artistas = new Map<number, string>();
    for (const s of songs) {
      s.tempos.forEach((t) => tempos.set(t.id, t.titulo));
      s.momentos.forEach((m) => momentos.set(m.id, m.titulo));
      s.artistas.forEach((a) => artistas.set(a.id, a.titulo));
    }
    const ordenar = (m: Map<number, string>) =>
      [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    return {
      tempos: ordenar(tempos),
      momentos: ordenar(momentos),
      artistas: ordenar(artistas),
    };
  }, [songs]);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca.trim());
    const termoDesc = normalizar(buscaDescricao.trim());
    return songs.filter((s) => {
      if (termo && !normalizar(s.titulo).includes(termo)) return false;
      if (termoDesc) {
        // remove só acordes inline ([..] e {{..}}) na mesma linha, para casar
        // a letra mesmo com acordes intercalados. Não cruza quebra de linha,
        // senão um colchete usado para marcar uma seção inteira apagaria o
        // refrão junto.
        const letra = normalizar(
          s.descricao.replace(/\[[^\]\n]*\]|\{\{[^}\n]*\}\}/g, ''),
        );
        if (!letra.includes(termoDesc)) return false;
      }
      if (filtroTempo && !s.tempos.some((t) => t.id === filtroTempo)) return false;
      if (filtroMomento && !s.momentos.some((m) => m.id === filtroMomento)) return false;
      if (filtroArtista && !s.artistas.some((a) => a.id === filtroArtista)) return false;
      return true;
    });
  }, [songs, busca, buscaDescricao, filtroTempo, filtroMomento, filtroArtista]);

  const temFiltro =
    busca || buscaDescricao || filtroTempo || filtroMomento || filtroArtista;

  function limparFiltros() {
    setBusca('');
    setBuscaDescricao('');
    setFiltroTempo(0);
    setFiltroMomento(0);
    setFiltroArtista(0);
  }

  async function excluir(song: Song) {
    if (!window.confirm(`Excluir a música "${song.titulo}"?`)) return;
    try {
      await api.delete(`/songs/${song.id}`);
      toast('Música excluída');
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  function juntar(itens: { titulo: string }[]) {
    return itens.length ? itens.map((i) => i.titulo).join(', ') : '—';
  }

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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título…"
          className={`${selectClass} w-56`}
        />
        <input
          value={buscaDescricao}
          onChange={(e) => setBuscaDescricao(e.target.value)}
          placeholder="Buscar trecho na letra…"
          className={`${selectClass} w-56`}
        />
        <select
          value={filtroTempo}
          onChange={(e) => setFiltroTempo(Number(e.target.value))}
          className={selectClass}
        >
          <option value={0}>Todos os tempos</option>
          {opcoes.tempos.map(([id, titulo]) => (
            <option key={id} value={id}>{titulo}</option>
          ))}
        </select>
        <select
          value={filtroMomento}
          onChange={(e) => setFiltroMomento(Number(e.target.value))}
          className={selectClass}
        >
          <option value={0}>Todos os momentos</option>
          {opcoes.momentos.map(([id, titulo]) => (
            <option key={id} value={id}>{titulo}</option>
          ))}
        </select>
        <select
          value={filtroArtista}
          onChange={(e) => setFiltroArtista(Number(e.target.value))}
          className={selectClass}
        >
          <option value={0}>Todos os artistas</option>
          {opcoes.artistas.map(([id, titulo]) => (
            <option key={id} value={id}>{titulo}</option>
          ))}
        </select>
        {temFiltro && (
          <button
            onClick={limparFiltros}
            className="rounded-md px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-sm text-slate-400">
          {filtradas.length} de {songs.length} música{songs.length !== 1 && 's'}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Tom</th>
              <th className="px-4 py-3">Tempo(s)</th>
              <th className="px-4 py-3">Momento(s)</th>
              <th className="px-4 py-3">Artista(s)</th>
              <th className={`${isAdm ? 'w-64' : 'w-32'} px-4 py-3 text-right`}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Carregando…
                </td>
              </tr>
            ) : filtradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {temFiltro
                    ? 'Nenhuma música encontrada com esses filtros.'
                    : 'Nenhuma música cadastrada.'}
                </td>
              </tr>
            ) : (
              filtradas.map((song) => (
                <tr
                  key={song.id}
                  onClick={() => navigate(`/songs/${song.id}`)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-indigo-700">
                    {song.titulo}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                      {song.tom}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{juntar(song.tempos)}</td>
                  <td className="px-4 py-3 text-slate-500">{juntar(song.momentos)}</td>
                  <td className="px-4 py-3 text-slate-500">{juntar(song.artistas)}</td>
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

    </div>
  );
}
