import { Link, useSearchParams } from 'react-router-dom';

export function BillingCancelado() {
  const [params] = useSearchParams();
  const motivo = params.get('reason');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Pagamento não concluído</h1>
        <p className="mt-2 text-slate-500">
          {motivo === 'no_checkout'
            ? 'Não foi possível gerar o link de pagamento. Tente novamente ou entre em contato com o suporte.'
            : 'O pagamento foi cancelado ou não foi concluído. Nenhuma cobrança foi realizada.'}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to="/planos"
            className="block w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Tentar novamente
          </Link>
          <Link
            to="/playlists"
            className="block w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar para playlists
          </Link>
        </div>
      </div>
    </div>
  );
}
