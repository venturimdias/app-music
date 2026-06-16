// Erro específico do reCAPTCHA no cliente (token não obtido). Diferenciamos de
// erros de API — estes já viram toast pelo interceptor do axios; os do reCAPTCHA
// precisam ser exibidos manualmente pela página.
export class RecaptchaError extends Error {}

const TIMEOUT_MS = 10000;

// Obtém o token do reCAPTCHA v3 com timeout. Sem o timeout, se a chamada ao
// Google for bloqueada (ad blocker / extensão de privacidade / rede), a Promise
// fica pendurada para sempre e o formulário trava em "Enviando…".
export async function obterTokenRecaptcha(
  executeRecaptcha: ((action: string) => Promise<string>) | undefined,
  action: string,
): Promise<string> {
  if (!executeRecaptcha) {
    throw new RecaptchaError(
      'Não foi possível carregar o reCAPTCHA. Desative bloqueadores de anúncios/rastreamento e recarregue a página.',
    );
  }

  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new RecaptchaError(
            'Tempo esgotado ao validar o reCAPTCHA. Verifique sua conexão (ou bloqueadores) e tente novamente.',
          ),
        ),
      TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([executeRecaptcha(action), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
