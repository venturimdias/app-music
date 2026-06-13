import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import type { Payment, Subscription } from '../../types';

const statusLabel: Record<string, { label: string; color: string }> = {
  active:   { label: 'Ativa',       color: 'bg-emerald-100 text-emerald-700' },
  pending:  { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-700' },
  past_due: { label: 'Inadimplente',color: 'bg-red-100 text-red-700' },
  canceled: { label: 'Cancelada',   color: 'bg-slate-100 text-slate-500' },
};

const paymentStatusLabel: Record<string, { label: string; color: string }> = {
  paid:     { label: 'Pago',        color: 'text-emerald-600' },
  failed:   { label: 'Falhou',      color: 'text-red-600' },
  refunded: { label: 'Reembolsado', color: 'text-slate-500' },
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export function MinhaAssinatura() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [assinatura, setAssinatura] = useState<Subscription | null | undefined>(undefined);
  const [pagamentos, setPagamentos] = useState<Payment[]>([]);
  const [cancelando, setCancelando] = useState(false);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);

  useEffect(() => {
    api.get<Subscription | null>('/billing/minha-assinatura')
      .then((r) => setAssinatura(r.data))
      .catch(() => setAssinatura(null));

    api.get<Payment[]>('/billing/minha-assinatura/pagamentos')
      .then((r) => setPagamentos(r.data))
      .catch(() => setPagamentos([]));
  }, []);

  async function cancelar() {
    setCancelando(true);
    try {
      await api.delete('/billing/minha-assinatura');
      toast('Assinatura cancelada. Plano revertido para FREE.');
      await refreshUser();
      setAssinatura(null);
      setMostrarCancelar(false);
    } catch {
      // erro já tratado pelo interceptor
    } finally {
      setCancelando(false);
    }
  }

  const isAdm = user?.perfil === 'ADM';

  if (assinatura === undefined) {
    return <div className="py-20 text-center text-slate-400">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Minha assinatura</h1>

      {/* Plano atual */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Plano atual
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-slate-800">
              {isAdm ? 'ADM (isento)' : user?.plan?.name ?? '—'}
            </p>
            {!isAdm && user?.plan && (
              <p className="mt-0.5 text-sm text-slate-500">
                {user.plan.max_playlists} playlist{user.plan.max_playlists > 1 ? 's' : ''} disponível{user.plan.max_playlists > 1 ? 'is' : ''}
              </p>
            )}
          </div>
          {!isAdm && !user?.plan?.is_free && (
            <Link
              to="/planos"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Trocar plano
            </Link>
          )}
          {!isAdm && user?.plan?.is_free && (
            <Link
              to="/planos"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Fazer upgrade
            </Link>
          )}
        </div>
      </div>

      {/* Assinatura */}
      {assinatura ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Assinatura
          </h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Plano</dt>
              <dd className="font-medium text-slate-800">{assinatura.plan?.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Ciclo</dt>
              <dd className="font-medium text-slate-800 capitalize">
                {assinatura.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    statusLabel[assinatura.status]?.color ?? 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {statusLabel[assinatura.status]?.label ?? assinatura.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Próxima cobrança</dt>
              <dd className="font-medium text-slate-800">
                {fmtDate(assinatura.current_period_end)}
              </dd>
            </div>
            {assinatura.status === 'past_due' && assinatura.past_due_since && (
              <div className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                Pagamento em atraso desde {fmtDate(assinatura.past_due_since)}.
                Você tem até 5 dias para regularizar antes do cancelamento automático.
              </div>
            )}
          </dl>

          {(assinatura.status === 'active' || assinatura.status === 'past_due') && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              {!mostrarCancelar ? (
                <button
                  onClick={() => setMostrarCancelar(true)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Cancelar assinatura
                </button>
              ) : (
                <div className="rounded-lg bg-red-50 p-4">
                  <p className="mb-3 text-sm font-medium text-red-700">
                    Tem certeza? Seu plano voltará para FREE e playlists excedentes serão bloqueadas.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={cancelar}
                      disabled={cancelando}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelando ? 'Cancelando…' : 'Confirmar cancelamento'}
                    </button>
                    <button
                      onClick={() => setMostrarCancelar(false)}
                      className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Manter assinatura
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : !isAdm && user?.plan?.is_free ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Você está no plano gratuito.</p>
          <Link
            to="/planos"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ver planos disponíveis
          </Link>
        </div>
      ) : null}

      {/* Histórico de pagamentos */}
      {pagamentos.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Histórico de pagamentos
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagamentos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-slate-600">{fmtDate(p.paid_at ?? p.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{fmt(Number(p.amount))}</td>
                  <td className="px-4 py-3 text-slate-500 capitalize">
                    {p.payment_method ?? '—'}
                    {p.card_last_digits && ` •••• ${p.card_last_digits}`}
                  </td>
                  <td className={`px-4 py-3 font-medium ${paymentStatusLabel[p.status]?.color}`}>
                    {paymentStatusLabel[p.status]?.label ?? p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
