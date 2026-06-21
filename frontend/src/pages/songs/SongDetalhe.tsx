import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { AdicionarPlaylist } from '../../components/AdicionarPlaylist';
import { KeyBadge } from '../../components/KeyBadge';
import { useToast } from '../../components/Toast';
import { cifraParaHtml, transporCifra } from '../../utils/cifra';
import { TONS, type Song, type SongTom } from '../../types';

export function SongDetalhe() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [song, setSong] = useState<Song | null>(null);
  const [tomSalvo, setTomSalvo] = useState<string | null>(null);
  const [tomAtivo, setTomAtivo] = useState<string>('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const res = await api.get<Song>(`/songs/${id}`);
      setSong(res.data);

      // Tom já salvo pelo usuário logado para esta música (SongTom)
      const resTom = await api.get<SongTom | null>(`/songTom?songId=${id}`);
      const meu = resTom.data?.tom ?? null;
      setTomSalvo(meu);
      setTomAtivo(meu ?? res.data.tom);
    }
    carregar();
  }, [id]);

  if (!song) {
    return <div className="py-10 text-center text-neutral-400">Carregando…</div>;
  }

  const textoExibido =
    tomAtivo === song.tom
      ? song.descricao
      : transporCifra(song.descricao, tomAtivo, song.tom);

  async function salvarTom() {
    setSalvando(true);
    try {
      await api.post('/songTom', { songId: Number(id), tom: tomAtivo });
      setTomSalvo(tomAtivo);
      toast(`Tom ${tomAtivo} salvo para você`);
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvando(false);
    }
  }

  function juntar(itens: { titulo: string }[]) {
    return itens.map((i) => i.titulo).join(', ');
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <KeyBadge tomo={tomAtivo || song.tom} variant="solid" size="lg" />
          <div>
            <h1 className="text-2xl font-display font-bold text-marinho">{song.titulo}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Tom original: <strong>{song.tom}</strong>
              {song.artistas.length > 0 && <> · {juntar(song.artistas)}</>}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {song.tempos.length > 0 && <>Tempo: {juntar(song.tempos)} · </>}
              {song.momentos.length > 0 && <>Momento: {juntar(song.momentos)}</>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AdicionarPlaylist
            song={song}
            className="rounded-md bg-success-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-success-700"
          >
            + Playlist
          </AdicionarPlaylist>
          {song.cifra && (
            <a
              href={song.cifra}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-300"
            >
              Cifra original
            </a>
          )}
          {song.video && (
            <a
              href={song.video}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-300"
            >
              Vídeo
            </a>
          )}
          {song.slide && (
            <a
              href={song.slide}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-300"
            >
              Slide
            </a>
          )}
          {user?.perfil === 'ADM' && (
            <Link
              to={`/songs/${song.id}/edit`}
              className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-display text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Transpor
          </span>
          {TONS.map((t) => (
            <button
              key={t}
              onClick={() => setTomAtivo(t)}
              className={`min-w-10 rounded-md px-2.5 py-1.5 text-sm font-bold transition-colors ${
                tomAtivo === t
                  ? 'bg-teal-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}

          <button
            onClick={salvarTom}
            disabled={salvando || tomAtivo === tomSalvo}
            className="ml-auto rounded-md bg-success-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-40"
          >
            {tomAtivo === tomSalvo ? `Tom ${tomAtivo} salvo` : `Salvar tom ${tomAtivo}`}
          </button>
        </div>

        <pre
          className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-neutral-800"
          dangerouslySetInnerHTML={{ __html: cifraParaHtml(textoExibido) }}
        />
      </div>
    </div>
  );
}
