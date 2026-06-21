import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/Toast';
import type { Plan } from '../../types';

// Tipo completo do plano (inclui campos só visíveis para ADM)
interface PlanAdm extends Plan {
  description: string;
  features: string[];
  is_active: boolean;
  pagarme_plan_id_monthly: string | null;
  pagarme_plan_id_yearly: string | null;
}

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none';

export function AdminPlanos() {
  const { toast } = useToast();
  const [planos, setPlanos] = useState<PlanAdm[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<PlanAdm | null>(null);
  const [salvando, setSalvando] = useState(false);

  // campos do formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoMensal, setPrecoMensal] = useState('');
  const [precoAnual, setPrecoAnual] = useState('');
  const [maxPlaylists, setMaxPlaylists] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [pagarmeIdMensal, setPagarmeIdMensal] = useState('');
  const [pagarmeIdAnual, setPagarmeIdAnual] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const res = await api.get<PlanAdm[]>('/plans');
      setPlanos(res.data);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditando(null);
    setNome(''); setDescricao('');
    setPrecoMensal(''); setPrecoAnual('');
    setMaxPlaylists('');
    setFeatures(['']);
    setPagarmeIdMensal(''); setPagarmeIdAnual('');
    setModalAberto(true);
  }

  function abrirEditar(p: PlanAdm) {
    setEditando(p);
    setNome(p.name);
    setDescricao(p.description);
    setPrecoMensal(String(p.price_monthly));
    setPrecoAnual(String(p.price_yearly));
    setMaxPlaylists(String(p.max_playlists));
    setFeatures(p.features.length ? p.features : ['']);
    setPagarmeIdMensal(p.pagarme_plan_id_monthly ?? '');
    setPagarmeIdAnual(p.pagarme_plan_id_yearly ?? '');
    setModalAberto(true);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const body = {
      name: nome,
      description: descricao,
      price_monthly: Number(precoMensal),
      price_yearly: Number(precoAnual),
      max_playlists: Number(maxPlaylists),
      features: features.filter(Boolean),
      pagarme_plan_id_monthly: pagarmeIdMensal || undefined,
      pagarme_plan_id_yearly: pagarmeIdAnual || undefined,
    };
    try {
      if (editando) {
        await api.patch(`/plans/${editando.id}`, body);
        toast('Plano atualizado');
      } else {
        await api.post('/plans', body);
        toast('Plano criado');
      }
      setModalAberto(false);
      await carregar();
    } catch {
      // erro já em toast pelo interceptor
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(p: PlanAdm) {
    const acao = p.is_active ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja ${acao} o plano "${p.name}"?`)) return;
    try {
      await api.patch(`/plans/${p.id}/toggle`);
      toast(`Plano ${acao === 'ativar' ? 'ativado' : 'desativado'}`);
      await carregar();
    } catch {
      // erro já em toast
    }
  }

  function setFeature(idx: number, val: string) {
    setFeatures((prev) => prev.map((f, i) => (i === idx ? val : f)));
  }
  function addFeature() { setFeatures((prev) => [...prev, '']); }
  function removeFeature(idx: number) {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-marinho">Gerenciar Planos</h1>
        <button
          onClick={abrirNovo}
          className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          + Novo plano
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Mensal</th>
              <th className="px-4 py-3">Anual</th>
              <th className="px-4 py-3">Playlists</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {carregando ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  Carregando…
                </td>
              </tr>
            ) : planos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  Nenhum plano cadastrado.
                </td>
              </tr>
            ) : (
              planos.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {p.name}
                    {p.is_free && (
                      <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                        gratuito
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {Number(p.price_monthly) === 0
                      ? '—'
                      : `R$ ${Number(p.price_monthly).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {Number(p.price_yearly) === 0
                      ? '—'
                      : `R$ ${Number(p.price_yearly).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{p.max_playlists}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.is_active
                          ? 'bg-success-100 text-success-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="rounded-md px-3 py-1 text-teal-600 hover:bg-teal-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => alternarAtivo(p)}
                      className={`ml-1 rounded-md px-3 py-1 ${
                        p.is_active
                          ? 'text-neutral-500 hover:bg-neutral-100'
                          : 'text-success-600 hover:bg-success-50'
                      }`}
                    >
                      {p.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={editando ? 'Editar plano' : 'Novo plano'}
        open={modalAberto}
        onClose={() => setModalAberto(false)}
      >
        <form onSubmit={salvar}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">Nome *</label>
              <input required value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">Descrição *</label>
              <input required value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Preço mensal (R$) *</label>
              <input
                required type="number" min="0" step="0.01"
                value={precoMensal} onChange={(e) => setPrecoMensal(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Preço anual (R$) *</label>
              <input
                required type="number" min="0" step="0.01"
                value={precoAnual} onChange={(e) => setPrecoAnual(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Máx. playlists *</label>
              <input
                required type="number" min="1"
                value={maxPlaylists} onChange={(e) => setMaxPlaylists(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Recursos incluídos
              </label>
              <div className="space-y-2">
                {features.map((f, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={f}
                      onChange={(e) => setFeature(idx, e.target.value)}
                      placeholder={`Recurso ${idx + 1}`}
                      className={inputClass}
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="rounded-md px-2 text-danger-600 hover:bg-danger-50"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm text-teal-600 hover:underline"
                >
                  + Adicionar recurso
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                ID pagar.me (mensal)
              </label>
              <input
                value={pagarmeIdMensal}
                onChange={(e) => setPagarmeIdMensal(e.target.value)}
                placeholder="plan_xxxxxxxxxxxxxxxx"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                ID pagar.me (anual)
              </label>
              <input
                value={pagarmeIdAnual}
                onChange={(e) => setPagarmeIdAnual(e.target.value)}
                placeholder="plan_xxxxxxxxxxxxxxxx"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
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
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
