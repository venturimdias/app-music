import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ComboboxMulti } from '../../components/ComboboxMulti';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { cifraParaHtml, transporCifra } from '../../utils/cifra';
import {
  TONS,
  type Artista,
  type Momento,
  type Song,
  type Tempo,
} from '../../types';

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none';

// Grupo de "chips" clicáveis para as relações N:N (tempo/momento/artista).
function MultiSelect({
  label,
  itens,
  selecionados,
  onToggle,
  onNovo,
  max,
}: {
  label: string;
  itens: { id: number; titulo: string }[];
  selecionados: number[];
  onToggle: (id: number) => void;
  onNovo: () => void; // abre o modal de cadastro rápido do recurso
  max?: number;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
        {max && <span className="text-neutral-400"> (máx. {max})</span>}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((item) => {
          const ativo = selecionados.includes(item.id);
          const bloqueado = !ativo && !!max && selecionados.length >= max;
          return (
            <button
              key={item.id}
              type="button"
              disabled={bloqueado}
              onClick={() => onToggle(item.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                ativo
                  ? 'bg-teal-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-40'
              }`}
            >
              {item.titulo}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onNovo}
          className="rounded-full border border-dashed border-teal-400 px-3 py-1 text-sm font-medium text-teal-600 hover:bg-teal-100"
        >
          + Novo
        </button>
      </div>
    </div>
  );
}

type RecursoNovo = 'tempo' | 'momento' | 'artista';

const ROTULO_RECURSO: Record<RecursoNovo, string> = {
  tempo: 'tempo litúrgico',
  momento: 'momento litúrgico',
  artista: 'artista',
};

export function SongForm() {
  const { id } = useParams(); // presente = edição
  const navigate = useNavigate();
  const { toast } = useToast();

  const [titulo, setTitulo] = useState('');
  const [tom, setTom] = useState<string>('C');
  const [cifra, setCifra] = useState('');
  const [video, setVideo] = useState('');
  const [slide, setSlide] = useState('');
  const [bpm, setBpm] = useState<number>(80);
  const [descricao, setDescricao] = useState('');
  const descricaoRef = useRef<HTMLTextAreaElement>(null);
  const [tempoIds, setTempoIds] = useState<number[]>([]);
  const [momentoIds, setMomentoIds] = useState<number[]>([]);
  const [artistaIds, setArtistaIds] = useState<number[]>([]);

  const [tempos, setTempos] = useState<Tempo[]>([]);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);

  // Tom ativo da PRÉ-VISUALIZAÇÃO (transpõe o texto todo, como na referência)
  const [tomPreview, setTomPreview] = useState<string>('');
  const [salvando, setSalvando] = useState(false);

  // cadastro rápido de tempo/momento/artista sem sair da página
  const [novoRecurso, setNovoRecurso] = useState<RecursoNovo | null>(null);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  useEffect(() => {
    async function carregar() {
      const [resTempo, resMomento, resArtista] = await Promise.all([
        api.get<Tempo[]>('/tempo'),
        api.get<Momento[]>('/momento'),
        api.get<Artista[]>('/artista'),
      ]);
      setTempos(resTempo.data);
      setMomentos(resMomento.data);
      setArtistas(resArtista.data);

      if (id) {
        const res = await api.get<Song>(`/songs/${id}`);
        const s = res.data;
        setTitulo(s.titulo);
        setTom(s.tom);
        setCifra(s.cifra ?? '');
        setVideo(s.video ?? '');
        setSlide(s.slide ?? '');
        setBpm(s.bpm ?? 80);
        setDescricao(s.descricao);
        setTempoIds(s.tempos.map((t) => t.id));
        setMomentoIds(s.momentos.map((m) => m.id));
        setArtistaIds(s.artistas.map((a) => a.id));
      }
    }
    carregar();
  }, [id]);

  // Altura mínima vem do atributo rows; cresce com o conteúdo a partir daí.
  useEffect(() => {
    const el = descricaoRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [descricao]);

  function toggle(lista: number[], setLista: (v: number[]) => void, itemId: number) {
    setLista(
      lista.includes(itemId)
        ? lista.filter((i) => i !== itemId)
        : [...lista, itemId],
    );
  }

  function transporPreview(novoTom: string) {
    setDescricao(transporCifra(descricao, novoTom, tomPreview || tom));
    setTomPreview(novoTom);
  }

  function abrirNovo(recurso: RecursoNovo, tituloInicial = '') {
    setNovoRecurso(recurso);
    setNovoTitulo(tituloInicial);
    setNovaDescricao('');
  }

  // Cria o tempo/momento/artista pela API e já o deixa selecionado na música.
  async function salvarNovo(e: FormEvent) {
    e.preventDefault();
    if (!novoRecurso) return;
    setSalvandoNovo(true);
    try {
      const res = await api.post<{ id: number; titulo: string; descricao: string | null }>(
        `/${novoRecurso}`,
        { titulo: novoTitulo, descricao: novaDescricao || undefined },
      );
      const item = res.data;
      if (novoRecurso === 'tempo') {
        setTempos([...tempos, item]);
        setTempoIds([...tempoIds, item.id]);
      } else if (novoRecurso === 'momento') {
        setMomentos([...momentos, item]);
        setMomentoIds([...momentoIds, item.id]);
      } else {
        setArtistas([...artistas, item]);
        // respeita o limite de 3 artistas selecionados
        if (artistaIds.length < 3) setArtistaIds([...artistaIds, item.id]);
      }
      toast(`Novo ${ROTULO_RECURSO[novoRecurso]} criado`);
      setNovoRecurso(null);
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // O botão clicado (Salvar/Atualizar x "...e ir ao detalhe") decide o destino.
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const irParaDetalhe = submitter?.dataset.destino === 'detalhe';

    setSalvando(true);
    try {
      const body = {
        titulo,
        tom,
        cifra: cifra || undefined,
        video: video || undefined,
        slide: slide || undefined,
        bpm: bpm || undefined,
        descricao,
        tempoIds,
        momentoIds,
        artistaIds,
      };
      let songId = id;
      if (id) {
        await api.put(`/songs/${id}`, body);
        toast('Música atualizada');
      } else {
        const res = await api.post<Song>('/songs', body);
        songId = String(res.data.id);
        toast('Música cadastrada');
      }
      navigate(irParaDetalhe ? `/songs/${songId}` : '/songs');
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
    <form onSubmit={salvar}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-marinho">
          {id ? 'Editar música' : 'Nova música'}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/songs')}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            data-destino="detalhe"
            disabled={salvando}
            className="rounded-md bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-300 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : id ? 'Atualizar e ir ao detalhe' : 'Salvar e ir ao detalhe'}
          </button>
          <button
            type="submit"
            data-destino="lista"
            disabled={salvando}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : id ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Dados da música */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-4">
          {/* Linha 1: Título · Tom · BPM */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Título *
              </label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Tom original *
              </label>
              <select
                required
                value={tom}
                onChange={(e) => setTom(e.target.value)}
                className={inputClass}
              >
                {TONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                BPM
              </label>
              <input
                type="number"
                min={40}
                max={218}
                value={bpm}
                onChange={(e) => setBpm(Math.min(218, Math.max(40, Number(e.target.value))))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Linha 2: Cifra · Vídeo · Slide */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Cifra (URL)
              </label>
              <input
                type="url"
                value={cifra}
                onChange={(e) => setCifra(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Vídeo
              </label>
              <input
                type="url"
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Slide
              </label>
              <input
                type="url"
                value={slide}
                onChange={(e) => setSlide(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <MultiSelect
          label="Tempo litúrgico"
          itens={tempos}
          selecionados={tempoIds}
          onToggle={(itemId) => toggle(tempoIds, setTempoIds, itemId)}
          onNovo={() => abrirNovo('tempo')}
        />
        <MultiSelect
          label="Momento litúrgico"
          itens={momentos}
          selecionados={momentoIds}
          onToggle={(itemId) => toggle(momentoIds, setMomentoIds, itemId)}
          onNovo={() => abrirNovo('momento')}
        />
        {/* Artistas podem ser muitos — combobox com busca em vez de chips */}
        <ComboboxMulti
          label="Artista"
          nomeItem="artista"
          itens={artistas}
          selecionados={artistaIds}
          onToggle={(itemId) => toggle(artistaIds, setArtistaIds, itemId)}
          onCriar={(titulo) => abrirNovo('artista', titulo)}
          max={3}
        />
      </div>

      {/* Seções 1 e 2 da spec: editar | visualizar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <label className="mb-2 block text-sm font-semibold text-neutral-700">
            Editar música * <span className="font-normal text-neutral-400">
              (texto puro, acordes entre colchetes: [D], [Em7]…)
            </span>
          </label>
          <textarea
            ref={descricaoRef}
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full resize-none overflow-hidden rounded-md border border-neutral-300 p-3 font-mono text-sm leading-7 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="mb-2 text-sm font-semibold text-neutral-700">
            Visualizar música
          </p>
          <div className="mb-3 flex flex-wrap gap-1">
            {TONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => transporPreview(t)}
                className={`min-w-8 rounded px-2 py-1 text-xs font-bold transition-colors ${
                  tomPreview === t
                    ? 'bg-teal-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <pre
            className="overflow-x-auto whitespace-pre-wrap font-mono text-base leading-7 text-neutral-800"
            dangerouslySetInnerHTML={{ __html: cifraParaHtml(descricao) }}
          />
        </div>
      </div>
    </form>

    {/* Cadastro rápido de tempo/momento/artista — fica fora do <form>
        principal para o submit de um não disparar o do outro. */}
    <Modal
      title={novoRecurso ? `Novo ${ROTULO_RECURSO[novoRecurso]}` : ''}
      open={!!novoRecurso}
      onClose={() => setNovoRecurso(null)}
    >
      <form onSubmit={salvarNovo}>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Título *
        </label>
        <input
          required
          autoFocus
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          className="mb-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Descrição
        </label>
        <input
          value={novaDescricao}
          onChange={(e) => setNovaDescricao(e.target.value)}
          className="mb-6 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setNovoRecurso(null)}
            className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvandoNovo}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {salvandoNovo ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
    </>
  );
}
