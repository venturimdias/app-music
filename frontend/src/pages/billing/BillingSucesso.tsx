import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export function BillingSucesso() {
  const { refreshUser } = useAuth();

  // Atualiza o contexto para refletir o novo plano
  useEffect(() => {
    refreshUser?.();
  }, [refreshUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Assinatura confirmada!</h1>
        <p className="mt-2 text-slate-500">
          Seu pagamento foi processado com sucesso. Suas playlists já estão disponíveis.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to="/playlists"
            className="block w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ver minhas playlists
          </Link>
          <Link
            to="/account/subscription"
            className="block w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver minha assinatura
          </Link>
        </div>
      </div>
    </div>
  );
}
