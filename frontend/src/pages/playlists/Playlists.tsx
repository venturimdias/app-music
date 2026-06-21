import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Playlist } from '../../types';
import simboloBranco from '../../assets/louvorapp-simbolo-branco.png';

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Gradientes de capa (paleta da marca) — escolhidos ciclicamente por índice.
const CAPAS = [
  'linear-gradient(160deg,#202040,#2E6E78)',
  'linear-gradient(160deg,#161842,#3f8893)',
  'linear-gradient(160deg,#243a52,#5FA3AD)',
  'linear-gradient(160deg,#202040,#C9A961)',
  'linear-gradient(160deg,#161842,#235760)',
  'linear-gradient(160deg,#2c2c54,#3f8893)',
];

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
  const [salmo, setSalmo] = useState('');
  const [antifonaEvangelho, setAntifonaEvangelho] = useState('');
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
    setSalmo('');
    setAntifonaEvangelho('');
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
        salmo: salmo || undefined,
        antifonaEvangelho: antifonaEvangelho || undefined,
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
  const isDemo = user?.perfil === 'DEMO';
  const ativas = playlists.filter((p) => !p.bloqueada).length;
  const limite = user?.plan?.max_playlists ?? 1;
  const limiteAtingido = !isAdm && ativas >= limite;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-marinho">Minhas playlists</h1>
        {limiteAtingido ? (
          isDemo ? null : (
            <button
              onClick={() => navigate('/planos')}
              className="rounded-md bg-dourado-500 px-4 py-2 text-sm font-semibold text-marinho-profundo transition-colors hover:bg-dourado-600"
            >
              Fazer upgrade
            </button>
          )
        ) : (
          <button
            onClick={abrirNova}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Nova playlist
          </button>
        )}
      </div>

      {/* Banner informativo quando limite atingido */}
      {limiteAtingido && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
          {isDemo ? (
            <span>
              Você atingiu o limite de <strong>{limite} playlist(s)</strong> e está no
              perfil de <strong>DEMONSTRAÇÃO</strong>.
            </span>
          ) : (
            <>
              <span>
                Você atingiu o limite de <strong>{limite} playlist(s)</strong> do plano{' '}
                <strong>{user?.plan?.name ?? 'FREE'}</strong>.
              </span>
              <button
                onClick={() => navigate('/planos')}
                className="ml-auto whitespace-nowrap rounded-md bg-warning-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-warning-700"
              >
                Ver planos
              </button>
            </>
          )}
        </div>
      )}

      {carregando ? (
        <p className="py-10 text-center text-neutral-400">Carregando…</p>
      ) : playlists.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          Você ainda não tem playlists. Crie a primeira!
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist, idx) => (
            <div
              key={playlist.id}
              onClick={() => !playlist.bloqueada && navigate(`/playlists/${playlist.id}`)}
              className={`group relative overflow-hidden rounded-2xl border border-nevoa bg-white shadow-sm transition-all ${
                playlist.bloqueada
                  ? 'cursor-not-allowed opacity-60'
                  : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              {/* Capa em gradiente de marca */}
              <div
                className="relative flex h-28 items-end p-4"
                style={{ background: CAPAS[idx % CAPAS.length] }}
              >
                <img
                  src={simboloBranco}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute -right-3 -top-3 w-24 opacity-10"
                />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 font-display text-xs font-semibold text-white backdrop-blur-sm">
                  {formatarData(playlist.data)}
                </span>
                {playlist.bloqueada && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    Bloqueada
                  </span>
                )}
              </div>

              {/* Corpo */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display font-semibold text-marinho">{playlist.nome}</h2>
                  {!playlist.bloqueada && (
                    <button
                      onClick={(e) => excluir(playlist, e)}
                      className="-mr-1 -mt-1 rounded-md px-2 py-0.5 text-sm text-neutral-400 hover:bg-danger-50 hover:text-danger-600"
                      aria-label="Excluir playlist"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {playlist.descricao && (
                  <p className="mt-1 text-sm text-neutral-500">{playlist.descricao}</p>
                )}

                {/* CTA de upgrade nas playlists bloqueadas */}
                {playlist.bloqueada && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/planos'); }}
                    className="mt-3 w-full rounded-md bg-dourado-500 py-1.5 text-xs font-semibold text-marinho-profundo transition-colors hover:bg-dourado-600"
                  >
                    Fazer upgrade para desbloquear
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal title="Nova playlist" open={modalAberto} onClose={() => setModalAberto(false)}>
        <form onSubmit={criar}>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Nome *
          </label>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Data *
          </label>
          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Descrição
          </label>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Salmo responsorial <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <textarea
            value={salmo}
            onChange={(e) => setSalmo(e.target.value)}
            rows={3}
            placeholder="R. Refrão&#10;Versículos do salmo…"
            className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Antífona do Evangelho <span className="font-normal text-neutral-400">(opcional)</span>
          </label>
          <textarea
            value={antifonaEvangelho}
            onChange={(e) => setAntifonaEvangelho(e.target.value)}
            rows={2}
            placeholder="Aleluia, aleluia…"
            className="mb-6 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {salvando ? 'Criando…' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
