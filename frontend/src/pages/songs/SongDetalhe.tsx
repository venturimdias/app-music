import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { AdicionarPlaylist } from '../../components/AdicionarPlaylist';
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
    return <div className="py-10 text-center text-slate-400">Carregando…</div>;
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
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{song.titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tom original: <strong>{song.tom}</strong>
            {song.artistas.length > 0 && <> · {juntar(song.artistas)}</>}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {song.tempos.length > 0 && <>Tempo: {juntar(song.tempos)} · </>}
            {song.momentos.length > 0 && <>Momento: {juntar(song.momentos)}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <AdicionarPlaylist
            song={song}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Playlist
          </AdicionarPlaylist>
          {song.cifra && (
            <a
              href={song.cifra}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
            >
              Cifra original
            </a>
          )}
          {song.video && (
            <a
              href={song.video}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
            >
              Vídeo
            </a>
          )}
          {song.slide && (
            <a
              href={song.slide}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-300"
            >
              Slide
            </a>
          )}
          {user?.perfil === 'ADM' && (
            <Link
              to={`/songs/${song.id}/edit`}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {TONS.map((t) => (
            <button
              key={t}
              onClick={() => setTomAtivo(t)}
              className={`min-w-10 rounded-md px-2.5 py-1.5 text-sm font-bold transition-colors ${
                tomAtivo === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}

          <button
            onClick={salvarTom}
            disabled={salvando || tomAtivo === tomSalvo}
            className="ml-auto rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {tomAtivo === tomSalvo ? `Tom ${tomAtivo} salvo` : `Salvar tom ${tomAtivo}`}
          </button>
        </div>

        <pre
          className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-slate-800"
          dangerouslySetInnerHTML={{ __html: cifraParaHtml(textoExibido) }}
        />
      </div>
    </div>
  );
}
