import { useEffect, useState, type ReactNode } from 'react';
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
  // Detalhe da playlist selecionada (traz as músicas) — usado para saber se a
  // música já está nela e para calcular a próxima ordem sem refazer o GET.
  const [detalhe, setDetalhe] = useState<Playlist | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  async function abrir() {
    setAberto(true);
    const res = await api.get<Playlist[]>('/playlists');
    setPlaylists(res.data);
    setPlaylistId(res.data[0]?.id ?? 0);
  }

  // Ao trocar a playlist selecionada (com o modal aberto), busca o detalhe
  // para descobrir se a música já está nela.
  useEffect(() => {
    if (!aberto || !playlistId) {
      setDetalhe(null);
      return;
    }
    let cancelado = false;
    setCarregandoDetalhe(true);
    setDetalhe(null);
    api
      .get<Playlist>(`/playlists/${playlistId}`)
      .then((res) => {
        if (!cancelado) setDetalhe(res.data);
      })
      .finally(() => {
        if (!cancelado) setCarregandoDetalhe(false);
      });
    return () => {
      cancelado = true;
    };
  }, [aberto, playlistId]);

  const jaNaPlaylist = detalhe?.musicas?.some((m) => m.song.id === song.id) ?? false;

  async function adicionar() {
    if (!playlistId || !detalhe || jaNaPlaylist) return;
    setAdicionando(true);
    try {
      const musicas = detalhe.musicas ?? [];
      const proximaOrdem =
        musicas.length > 0 ? Math.max(...musicas.map((m) => m.ordem)) + 1 : 1;
      await api.post(`/playlists/${playlistId}/songs`, {
        songId: song.id,
        ordem: proximaOrdem,
      });
      toast(`"${song.titulo}" adicionada à playlist ${detalhe.nome}`);
      setAberto(false);
    } catch {
      // erro (ex.: 409 música já está na playlist) já em toast pelo interceptor
    } finally {
      setAdicionando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        disabled={aberto || adicionando}
        className={`${className ?? ''} disabled:cursor-not-allowed disabled:opacity-50`}
        title="Adicionar a uma playlist"
      >
        {children}
      </button>

      <Modal
        title={`Adicionar "${song.titulo}" à playlist`}
        open={aberto}
        onClose={() => setAberto(false)}
      >
        {playlists === null ? (
          <p className="text-sm text-neutral-400">Carregando…</p>
        ) : playlists.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Você ainda não tem playlists.{' '}
            <Link to="/playlists" className="font-medium text-teal-600 hover:underline">
              Crie uma primeiro
            </Link>
            .
          </p>
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Playlist
            </label>
            <select
              value={playlistId}
              onChange={(e) => setPlaylistId(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {new Date(p.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </option>
              ))}
            </select>

            <p className="mb-6 mt-2 min-h-[1.25rem] text-xs">
              {carregandoDetalhe ? (
                <span className="text-neutral-400">Verificando…</span>
              ) : jaNaPlaylist ? (
                <span className="font-medium text-warning-600">
                  Esta música já está nesta playlist.
                </span>
              ) : null}
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={adicionar}
                disabled={adicionando || !playlistId || carregandoDetalhe || jaNaPlaylist}
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adicionando ? 'Adicionando…' : jaNaPlaylist ? 'Já adicionada' : 'Adicionar'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
