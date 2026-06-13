import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../../components/Toast';
import { cifraParaHtml, soLetra, transporCifra } from '../../utils/cifra';
import { TONS } from '../../types';
import type { PlaylistPublica } from '../../types';
import { formatarData } from './Playlists';

interface RepertorioSalvo {
  senha: string;
  playlist: PlaylistPublica;
}

// Acesso externo (sem login): valida a senha de 5 caracteres e lista o repertório.
// Toggle "Salvar offline": guarda senha + repertório no localStorage para acesso
// rápido e sem conexão; nas visitas seguintes abre direto da cópia local e
// revalida na API em segundo plano usando a senha guardada.
export function ListaRepertorio() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistPublica | null>(null);
  const [abertaId, setAbertaId] = useState<number | null>(null);
  const [salvarOffline, setSalvarOffline] = useState(false);

  // Tom ativo por música (id → tom escolhido); ausente = usa m.tom (SongTom)
  const [tomsAtivos, setTomsAtivos] = useState<Record<number, string>>({});
  // Quando false: mostra só a letra (soLetra) e oculta os botões de tom
  const [mostrarAcordes, setMostrarAcordes] = useState(true);

  const chave = `repertorio:${slug}`;

  // Lê o cache validando o formato (descarta cache antigo/corrompido).
  function lerCache(): RepertorioSalvo | null {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return null;
    try {
      const dados = JSON.parse(bruto) as RepertorioSalvo;
      if (
        typeof dados?.senha === 'string' &&
        dados.playlist?.slug === slug &&
        Array.isArray(dados.playlist.musicas)
      ) {
        return dados;
      }
    } catch {
      // JSON inválido — descarta abaixo
    }
    localStorage.removeItem(chave);
    return null;
  }

  function gravarCache(senhaOk: string, dados: PlaylistPublica) {
    const salvo: RepertorioSalvo = { senha: senhaOk, playlist: dados };
    localStorage.setItem(chave, JSON.stringify(salvo));
  }

  // Repertório já salvo neste dispositivo? Abre direto, sem pedir senha,
  // e busca a versão mais recente em segundo plano com a senha guardada.
  useEffect(() => {
    const cache = lerCache();
    if (!cache) return;
    setPlaylist(cache.playlist);
    setSenha(cache.senha);
    setSalvarOffline(true);

    api
      .post<PlaylistPublica>(`/lista-repertorio/${slug}`, { senha: cache.senha })
      .then((res) => {
        setPlaylist(res.data);
        gravarCache(cache.senha, res.data);
      })
      .catch((error) => {
        // Playlist excluída (404) ou senha não confere mais (401):
        // limpa a cópia local e volta a pedir a senha.
        // Erro de rede (sem conexão) mantém a cópia local.
        const status = error.response?.status;
        if (status === 401 || status === 404) {
          localStorage.removeItem(chave);
          setPlaylist(null);
          setSenha('');
          setSalvarOffline(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function acessar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await api.post<PlaylistPublica>(`/lista-repertorio/${slug}`, {
        senha,
      });
      setPlaylist(res.data);
      if (salvarOffline) {
        gravarCache(senha, res.data);
      }
    } catch {
      // erro (401 senha inválida / 404) já em toast pelo interceptor
    } finally {
      setEnviando(false);
    }
  }

  function alternarOffline() {
    if (salvarOffline) {
      localStorage.removeItem(chave);
      setSalvarOffline(false);
      toast('Repertório removido deste dispositivo');
    } else if (playlist) {
      gravarCache(senha, playlist);
      setSalvarOffline(true);
      toast('Repertório salvo para uso offline');
    }
  }

  if (!playlist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <form
          onSubmit={acessar}
          className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md"
        >
          <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">
            ♪ Repertório
          </h1>
          <p className="mb-6 text-center text-sm text-slate-500">
            Digite a senha que você recebeu para ver a lista de músicas.
          </p>

          <label className="mb-1 block text-sm font-medium text-slate-700">
            Senha
          </label>
          <input
            required
            maxLength={5}
            value={senha}
            onChange={(e) => setSenha(e.target.value.toUpperCase())}
            className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-indigo-500 focus:outline-none"
            placeholder="•••••"
          />

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {enviando ? 'Verificando…' : 'Acessar repertório'}
          </button>
        </form>
      </div>
    );
  }

  const musicas = playlist.musicas ?? [];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-4 py-4 text-center">
        <h1 className="text-xl font-bold text-white">♪ {playlist.nome}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {formatarData(playlist.data)}
          {playlist.descricao && <> · {playlist.descricao}</>}
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Controles globais */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Toggle: ocultar/mostrar acordes */}
          <button
            type="button"
            onClick={() => setMostrarAcordes((v) => !v)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mostrarAcordes
                ? 'bg-white text-slate-700 shadow hover:bg-slate-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {mostrarAcordes ? 'Ocultar acordes' : 'Mostrar acordes'}
          </button>

          {/* Toggle: salvar offline */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Salvar offline neste dispositivo
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={salvarOffline}
              onClick={alternarOffline}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                salvarOffline ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  salvarOffline ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {musicas.length === 0 ? (
          <p className="py-10 text-center text-slate-400">
            Esta playlist ainda não tem músicas.
          </p>
        ) : (
          <ul className="space-y-3">
            {musicas.map((m, idx) => {
              const aberta = abertaId === m.id;
              // Tom ativo desta música: escolhido pelo usuário (on-the-fly)
              // ou o SongTom (m.tom) definido pelo dono da playlist.
              const tomAtivo = tomsAtivos[m.id] ?? m.tom;
              // Texto transposto para o tom ativo
              const textoTransposto =
                tomAtivo === m.song.tom
                  ? m.song.descricao
                  : transporCifra(m.song.descricao, tomAtivo, m.song.tom);
              // Conteúdo final: com ou sem acordes
              const conteudo = mostrarAcordes
                ? cifraParaHtml(textoTransposto)
                : soLetra(textoTransposto);
              const links = [
                { url: m.song.cifra, rotulo: 'Cifra original' },
                { url: m.song.video, rotulo: 'Vídeo' },
                { url: m.song.slide, rotulo: 'Slide' },
              ].filter((l) => l.url);

              return (
                <li key={m.id} className="overflow-hidden rounded-xl bg-white shadow">
                  <button
                    onClick={() => setAbertaId(aberta ? null : m.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <span className="w-6 text-right text-sm font-bold text-slate-400">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-slate-800">
                      {m.song.titulo}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                      Tom: {tomAtivo}
                    </span>
                    <span className="ml-auto text-slate-400">
                      {aberta ? '▲' : '▼'}
                    </span>
                  </button>

                  {aberta && (
                    <div className="border-t border-slate-100 px-4 py-4">
                      {/* Links externos */}
                      {links.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {links.map((l) => (
                            <a
                              key={l.rotulo}
                              href={l.url!}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
                            >
                              {l.rotulo}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Botões de transposição (só quando acordes visíveis) */}
                      {mostrarAcordes && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {TONS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() =>
                                setTomsAtivos((prev) => ({ ...prev, [m.id]: t }))
                              }
                              className={`min-w-9 rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                                tomAtivo === t
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Cifra ou letra */}
                      <pre
                        className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-7 text-slate-800"
                        dangerouslySetInnerHTML={{ __html: conteudo }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
