import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/Toast';
import type { Plan } from '../../types';

function fmt(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function economiaAnual(mensal: number, anual: number): number {
  if (!mensal) return 0;
  return Math.round((1 - anual / (mensal * 12)) * 100);
}

export function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planos, setPlanos] = useState<Plan[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [assinando, setAssinando] = useState<string | null>(null); // 'planId-cycle'

  async function assinar(planId: number, billing_cycle: 'monthly' | 'yearly') {
    setAssinando(`${planId}-${billing_cycle}`);
    try {
      const res = await api.post<{ checkoutUrl: string }>('/billing/assinar', {
        planId,
        billing_cycle,
      });
      window.location.href = res.data.checkoutUrl;
    } catch {
      // erro tratado pelo interceptor
      toast('Não foi possível iniciar o checkout. Verifique se o plano pagar.me está configurado.');
    } finally {
      setAssinando(null);
    }
  }

  useEffect(() => {
    api
      .get<Plan[]>('/plans')
      .then((r) => setPlanos(r.data))
      .finally(() => setCarregando(false));
  }, []);

  const isAdm = user?.perfil === 'ADM';
  const planoAtualId = user?.plan?.id;

  if (carregando) {
    return <div className="py-20 text-center text-slate-400">Carregando planos…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Planos</h1>
        <p className="mt-2 text-slate-500">
          Escolha o plano ideal para gerenciar seu repertório litúrgico.
        </p>
        {isAdm && (
          <p className="mt-2 text-sm font-medium text-indigo-600">
            Você é ADM — sem limite de playlists.
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano) => {
          const isAtual = planoAtualId === plano.id && !isAdm;
          const economia = economiaAnual(
            Number(plano.price_monthly),
            Number(plano.price_yearly),
          );

          return (
            <div
              key={plano.id}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm ${
                isAtual
                  ? 'border-indigo-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Badge plano atual */}
              {isAtual && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Plano atual
                </span>
              )}

              <h2 className="text-xl font-bold text-slate-800">{plano.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{plano.description}</p>

              {/* Preços */}
              <div className="mt-4">
                {plano.is_free ? (
                  <p className="text-3xl font-bold text-slate-800">Grátis</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-slate-800">
                      {fmt(Number(plano.price_monthly))}
                      <span className="text-base font-normal text-slate-500"> /mês</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      ou {fmt(Number(plano.price_yearly))}/ano
                      {economia > 0 && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Economize {economia}%
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="mt-5 flex-1 space-y-2">
                {plano.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500">✓</span> {f}
                  </li>
                ))}
              </ul>

              {/* Ação */}
              <div className="mt-6 space-y-2">
                {isAdm ? (
                  <p className="text-center text-sm text-slate-400">Isento (ADM)</p>
                ) : isAtual ? (
                  <p className="text-center text-sm font-medium text-indigo-600">
                    Plano ativo
                  </p>
                ) : plano.is_free ? (
                  <p className="text-center text-sm text-slate-400">Plano gratuito</p>
                ) : (
                  <>
                    <button
                      onClick={() => assinar(plano.id, 'monthly')}
                      disabled={!!assinando}
                      className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {assinando === `${plano.id}-monthly`
                        ? 'Redirecionando…'
                        : `Assinar mensal — ${fmt(Number(plano.price_monthly))}/mês`}
                    </button>
                    <button
                      onClick={() => assinar(plano.id, 'yearly')}
                      disabled={!!assinando}
                      className="w-full rounded-lg border border-indigo-600 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {assinando === `${plano.id}-yearly`
                        ? 'Redirecionando…'
                        : `Assinar anual — ${fmt(Number(plano.price_yearly))}/ano`}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {user && (
        <p className="mt-8 text-center text-sm text-slate-400">
          Dúvidas? Fale com o administrador do sistema.{' '}
          <button
            onClick={() => navigate(-1)}
            className="font-medium text-indigo-600 hover:underline"
          >
            Voltar
          </button>
        </p>
      )}
    </div>
  );
}
