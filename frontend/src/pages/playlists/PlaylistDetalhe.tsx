import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { CompartilharEquipe } from '../../components/CompartilharEquipe';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Playlist, PlaylistMusica } from '../../types';
import { formatarData } from './Playlists';
import { cifraParaHtml, soLetra } from '../../utils/cifra';

// Item exibido na lista do repertório: música ou um dos itens litúrgicos.
type ItemRepertorio =
  | { tipo: 'musica'; key: string; ordem: number; musica: PlaylistMusica }
  | { tipo: 'salmo' | 'antifona'; key: string; ordem: number; texto: string };

export function PlaylistDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mexendo, setMexendo] = useState(false);

  // modal de edição (nome/data/descricao + itens litúrgicos)
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salmo, setSalmo] = useState('');
  const [antifonaEvangelho, setAntifonaEvangelho] = useState('');
  const [mostrarAcordes, setMostrarAcordes] = useState(true);

  async function carregar() {
    const resPlaylist = await api.get<Playlist>(`/playlists/${id}`);
    setPlaylist(resPlaylist.data);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!playlist) {
    return <div className="py-10 text-center text-neutral-400">Carregando…</div>;
  }

  const musicas = playlist.musicas ?? [];
  const urlPublica = `${window.location.origin}/lista-repertorio/${playlist.slug}`;

  // Lista unificada (músicas + Salmo + Antífona) ordenada por `ordem`.
  const itens: ItemRepertorio[] = musicas.map((m) => ({
    tipo: 'musica' as const,
    key: `m-${m.id}`,
    ordem: m.ordem,
    musica: m,
  }));
  if (playlist.salmo) {
    itens.push({
      tipo: 'salmo',
      key: 'salmo',
      ordem: playlist.salmoOrdem ?? 9999,
      texto: playlist.salmo,
    });
  }
  if (playlist.antifonaEvangelho) {
    itens.push({
      tipo: 'antifona',
      key: 'antifona',
      ordem: playlist.antifonaEvangelhoOrdem ?? 9999,
      texto: playlist.antifonaEvangelho,
    });
  }
  itens.sort((a, b) => a.ordem - b.ordem);

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

  // Reordena a lista inteira (músicas + itens litúrgicos) trocando o item
  // com o vizinho e enviando a nova sequência ao backend.
  async function mover(idx: number, dir: -1 | 1) {
    const destino = idx + dir;
    if (destino < 0 || destino >= itens.length) return;
    const novo = [...itens];
    [novo[idx], novo[destino]] = [novo[destino], novo[idx]];
    setMexendo(true);
    try {
      await api.put(`/playlists/${id}/reordenar`, {
        itens: novo.map((it) =>
          it.tipo === 'musica'
            ? { tipo: 'musica', songId: it.musica.song.id }
            : { tipo: it.tipo },
        ),
      });
      await carregar();
    } finally {
      setMexendo(false);
    }
  }

  // Remove um item litúrgico = limpa o campo correspondente na playlist.
  async function removerLiturgico(tipo: 'salmo' | 'antifona') {
    const rotulo = tipo === 'salmo' ? 'o Salmo' : 'a Antífona do Evangelho';
    if (!window.confirm(`Remover ${rotulo} da playlist?`)) return;
    setMexendo(true);
    try {
      await api.put(
        `/playlists/${id}`,
        tipo === 'salmo' ? { salmo: '' } : { antifonaEvangelho: '' },
      );
      await carregar();
    } finally {
      setMexendo(false);
    }
  }

  function abrirEdicao() {
    setNome(playlist!.nome);
    setData(playlist!.data.slice(0, 10)); // ISO → yyyy-mm-dd p/ input date
    setDescricao(playlist!.descricao ?? '');
    setSalmo(playlist!.salmo ?? '');
    setAntifonaEvangelho(playlist!.antifonaEvangelho ?? '');
    setModalAberto(true);
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    try {
      await api.put(`/playlists/${id}`, {
        nome,
        data,
        descricao: descricao || undefined,
        // String vazia limpa o item (o backend trata trim() → null).
        salmo,
        antifonaEvangelho,
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
          <h1 className="text-2xl font-display font-bold text-marinho">{playlist.nome}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {formatarData(playlist.data)}
            {playlist.descricao && <> · {playlist.descricao}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={abrirEdicao}
            className="rounded-md bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-300"
          >
            Editar
          </button>
          <button
            onClick={excluir}
            className="rounded-md bg-danger-50 px-3 py-1.5 text-sm font-medium text-danger-600 hover:bg-danger-100"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Compartilhamento: URL pública + senha + QR code */}
      <CompartilharEquipe url={urlPublica} senha={playlist.senha} />

      {/* Repertório ordenável */}
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setMostrarAcordes((v) => !v)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mostrarAcordes
              ? 'bg-white text-neutral-700 shadow hover:bg-neutral-50'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {mostrarAcordes ? 'Ocultar acordes' : 'Mostrar acordes'}
        </button>
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow">
        {itens.length === 0 ? (
          <p className="px-4 py-8 text-center text-neutral-400">
            Nenhuma música na playlist ainda. Adicione pelo botão{' '}
            <span className="font-medium text-success-700">+ Playlist</span> na{' '}
            <Link to="/songs" className="font-medium text-teal-600 hover:underline">
              lista de músicas
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {itens.map((item, idx) => (
              <li key={item.key} className="flex items-start gap-3 px-4 py-3">
                <span className="w-6 pt-0.5 text-right text-sm font-bold text-neutral-400">
                  {idx + 1}.
                </span>
                <div className="flex flex-col pt-0.5">
                  <button
                    onClick={() => mover(idx, -1)}
                    disabled={idx === 0 || mexendo}
                    className="text-xs text-neutral-400 hover:text-teal-600 disabled:opacity-20"
                    aria-label="Subir"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => mover(idx, 1)}
                    disabled={idx === itens.length - 1 || mexendo}
                    className="text-xs text-neutral-400 hover:text-teal-600 disabled:opacity-20"
                    aria-label="Descer"
                  >
                    ▼
                  </button>
                </div>

                {item.tipo === 'musica' ? (
                  <>
                    <Link
                      to={`/songs/${item.musica.song.id}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {item.musica.song.titulo}
                    </Link>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700">
                      {item.musica.tom}
                    </span>
                    {item.musica.tom !== item.musica.song.tom && (
                      <span className="text-xs text-neutral-400">
                        (original: {item.musica.song.tom})
                      </span>
                    )}
                    <button
                      onClick={() => remover(item.musica.song.id, item.musica.song.titulo)}
                      disabled={mexendo}
                      className="ml-auto rounded-md px-3 py-1 text-sm text-danger-600 hover:bg-danger-50 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </>
                ) : (
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-warning-50 px-2 py-0.5 text-xs font-bold text-warning-700">
                        {item.tipo === 'salmo' ? 'Salmo' : 'Antífona do Evangelho'}
                      </span>
                      <button
                        onClick={() => removerLiturgico(item.tipo)}
                        disabled={mexendo}
                        className="ml-auto rounded-md px-3 py-1 text-sm text-danger-600 hover:bg-danger-50 disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </div>
                    <pre
                      className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-neutral-800"
                      dangerouslySetInnerHTML={{
                        __html: mostrarAcordes
                          ? cifraParaHtml(item.texto)
                          : soLetra(item.texto),
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal title="Editar playlist" open={modalAberto} onClose={() => setModalAberto(false)}>
        <form onSubmit={salvarEdicao}>
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
            className="mb-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
          <p className="mb-4 text-xs text-neutral-400">
            Deixe em branco para remover este item da lista.
          </p>

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
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
