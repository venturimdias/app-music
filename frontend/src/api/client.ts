import axios from 'axios';

// Em produção: VITE_API_URL aponta para o backend no Railway (https://...).
// Em dev/rede local: usa o hostname da página na porta 3000, permitindo
// acesso por celular/tablet via http://IP-do-PC:5173.
const baseURL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:3000`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// O ToastProvider registra o handler aqui para exibir erros da API.
let onApiError: (message: string) => void = () => {};

export function setApiErrorHandler(handler: (message: string) => void) {
  onApiError = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 do /auth/me é o fluxo normal de "não logado" — não mostra toast.
    const url: string = error.config?.url ?? '';
    const silencioso = url.includes('/auth/me');

    if (!silencioso) {
      const data = error.response?.data;
      const message = Array.isArray(data?.message)
        ? data.message.join('; ')
        : data?.message ?? 'Erro de conexão com o servidor';
      onApiError(message);
    }
    return Promise.reject(error);
  },
);
