import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../components/Toast';
import type { Payment, Plan, Subscription } from '../../types';

const statusLabel: Record<string, { label: string; color: string }> = {
  active:   { label: 'Ativa',        color: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'Pendente',     color: 'bg-yellow-100 text-yellow-700' },
  past_due: { label: 'Inadimplente', color: 'bg-red-100 text-red-700' },
  canceled: { label: 'Cancelada',    color: 'bg-slate-100 text-slate-500' },
};

const paymentStatusColor: Record<string, string> = {
  paid:     'text-emerald-600',
  failed:   'text-red-600',
  refunded: 'text-slate-500',
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

type TabType = 'assinaturas' | 'pagamentos';

interface SubWithUser extends Subscription {
  user?: { id: number; nome: string; email: string };
}
interface PayWithUser extends Payment {
  user?: { id: number; nome: string; email: string };
}

export function AdminPagamentos() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>('assinaturas');

  const [subs, setSubs] = useState<SubWithUser[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsPage, setSubsPage] = useState(1);

  const [pays, setPays] = useState<PayWithUser[]>([]);
  const [paysTotal, setPaysTotal] = useState(0);
  const [paysPage, setPaysPage] = useState(1);

  const [carregando, setCarregando] = useState(false);

  const [planos, setPlanos] = useState<Plan[]>([]);
  const [grantModal, setGrantModal] = useState<SubWithUser | null>(null);
  const [grantPlanId, setGrantPlanId] = useState('');

  const LIMIT = 20;

  async function carregarSubs(page: number) {
    setCarregando(true);
    try {
      const r = await api.get<{ data: SubWithUser[]; total: number }>(
        `/admin/subscriptions?page=${page}&limit=${LIMIT}`,
      );
      setSubs(r.data.data);
      setSubsTotal(r.data.total);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarPays(page: number) {
    setCarregando(true);
    try {
      const r = await api.get<{ data: PayWithUser[]; total: number }>(
        `/admin/payments?page=${page}&limit=${LIMIT}`,
      );
      setPays(r.data.data);
      setPaysTotal(r.data.total);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    api.get<Plan[]>('/plans').then((r) => setPlanos(r.data));
  }, []);

  useEffect(() => {
    if (tab === 'assinaturas') carregarSubs(subsPage);
    else carregarPays(paysPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, subsPage, paysPage]);

  async function concederAcesso() {
    if (!grantModal || !grantPlanId) return;
    try {
      await api.post(`/admin/subscriptions/${grantModal.id}/grant-access`, {
        planId: Number(grantPlanId),
      });
      toast('Acesso concedido');
      setGrantModal(null);
      await carregarSubs(subsPage);
    } catch {
      // erro tratado pelo interceptor
    }
  }

  async function reembolsar(id: number) {
    if (!window.confirm('Confirma reembolso desta cobrança?')) return;
    try {
      await api.post(`/admin/payments/${id}/refund`);
      toast('Reembolso solicitado');
      await carregarPays(paysPage);
    } catch {
      // erro tratado pelo interceptor
    }
  }

  const mrr = subs
    .filter((s) => s.status === 'active' && s.billing_cycle === 'monthly')
    .reduce((acc, s) => acc + Number(s.plan?.price_monthly ?? 0), 0);

  const arr = subs
    .filter((s) => s.status === 'active' && s.billing_cycle === 'yearly')
    .reduce((acc, s) => acc + Number(s.plan?.price_yearly ?? 0) / 12, 0);

  const ativas = subs.filter((s) => s.status === 'active').length;

  const tabClass = (t: TabType) =>
    `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      tab === t
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Pagamentos</h1>
        <div className="flex gap-2">
          <button className={tabClass('assinaturas')} onClick={() => setTab('assinaturas')}>
            Assinaturas
          </button>
          <button className={tabClass('pagamentos')} onClick={() => setTab('pagamentos')}>
            Cobranças
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      {tab === 'assinaturas' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">MRR estimado</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{fmt(mrr + arr)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Assinaturas ativas</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{ativas}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-400">Total registros</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{subsTotal}</p>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {tab === 'assinaturas' ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Ciclo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Próx. cobrança</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Carregando…
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{s.user?.nome ?? '—'}</p>
                      <p className="text-xs text-slate-400">{s.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.plan?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {s.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          statusLabel[s.status]?.color ?? 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {statusLabel[s.status]?.label ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fmtDate(s.current_period_end)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setGrantModal(s);
                          setGrantPlanId(String(s.planId));
                        }}
                        className="rounded-md px-3 py-1 text-indigo-600 hover:bg-indigo-50 text-xs"
                      >
                        Conceder acesso
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Carregando…
                  </td>
                </tr>
              ) : pays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma cobrança registrada.
                  </td>
                </tr>
              ) : (
                pays.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {fmtDate(p.paid_at ?? p.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.user?.nome ?? '—'}</p>
                      <p className="text-xs text-slate-400">{p.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {fmt(Number(p.amount))}
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize">
                      {p.payment_method ?? '—'}
                      {p.card_last_digits && ` •••• ${p.card_last_digits}`}
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        paymentStatusColor[p.status] ?? 'text-slate-600'
                      }`}
                    >
                      {p.status === 'paid' ? 'Pago' : p.status === 'failed' ? 'Falhou' : 'Reembolsado'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'paid' && (
                        <button
                          onClick={() => reembolsar(p.id)}
                          className="rounded-md px-3 py-1 text-red-500 hover:bg-red-50 text-xs"
                        >
                          Reembolsar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* Paginação */}
        {tab === 'assinaturas' && subsTotal > LIMIT && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              {(subsPage - 1) * LIMIT + 1}–{Math.min(subsPage * LIMIT, subsTotal)} de {subsTotal}
            </span>
            <div className="flex gap-2">
              <button
                disabled={subsPage === 1}
                onClick={() => setSubsPage((p) => p - 1)}
                className="rounded-md px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={subsPage * LIMIT >= subsTotal}
                onClick={() => setSubsPage((p) => p + 1)}
                className="rounded-md px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
        {tab === 'pagamentos' && paysTotal > LIMIT && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              {(paysPage - 1) * LIMIT + 1}–{Math.min(paysPage * LIMIT, paysTotal)} de {paysTotal}
            </span>
            <div className="flex gap-2">
              <button
                disabled={paysPage === 1}
                onClick={() => setPaysPage((p) => p - 1)}
                className="rounded-md px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={paysPage * LIMIT >= paysTotal}
                onClick={() => setPaysPage((p) => p + 1)}
                className="rounded-md px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal conceder acesso */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-slate-800">Conceder acesso</h3>
            <p className="mb-3 text-sm text-slate-500">
              Usuário: <strong>{grantModal.user?.email}</strong>
            </p>
            <label className="mb-1 block text-sm font-medium text-slate-700">Plano</label>
            <select
              value={grantPlanId}
              onChange={(e) => setGrantPlanId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setGrantModal(null)}
                className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={concederAcesso}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
