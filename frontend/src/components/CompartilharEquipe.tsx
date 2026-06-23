import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from './Toast';

async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    // Fallback para HTTP sem contexto seguro (acesso via IP na rede local)
    const el = document.createElement('textarea');
    el.value = texto;
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

// Bloco recolhível com a URL pública + senha + QR code da lista de
// repertório — usado tanto na tela de gestão da playlist quanto na própria
// página pública (para quem já entrou poder repassar o acesso a outros).
export function CompartilharEquipe({ url, senha }: { url: string; senha: string }) {
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);

  async function copiar(texto: string, rotulo: string) {
    await copiarTexto(texto);
    toast(`${rotulo} copiado!`);
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-teal-300 bg-teal-100">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-marinho">
          Compartilhe com a equipe
        </span>
        <span className="text-marinho">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="border-t border-teal-300/60 px-4 py-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <code className="rounded bg-white px-2 py-1 text-teal-700">{url}</code>
              <button
                onClick={() => copiar(url, 'URL')}
                className="rounded-md bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Copiar URL
              </button>
              <span className="ml-2 text-marinho">
                Senha: <code className="rounded bg-white px-2 py-1 font-bold text-teal-700">{senha}</code>
              </span>
              <button
                onClick={() => copiar(senha, 'Senha')}
                className="rounded-md bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700"
              >
                Copiar senha
              </button>
            </div>
            <div className="ml-auto flex flex-col items-center gap-1">
              <div className="rounded-lg bg-white p-2 shadow-sm">
                <QRCodeSVG value={url} size={112} />
              </div>
              <span className="text-xs text-marinho">
                Aponte a câmera para abrir
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
