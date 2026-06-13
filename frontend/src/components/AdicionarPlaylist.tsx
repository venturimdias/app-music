import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Modal } from './Modal';
import { useToast } from './Toast';
import type { Playlist, Song } from '../types';

interface AdicionarPlaylistProps {
  song: Song;
  className?: string; // estilo do botão que dispara o modal
  children: ReactNode; // rótulo do botão
}

// Botão + modal "adicionar música a uma playlist do usuário logado".
// Usado na lista (/songs) e no detalhe (/songs/:id).
export function AdicionarPlaylist({ song, className, children }: AdicionarPlaylistProps) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [playlistId, setPlaylistId] = useState(0);
  const [adicionando, setAdicionando] = useState(false);

  async function abrir() {
    setAberto(true);
    const res = await api.get<Playlist[]>('/playlists');
    setPlaylists(res.data);
    setPlaylistId(res.data[0]?.id ?? 0);
  }

  async function adicionar() {
    if (!playlistId) return;
    setAdicionando(true);
    try {
      // A lista de playlists não traz as músicas — busca o detalhe
      // para calcular a próxima ordem.
      const res = await api.get<Playlist>(`/playlists/${playlistId}`);
      const musicas = res.data.musicas ?? [];
      const proximaOrdem =
        musicas.length > 0 ? Math.max(...musicas.map((m) => m.ordem)) + 1 : 1;
      await api.post(`/playlists/${playlistId}/songs`, {
        songId: song.id,
        ordem: proximaOrdem,
      });
      toast(`"${song.titulo}" adicionada à playlist ${res.data.nome}`);
      setAberto(false);
    } catch {
      // erro (ex.: 409 música já está na playlist) já em toast pelo interceptor
    } finally {
      setAdicionando(false);
    }
  }

  return (
    <>
      <button type="button" onClick={abrir} className={className} title="Adicionar a uma playlist">
        {children}
      </button>

      <Modal
        title={`Adicionar "${song.titulo}" à playlist`}
        open={aberto}
        onClose={() => setAberto(false)}
      >
        {playlists === null ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : playlists.length === 0 ? (
          <p className="text-sm text-slate-500">
            Você ainda não tem playlists.{' '}
            <Link to="/playlists" className="font-medium text-indigo-600 hover:underline">
              Crie uma primeiro
            </Link>
            .
          </p>
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Playlist
            </label>
            <select
              value={playlistId}
              onChange={(e) => setPlaylistId(Number(e.target.value))}
              className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {new Date(p.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={adicionar}
                disabled={adicionando || !playlistId}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {adicionando ? 'Adicionando…' : 'Adicionar'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
