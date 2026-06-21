import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Evita que um erro de render derrube a aplicação inteira (tela branca).
// Mostra a mensagem do erro para facilitar o diagnóstico em produção.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-4 text-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-lg font-display font-bold text-marinho">
              Algo deu errado nesta tela
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              Ocorreu um erro inesperado. Você pode tentar recarregar a página.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-neutral-100 p-3 text-left text-xs text-danger-600">
              {this.state.error.message}
            </pre>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Recarregar
              </button>
              <a
                href="/songs"
                className="rounded-lg border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Voltar ao início
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
