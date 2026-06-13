import { useState } from 'react';
import { normalizar } from '../utils/texto';

interface ComboboxMultiProps {
  label: string;
  nomeItem: string; // ex.: "artista" → opção `+ Criar artista "..."`
  itens: { id: number; titulo: string }[];
  selecionados: number[];
  onToggle: (id: number) => void;
  onCriar: (titulo: string) => void;
  max?: number;
}

const MAX_SUGESTOES = 8;

// Seleção múltipla com busca: chips removíveis + input com autocomplete.
// Pensado para listas grandes (ex.: artistas), onde chips de tudo não cabem.
export function ComboboxMulti({
  label,
  nomeItem,
  itens,
  selecionados,
  onToggle,
  onCriar,
  max,
}: ComboboxMultiProps) {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);

  const escolhidos = itens.filter((i) => selecionados.includes(i.id));
  const atingiuMax = !!max && selecionados.length >= max;

  const termo = normalizar(busca.trim());
  const sugestoes = itens
    .filter(
      (i) =>
        !selecionados.includes(i.id) &&
        (!termo || normalizar(i.titulo).includes(termo)),
    )
    .slice(0, MAX_SUGESTOES);

  function escolher(id: number) {
    onToggle(id);
    setBusca('');
  }

  function criar() {
    onCriar(busca.trim());
    setBusca('');
    setAberto(false);
  }

  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {max && <span className="text-slate-400"> (máx. {max})</span>}
      </label>

      {escolhidos.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {escolhidos.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-sm font-medium text-white"
            >
              {item.titulo}
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="rounded-full px-1 leading-none hover:bg-indigo-500"
                aria-label={`Remover ${item.titulo}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={busca}
          disabled={atingiuMax}
          onChange={(e) => {
            setBusca(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setAberto(false)}
          placeholder={
            atingiuMax
              ? `Limite de ${max} atingido — remova um para trocar`
              : `Digite para buscar ${nomeItem}…`
          }
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
        />

        {aberto && !atingiuMax && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
            {sugestoes.map((item) => (
              <button
                key={item.id}
                type="button"
                // preventDefault no mousedown evita o blur do input antes do clique
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(item.id)}
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50"
              >
                {item.titulo}
              </button>
            ))}
            {sugestoes.length === 0 && !busca.trim() && (
              <p className="px-3 py-2 text-sm text-slate-400">
                Nenhum {nomeItem} disponível.
              </p>
            )}
            {busca.trim() && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={criar}
                className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                + Criar {nomeItem} "{busca.trim()}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
