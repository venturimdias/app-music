import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Subscription } from '../../types';

interface PixState {
  pixQrCode: string;
  pixCopiaECola: string;
  expiresAt: string | null;
}

export function BillingPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PixState | null;
  const [copiado, setCopiado] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state?.pixQrCode) {
      navigate('/planos', { replace: true });
      return;
    }

    // Polling: verifica se a assinatura ficou ativa
    intervalRef.current = setInterval(async () => {
      try {
        const res = await api.get<Subscription | null>(`/billing/minha-assinatura?_t=${Date.now()}`);
        if (res.data?.status === 'active') {
          clearInterval(intervalRef.current!);
          navigate('/billing/sucesso', { replace: true });
        }
      } catch {
        // ignora erros de polling
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, navigate]);

  async function copiar() {
    if (!state?.pixCopiaECola) return;
    await navigator.clipboard.writeText(state.pixCopiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  if (!state?.pixQrCode) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
            <span className="text-2xl font-extrabold text-success-600">PIX</span>
          </div>
          <h1 className="text-xl font-display font-bold text-marinho">Pague com PIX</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Escaneie o QR code ou copie o código. O pagamento é confirmado automaticamente.
          </p>
        </div>

        {/* QR Code */}
        <div className="mt-6 flex justify-center">
          <img
            src={state.pixQrCode}
            alt="QR Code PIX"
            className="h-52 w-52 rounded-xl border border-neutral-200"
          />
        </div>

        {/* Copia e Cola */}
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium text-neutral-500">Copia e cola</p>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <p className="flex-1 truncate font-mono text-xs text-neutral-700">
              {state.pixCopiaECola}
            </p>
            <button
              onClick={copiar}
              className="shrink-0 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {state.expiresAt && (
          <p className="mt-3 text-center text-xs text-neutral-400">
            Válido até {new Date(state.expiresAt).toLocaleString('pt-BR')}
          </p>
        )}

        {/* Status aguardando */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-warning-50 px-4 py-3">
          <svg className="h-4 w-4 animate-spin text-warning-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-warning-700">Aguardando confirmação do pagamento…</span>
        </div>

        <button
          onClick={() => navigate('/planos')}
          className="mt-4 w-full rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
        >
          Voltar para os planos
        </button>
      </div>
    </div>
  );
}
