import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
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

type MetodoPagamento = 'credit_card' | 'pix';

// Pagamento via cartão de crédito oculto temporariamente.
// Para reativar futuramente, basta trocar este flag para true.
const CARTAO_HABILITADO = false;

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function Planos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planos, setPlanos] = useState<Plan[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [assinando, setAssinando] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<MetodoPagamento>(
    CARTAO_HABILITADO ? 'credit_card' : 'pix',
  );
  const [cpfCnpj, setCpfCnpj] = useState('');

  async function assinar(planId: number, billing_cycle: 'monthly' | 'yearly') {
    if (metodo === 'pix' && cpfCnpj.replace(/\D/g, '').length < 11) {
      toast('Informe um CPF ou CNPJ válido para pagar com PIX.');
      return;
    }
    setAssinando(`${planId}-${billing_cycle}`);
    try {
      const res = await api.post<
        | { provider: 'pagarme'; checkoutUrl: string }
        | { provider: 'asaas'; pixQrCode: string; pixCopiaECola: string; expiresAt: string | null }
      >('/billing/assinar', {
        planId,
        billing_cycle,
        payment_method: metodo,
        ...(metodo === 'pix' ? { cpfCnpj: cpfCnpj.replace(/\D/g, '') } : {}),
      });

      if (res.data.provider === 'pagarme') {
        window.location.href = res.data.checkoutUrl;
      } else {
        navigate('/billing/pix', {
          state: {
            pixQrCode: res.data.pixQrCode,
            pixCopiaECola: res.data.pixCopiaECola,
            expiresAt: res.data.expiresAt,
          },
        });
      }
    } catch {
      if (metodo === 'credit_card') {
        toast('Não foi possível iniciar o checkout. Verifique se o plano pagar.me está configurado.');
      } else {
        toast('Não foi possível gerar o PIX. Verifique a configuração do Asaas.');
      }
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

  // "Mais popular" = plano pago de menor preço (porta de entrada). Apenas visual.
  const pagos = planos.filter((p) => !p.is_free);
  const destaqueId = pagos.length
    ? pagos.reduce((a, b) => (Number(a.price_monthly) <= Number(b.price_monthly) ? a : b)).id
    : undefined;

  if (carregando) {
    return <div className="py-20 text-center text-neutral-400">Carregando planos…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-display font-bold text-marinho">Planos</h1>
        <p className="mt-2 text-neutral-500">
          Escolha o plano ideal para gerenciar seu repertório litúrgico.
        </p>
        {isAdm && (
          <p className="mt-2 text-sm font-medium text-teal-600">
            Você é ADM — sem limite de playlists.
          </p>
        )}
      </div>

      {/* Toggle método de pagamento — exibido só quando há mais de uma opção */}
      {!isAdm && CARTAO_HABILITADO && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 p-1 gap-1">
            <button
              onClick={() => setMetodo('credit_card')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                metodo === 'credit_card'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Cartão de crédito
            </button>
            <button
              onClick={() => setMetodo('pix')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                metodo === 'pix'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="font-bold text-success-600 text-xs">PIX</span>
              PIX recorrente
            </button>
          </div>
        </div>
      )}

      {metodo === 'pix' && (
        <div className="mb-6 mx-auto max-w-sm space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              CPF ou CNPJ <span className="text-danger-600">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <p className="text-xs text-neutral-500">
            Com PIX, você receberá um QR code a cada ciclo de cobrança para renovar sua assinatura.
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano) => {
          const isAtual = planoAtualId === plano.id && !isAdm;
          const economia = economiaAnual(
            Number(plano.price_monthly),
            Number(plano.price_yearly),
          );

          const destaque = plano.id === destaqueId;
          return (
            <div
              key={plano.id}
              className={`relative flex flex-col rounded-2xl p-6 ${
                destaque
                  ? 'bg-gradient-deep text-white shadow-lg lg:-translate-y-2'
                  : `border-2 bg-white shadow-sm ${isAtual ? 'border-teal-500' : 'border-neutral-200 hover:border-neutral-300'}`
              }`}
            >
              {isAtual ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Plano atual
                </span>
              ) : destaque ? (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-dourado-500 px-3 py-0.5 text-xs font-semibold text-marinho-profundo">
                  <Sparkles size={12} /> Mais popular
                </span>
              ) : null}

              <h2 className={`text-xl font-display font-bold ${destaque ? 'text-white' : 'text-marinho'}`}>
                {plano.name}
              </h2>
              <p className={`mt-1 text-sm ${destaque ? 'text-white/70' : 'text-neutral-500'}`}>
                {plano.description}
              </p>

              <div className="mt-4">
                {plano.is_free ? (
                  <p className={`text-3xl font-display font-bold ${destaque ? 'text-white' : 'text-marinho'}`}>
                    Grátis
                  </p>
                ) : (
                  <>
                    <p className={`text-3xl font-display font-bold ${destaque ? 'text-white' : 'text-marinho'}`}>
                      {fmt(Number(plano.price_monthly))}
                      <span className={`text-base font-normal ${destaque ? 'text-white/60' : 'text-neutral-500'}`}> /mês</span>
                    </p>
                    <p className={`mt-1 text-sm ${destaque ? 'text-white/70' : 'text-neutral-500'}`}>
                      ou {fmt(Number(plano.price_yearly))}/ano
                      {economia > 0 && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            destaque ? 'bg-white/15 text-white' : 'bg-success-100 text-success-700'
                          }`}
                        >
                          Economize {economia}%
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plano.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 text-sm ${destaque ? 'text-white/90' : 'text-neutral-700'}`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                        destaque ? 'bg-white/15' : 'bg-teal-100'
                      }`}
                    >
                      <Check size={11} strokeWidth={3} className={destaque ? 'text-teal-300' : 'text-teal-700'} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2">
                {isAdm ? (
                  <p className={`text-center text-sm ${destaque ? 'text-white/60' : 'text-neutral-400'}`}>
                    Isento (ADM)
                  </p>
                ) : isAtual ? (
                  <p className={`text-center text-sm font-medium ${destaque ? 'text-white' : 'text-teal-600'}`}>
                    Plano ativo
                  </p>
                ) : plano.is_free ? (
                  <p className={`text-center text-sm ${destaque ? 'text-white/60' : 'text-neutral-400'}`}>
                    Plano gratuito
                  </p>
                ) : (
                  <>
                    <button
                      onClick={() => assinar(plano.id, 'monthly')}
                      disabled={!!assinando}
                      className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        destaque
                          ? 'bg-dourado-500 text-marinho-profundo hover:bg-dourado-600'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {assinando === `${plano.id}-monthly`
                        ? metodo === 'pix' ? 'Gerando PIX…' : 'Redirecionando…'
                        : `Assinar mensal — ${fmt(Number(plano.price_monthly))}/mês`}
                    </button>
                    <button
                      onClick={() => assinar(plano.id, 'yearly')}
                      disabled={!!assinando}
                      className={`w-full rounded-lg border py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        destaque
                          ? 'border-white/40 text-white hover:bg-white/10'
                          : 'border-teal-600 text-teal-600 hover:bg-teal-100'
                      }`}
                    >
                      {assinando === `${plano.id}-yearly`
                        ? metodo === 'pix' ? 'Gerando PIX…' : 'Redirecionando…'
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
        <p className="mt-8 text-center text-sm text-neutral-400">
          Dúvidas? Fale com o administrador do sistema.{' '}
          <button
            onClick={() => navigate(-1)}
            className="font-medium text-teal-600 hover:underline"
          >
            Voltar
          </button>
        </p>
      )}
    </div>
  );
}
