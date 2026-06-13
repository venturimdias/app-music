import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../api/client';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Playlist } from '../../types';
import { formatarData } from './Playlists';

export function PlaylistDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mexendo, setMexendo] = useState(false);

  // modal de edição (nome/data/descricao)
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');

  async function carregar() {
    const resPlaylist = await api.get<Playlist>(`/playlists/${id}`);
    setPlaylist(resPlaylist.data);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!playlist) {
    return <div className="py-10 text-center text-slate-400">Carregando…</div>;
  }

  const musicas = playlist.musicas ?? [];
  const urlPublica = `${window.location.origin}/lista-repertorio/${playlist.slug}`;

  async function copiar(texto: string, rotulo: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para HTTP sem contexto seguro (acesso via IP na rede local)
      const el = document.createElement('textarea');
      el.value = texto;
      el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    toast(`${rotulo} copiado!`);
  }

  async function remover(songId: number, titulo: string) {
    if (!window.confirm(`Remover "${titulo}" da playlist?`)) return;
    setMexendo(true);
    try {
      await api.delete(`/playlists/${id}/songs/${songId}`);
      await carregar();
    } finally {
      setMexendo(false);
    }
  }

  // A API só tem add/remove — trocar a ordem de duas músicas = remover as duas
  // e recriá-las com as ordens invertidas.
  async function mover(idx: number, dir: -1 | 1) {
    const a = musicas[idx];
    const b = musicas[idx + dir];
    if (!a || !b) return;
    setMexendo(true);
    try {
      await api.delete(`/playlists/${id}/songs/${a.song.id}`);
      await api.delete(`/playlists/${id}/songs/${b.song.id}`);
      await api.post(`/playlists/${id}/songs`, { songId: a.song.id, ordem: b.ordem });
      await api.post(`/playlists/${id}/songs`, { songId: b.song.id, ordem: a.ordem });
      await carregar();
    } finally {
      setMexendo(false);
    }
  }

  function abrirEdicao() {
    setNome(playlist!.nome);
    setData(playlist!.data.slice(0, 10)); // ISO → yyyy-mm-dd p/ input date
    setDescricao(playlist!.descricao ?? '');
    setModalAberto(true);
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/playlists/${id}`, {
        nome,
        data,
        descricao: descricao || undefined,
      });
      toast('Playlist atualizada');
      setModalAberto(false);
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir a playlist "${playlist!.nome}"?`)) return;
    await api.delete(`/playlists/${id}`);
    toast('Playlist excluída');
    navigate('/playlists');
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{playlist.nome}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatarData(playlist.data)}
            {playlist.descricao && <> · {playlist.descricao}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={abrirEdicao}
            className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Editar
          </button>
          <button
            onClick={excluir}
            className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Compartilhamento: URL pública + senha + QR code */}
      <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="mb-2 text-sm font-semibold text-indigo-900">
          Compartilhe com a equipe
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <code className="rounded bg-white px-2 py-1 text-indigo-700">
              {urlPublica}
            </code>
            <button
              onClick={() => copiar(urlPublica, 'URL')}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Copiar URL
            </button>
            <span className="ml-2 text-indigo-900">
              Senha: <code className="rounded bg-white px-2 py-1 font-bold text-indigo-700">{playlist.senha}</code>
            </span>
            <button
              onClick={() => copiar(playlist.senha, 'Senha')}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Copiar senha
            </button>
          </div>
          <div className="ml-auto flex flex-col items-center gap-1">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <QRCodeSVG value={urlPublica} size={112} />
            </div>
            <span className="text-xs text-indigo-900">
              Aponte a câmera para abrir
            </span>
          </div>
        </div>
      </div>

      {/* Repertório ordenável */}
      <div className="overflow-hidden rounded-xl bg-white shadow">
        {musicas.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-400">
            Nenhuma música na playlist ainda. Adicione pelo botão{' '}
            <span className="font-medium text-emerald-700">+ Playlist</span> na{' '}
            <Link to="/songs" className="font-medium text-indigo-600 hover:underline">
              lista de músicas
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {musicas.map((m, idx) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-right text-sm font-bold text-slate-400">
                  {idx + 1}.
                </span>
                <div className="flex flex-col">
                  <button
                    onClick={() => mover(idx, -1)}
                    disabled={idx === 0 || mexendo}
                    className="text-xs text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                    aria-label="Subir"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => mover(idx, 1)}
                    disabled={idx === musicas.length - 1 || mexendo}
                    className="text-xs text-slate-400 hover:text-indigo-600 disabled:opacity-20"
                    aria-label="Descer"
                  >
                    ▼
                  </button>
                </div>
                <Link
                  to={`/songs/${m.song.id}`}
                  className="font-medium text-indigo-700 hover:underline"
                >
                  {m.song.titulo}
                </Link>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {m.tom}
                </span>
                {m.tom !== m.song.tom && (
                  <span className="text-xs text-slate-400">
                    (original: {m.song.tom})
                  </span>
                )}
                <button
                  onClick={() => remover(m.song.id, m.song.titulo)}
                  disabled={mexendo}
                  className="ml-auto rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal title="Editar playlist" open={modalAberto} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvarEdicao}>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nome *
          </label>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Data *
          </label>
          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
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
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
