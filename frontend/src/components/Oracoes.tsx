import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ORACOES } from '../content/oracoes';

// Lista as Orações Eucarísticas (markdown embutido) com um seletor + corpo
// renderizado. Estilo do markdown vem da classe `.markdown` (index.css).
export function Oracoes() {
  const [ativaId, setAtivaId] = useState(ORACOES[0]?.id ?? '');
  const ativa = ORACOES.find((o) => o.id === ativaId) ?? ORACOES[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {ORACOES.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setAtivaId(o.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              o.id === ativa?.id
                ? 'bg-teal-600 text-white'
                : 'bg-white text-neutral-700 shadow hover:bg-neutral-50'
            }`}
          >
            {o.titulo}
          </button>
        ))}
      </div>

      <div className="markdown rounded-xl bg-white p-5 shadow">
        {ativa ? (
          <ReactMarkdown>{ativa.conteudo}</ReactMarkdown>
        ) : (
          <p className="text-sm text-neutral-400">Nenhuma oração cadastrada.</p>
        )}
      </div>
    </div>
  );
}
