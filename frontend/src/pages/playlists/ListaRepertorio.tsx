import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { CompartilharEquipe } from '../../components/CompartilharEquipe';
import { useToast } from '../../components/Toast';
import { Oracoes } from '../../components/Oracoes';
import { cifraParaHtml, detectarTom, soLetra, transporCifra } from '../../utils/cifra';
import { TONS } from '../../types';
import type { LiturgiaDia, PlaylistMusica, PlaylistPublica } from '../../types';
import { formatarData } from './Playlists';
import logoColorido from '../../assets/louvorapp-horizontal.png';
import simboloBranco from '../../assets/louvorapp-simbolo-branco.png';

type Aba = 'playlist' | 'liturgia' | 'oracoes';

// Item do repertório público: música ou um dos itens litúrgicos (Salmo/Antífona).
type ItemPublico =
  | { tipo: 'musica'; key: string; ordem: number; musica: PlaylistMusica }
  | { tipo: 'salmo' | 'antifona'; key: string; ordem: number; texto: string };

interface RepertorioSalvo {
  senha: string;
  playlist: PlaylistPublica;
  liturgia?: LiturgiaDia; // salva junto quando offline está ligado
}

// Acesso externo (sem login): valida a senha de 5 caracteres e exibe 3 abas —
// Playlist, Liturgia do dia (API externa via backend) e Orações eucarísticas.
// Toggle "Salvar offline": guarda senha + repertório + liturgia no localStorage.
export function ListaRepertorio() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistPublica | null>(null);
  // Lista aberta por padrão: rastreamos os itens FECHADos (vazio = todos abertos).
  const [fechadas, setFechadas] = useState<Set<string>>(new Set());
  const [salvarOffline, setSalvarOffline] = useState(false);
  const [aba, setAba] = useState<Aba>('playlist');

  // undefined = ainda não carregada; null = indisponível; objeto = ok
  const [liturgia, setLiturgia] = useState<LiturgiaDia | null | undefined>(undefined);
  const [carregandoLiturgia, setCarregandoLiturgia] = useState(false);

  // Tom ativo por música (id → tom escolhido); ausente = usa m.tom (SongTom)
  const [tomsAtivos, setTomsAtivos] = useState<Record<number, string>>({});
  // Quando false: mostra só a letra (soLetra) e oculta os botões de tom
  const [mostrarAcordes, setMostrarAcordes] = useState(true);
  // Tom do salmo: base = tom em que foi escrito; ativo = tom para exibir
  const [tomSalmoBase, setTomSalmoBase] = useState<string | null>(null);
  const [tomSalmoAtivo, setTomSalmoAtivo] = useState<string | null>(null);

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
        return dados; // liturgia é opcional (cache antigo não tem)
      }
    } catch {
      // JSON inválido — descarta abaixo
    }
    localStorage.removeItem(chave);
    return null;
  }

  function gravarCache(senhaOk: string, dados: PlaylistPublica, lit?: LiturgiaDia) {
    const salvo: RepertorioSalvo = { senha: senhaOk, playlist: dados, liturgia: lit };
    localStorage.setItem(chave, JSON.stringify(salvo));
  }

  // Busca a liturgia do dia da playlist (lazy). Em offline ligado, atualiza o cache.
  async function carregarLiturgia(senhaOk: string): Promise<LiturgiaDia | null> {
    setCarregandoLiturgia(true);
    try {
      const res = await api.post<LiturgiaDia>(`/lista-repertorio/${slug}/liturgia`, {
        senha: senhaOk,
      });
      setLiturgia(res.data);
      if (salvarOffline && playlist) gravarCache(senhaOk, playlist, res.data);
      return res.data;
    } catch {
      setLiturgia(null); // indisponível (origem caiu / sem conexão sem cache)
      return null;
    } finally {
      setCarregandoLiturgia(false);
    }
  }

  // Repertório já salvo neste dispositivo? Abre direto, sem pedir senha,
  // e busca a versão mais recente em segundo plano com a senha guardada.
  useEffect(() => {
    const cache = lerCache();
    if (!cache) return;
    setPlaylist(cache.playlist);
    setSenha(cache.senha);
    setSalvarOffline(true);
    if (cache.liturgia) setLiturgia(cache.liturgia);

    api
      .post<PlaylistPublica>(`/lista-repertorio/${slug}`, { senha: cache.senha })
      .then((res) => {
        setPlaylist(res.data);
        // Se a data da playlist mudou, a liturgia cacheada é de outro dia:
        // descarta para forçar nova busca (a aba rebusca ao ser aberta).
        const dataPlaylist = res.data.data.slice(0, 10); // ISO → YYYY-MM-DD
        const liturgiaDefasada =
          !!cache.liturgia && cache.liturgia.data !== dataPlaylist;
        if (liturgiaDefasada) {
          setLiturgia(undefined);
          gravarCache(cache.senha, res.data, undefined);
        } else {
          gravarCache(cache.senha, res.data, cache.liturgia); // mantém a liturgia salva
        }
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
          setLiturgia(undefined);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Carrega a liturgia ao abrir a aba pela primeira vez.
  useEffect(() => {
    if (aba === 'liturgia' && liturgia === undefined && !carregandoLiturgia && playlist && senha) {
      carregarLiturgia(senha);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, liturgia, playlist]);

  async function acessar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await api.post<PlaylistPublica>(`/lista-repertorio/${slug}`, {
        senha,
      });
      setPlaylist(res.data);
      if (salvarOffline) gravarCache(senha, res.data, liturgia ?? undefined);
    } catch {
      // erro (401 senha inválida / 404) já em toast pelo interceptor
    } finally {
      setEnviando(false);
    }
  }

  async function alternarOffline() {
    if (salvarOffline) {
      localStorage.removeItem(chave);
      setSalvarOffline(false);
      toast('Repertório removido deste dispositivo');
      return;
    }
    if (!playlist) return;
    setSalvarOffline(true);
    // Garante a liturgia no cache (busca se ainda não tiver sido carregada).
    let lit = liturgia;
    if (lit === undefined) lit = await carregarLiturgia(senha);
    gravarCache(senha, playlist, lit ?? undefined);
    toast('Repertório salvo para uso offline');
  }

  function alternar(key: string) {
    setFechadas((prev) => {
      const nova = new Set(prev);
      if (nova.has(key)) nova.delete(key);
      else nova.add(key);
      return nova;
    });
  }

  if (!playlist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-papel p-4">
        <form
          onSubmit={acessar}
          className="w-full max-w-sm rounded-2xl border border-nevoa bg-white p-8 shadow-lg"
        >
          <img src={logoColorido} alt="LouvorApp" className="mx-auto mb-2 h-9 w-auto" />
          <p className="mb-6 text-center text-sm text-neutral-500">
            Digite a senha que você recebeu para ver a lista de músicas.
          </p>

          <label className="mb-1 block font-display text-sm font-medium text-marinho">
            Senha
          </label>
          <input
            required
            maxLength={5}
            value={senha}
            onChange={(e) => setSenha(e.target.value.toUpperCase())}
            className="mb-6 w-full rounded-md border border-nevoa px-3 py-2 text-center font-mono text-lg tracking-widest transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40"
            placeholder="•••••"
          />

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-teal-600 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            {enviando ? 'Verificando…' : 'Acessar repertório'}
          </button>
        </form>
      </div>
    );
  }

  const musicas = playlist.musicas ?? [];

  // Lista unificada (músicas + Salmo + Antífona) ordenada por `ordem`.
  const itens: ItemPublico[] = musicas.map((m) => ({
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

  const abas: { id: Aba; label: string }[] = [
    { id: 'playlist', label: 'Playlist' },
    { id: 'liturgia', label: 'Liturgia' },
    { id: 'oracoes', label: 'Orações' },
  ];

  return (
    <div className="min-h-screen bg-papel">
      <header className="relative overflow-hidden bg-gradient-celebracao px-4 py-8 text-center">
        <img
          src={simboloBranco}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 w-32 opacity-10"
        />
        <img src={simboloBranco} alt="" aria-hidden className="mx-auto mb-2 h-8 w-auto opacity-90" />
        <h1 className="text-xl font-display font-bold text-white">{playlist.nome}</h1>
        <p className="mt-1 text-sm text-white/70">
          {formatarData(playlist.data)}
          {playlist.descricao && <> · {playlist.descricao}</>}
        </p>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* Abas */}
        <div className="mb-5 flex gap-1 rounded-lg bg-neutral-200 p-1">
          {abas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAba(t.id)}
              className={`flex-1 rounded-md px-3 py-2 font-display text-sm transition-colors ${
                aba === t.id
                  ? 'bg-white font-semibold text-marinho shadow'
                  : 'font-medium text-neutral-600 hover:text-marinho'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Aba Playlist ─────────────────────────────────────────────── */}
        {aba === 'playlist' && (
          <>
            <CompartilharEquipe
              url={`${window.location.origin}/lista-repertorio/${slug}`}
              senha={senha}
            />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">
                  Salvar offline neste dispositivo
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={salvarOffline}
                  onClick={alternarOffline}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    salvarOffline ? 'bg-success-600' : 'bg-neutral-300'
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

            {itens.length === 0 ? (
              <p className="py-10 text-center text-neutral-400">
                Esta playlist ainda não tem itens.
              </p>
            ) : (
              <ul className="space-y-3">
                {itens.map((item, idx) => {
                  const aberta = !fechadas.has(item.key);

                  // ── Itens litúrgicos (Salmo / Antífona do Evangelho) ──
                  if (item.tipo !== 'musica') {
                    return (
                      <li key={item.key} className="overflow-hidden rounded-xl bg-white shadow">
                        <button
                          onClick={() => alternar(item.key)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                        >
                          <span className="w-6 text-right text-sm font-bold text-neutral-400">
                            {idx + 1}.
                          </span>
                          <span className="font-medium text-neutral-800">
                            {item.tipo === 'salmo' ? 'Salmo responsorial' : 'Antífona do Evangelho'}
                          </span>
                          <span className="rounded-full bg-warning-50 px-2 py-0.5 text-xs font-bold text-warning-700">
                            Liturgia
                          </span>
                          <span className="ml-auto text-neutral-400">
                            {aberta ? '▲' : '▼'}
                          </span>
                        </button>

                        {aberta && (
                          <div className="border-t border-neutral-100 px-4 py-4">
                            {item.tipo === 'salmo' && mostrarAcordes && (() => {
                              const tomDetectado = detectarTom(item.texto);
                              const valorBase = tomSalmoBase ?? tomDetectado ?? '';
                              return (
                                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  {valorBase && (
                                    <div className="flex flex-wrap gap-1">
                                      {TONS.map((t) => (
                                        <button
                                          key={t}
                                          type="button"
                                          onClick={() => setTomSalmoAtivo(t)}
                                          className={`min-w-9 rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                                            (tomSalmoAtivo ?? valorBase) === t
                                              ? 'bg-teal-600 text-white'
                                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                          }`}
                                        >
                                          {t}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-neutral-400">Tom original:</label>
                                    <select
                                      value={valorBase}
                                      onChange={(e) => {
                                        setTomSalmoBase(e.target.value);
                                        setTomSalmoAtivo(e.target.value);
                                      }}
                                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-bold text-neutral-700 focus:border-teal-500 focus:outline-none"
                                    >
                                      {!valorBase && <option value="">—</option>}
                                      {TONS.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })()}
                            <pre
                              className="overflow-x-auto whitespace-pre-wrap font-mono text-base leading-7 text-neutral-800"
                              dangerouslySetInnerHTML={{
                                __html: (() => {
                                  const raw = item.texto;
                                  if (!mostrarAcordes) return soLetra(raw);
                                  if (item.tipo === 'salmo' && tomSalmoAtivo) {
                                    const base = tomSalmoBase ?? detectarTom(raw);
                                    if (base && base !== tomSalmoAtivo) {
                                      return cifraParaHtml(transporCifra(raw, tomSalmoAtivo, base));
                                    }
                                  }
                                  return cifraParaHtml(raw);
                                })(),
                              }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  }

                  // ── Música ──
                  const m = item.musica;
                  const tomAtivo = tomsAtivos[m.id] ?? m.tom;
                  const momentoStr = (m.song.momentos ?? [])
                    .map((x) => x.titulo)
                    .join(', ');
                  const textoTransposto =
                    tomAtivo === m.song.tom
                      ? m.song.descricao
                      : transporCifra(m.song.descricao, tomAtivo, m.song.tom);
                  const conteudo = mostrarAcordes
                    ? cifraParaHtml(textoTransposto)
                    : soLetra(textoTransposto);
                  const links = [
                    { url: m.song.cifra, rotulo: 'Cifra original' },
                    { url: m.song.video, rotulo: 'Vídeo' },
                    { url: m.song.slide, rotulo: 'Slide' },
                  ].filter((l) => l.url);

                  return (
                    <li key={item.key} className="overflow-hidden rounded-xl bg-white shadow">
                      <button
                        onClick={() => alternar(item.key)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50"
                      >
                        <span className="w-6 text-right text-sm font-bold text-neutral-400">
                          {idx + 1}.
                        </span>
                        <span className="flex flex-col items-center rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-700 leading-tight">
                          <span className="hidden sm:block">Tom</span>
                          <span>{tomAtivo}</span>
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium text-neutral-800">
                            {m.song.titulo}
                          </span>
                          {momentoStr && (
                            <span className="text-xs text-neutral-400">{momentoStr}</span>
                          )}
                        </span>
                        <span className="ml-auto text-neutral-400">
                          {aberta ? '▲' : '▼'}
                        </span>
                      </button>

                      {aberta && (
                        <div className="border-t border-neutral-100 px-4 py-4">
                          {links.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {links.map((l) => (
                                <a
                                  key={l.rotulo}
                                  href={l.url!}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-md bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-300"
                                >
                                  {l.rotulo}
                                </a>
                              ))}
                            </div>
                          )}

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
                                      ? 'bg-teal-600 text-white'
                                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}

                          <pre
                            className="overflow-x-auto whitespace-pre-wrap font-mono text-base leading-7 text-neutral-800"
                            dangerouslySetInnerHTML={{ __html: conteudo }}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ── Aba Liturgia ─────────────────────────────────────────────── */}
        {aba === 'liturgia' && (
          <div>
            {carregandoLiturgia || liturgia === undefined ? (
              <p className="py-10 text-center text-neutral-400">Carregando liturgia…</p>
            ) : liturgia === null ? (
              <p className="py-10 text-center text-neutral-400">
                Liturgia indisponível no momento.{' '}
                <button
                  type="button"
                  onClick={() => carregarLiturgia(senha)}
                  className="font-medium text-teal-600 underline"
                >
                  Tentar de novo
                </button>
              </p>
            ) : (
              <div className="rounded-xl bg-white p-5 shadow">
                <div className="mb-4 border-b border-neutral-100 pb-3">
                  <h2 className="text-lg font-display font-bold text-marinho">{liturgia.titulo}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                    <span>{formatarData(playlist.data)}</span>
                    {liturgia.cor && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        {liturgia.cor}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  {liturgia.leituras.map((l, i) => (
                    <div key={i}>
                      <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                        {l.tipo}
                      </p>
                      {l.referencia && (
                        <p className="text-sm font-medium text-neutral-600">{l.referencia}</p>
                      )}
                      {l.titulo && (
                        <p className="text-sm italic text-neutral-500">{l.titulo}</p>
                      )}
                      {l.refrao && (
                        <p className="mt-1 text-sm font-semibold text-neutral-700">
                          R. {l.refrao}
                        </p>
                      )}
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                        {l.texto}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
                  Fonte: {liturgia.fonte}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Aba Orações ──────────────────────────────────────────────── */}
        {aba === 'oracoes' && <Oracoes />}
      </main>
    </div>
  );
}
