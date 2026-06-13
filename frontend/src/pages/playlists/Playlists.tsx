import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Playlist } from '../../types';

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function Playlists() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const res = await api.get<Playlist[]>('/playlists');
      setPlaylists(res.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNova() {
    setNome('');
    setData('');
    setDescricao('');
    setModalAberto(true);
  }

  async function criar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await api.post<Playlist>('/playlists', {
        nome,
        data,
        descricao: descricao || undefined,
      });
      toast('Playlist criada');
      navigate(`/playlists/${res.data.id}`);
    } catch {
      setSalvando(false);
    }
  }

  async function excluir(playlist: Playlist, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Excluir a playlist "${playlist.nome}"?`)) return;
    try {
      await api.delete(`/playlists/${playlist.id}`);
      toast('Playlist excluída');
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    }
  }

  // Limite atingido quando o usuário não é ADM e o nº de playlists ativas
  // iguala ou supera o max_playlists do plano.
  const isAdm = user?.perfil === 'ADM';
  const ativas = playlists.filter((p) => !p.bloqueada).length;
  const limite = user?.plan?.max_playlists ?? 1;
  const limiteAtingido = !isAdm && ativas >= limite;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Minhas playlists</h1>
        {limiteAtingido ? (
          <button
            onClick={() => navigate('/planos')}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Fazer upgrade
          </button>
        ) : (
          <button
            onClick={abrirNova}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Nova playlist
          </button>
        )}
      </div>

      {/* Banner informativo quando limite atingido */}
      {limiteAtingido && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            Você atingiu o limite de <strong>{limite} playlist(s)</strong> do plano{' '}
            <strong>{user?.plan?.name ?? 'FREE'}</strong>.
          </span>
          <button
            onClick={() => navigate('/planos')}
            className="ml-auto whitespace-nowrap rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
          >
            Ver planos
          </button>
        </div>
      )}

      {carregando ? (
        <p className="py-10 text-center text-slate-400">Carregando…</p>
      ) : playlists.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Você ainda não tem playlists. Crie a primeira!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => !playlist.bloqueada && navigate(`/playlists/${playlist.id}`)}
              className={`relative rounded-xl bg-white p-5 shadow transition-shadow ${
                playlist.bloqueada
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:shadow-md'
              }`}
            >
              {/* Badge de bloqueada */}
              {playlist.bloqueada && (
                <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                  Bloqueada
                </span>
              )}

              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-slate-800">{playlist.nome}</h2>
                {!playlist.bloqueada && (
                  <button
                    onClick={(e) => excluir(playlist, e)}
                    className="rounded-md px-2 py-0.5 text-sm text-red-500 hover:bg-red-50"
                    aria-label="Excluir playlist"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-indigo-600">
                {formatarData(playlist.data)}
              </p>
              {playlist.descricao && (
                <p className="mt-1 text-sm text-slate-500">{playlist.descricao}</p>
              )}

              {/* CTA de upgrade nas playlists bloqueadas */}
              {playlist.bloqueada && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/planos'); }}
                  className="mt-3 w-full rounded-md bg-amber-500 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  Fazer upgrade para desbloquear
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal title="Nova playlist" open={modalAberto} onClose={() => setModalAberto(false)}>
        <form onSubmit={criar}>
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
              disabled={salvando}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {salvando ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
