import { REGRAS, forcaSenha, barraColor, barraLabel } from '../utils/senha';

// Barra de força (5 segmentos) + checklist de requisitos.
// Reutilizado no cadastro (/register) e na troca de senha (/account/password).
export function ForcaSenha({ senha }: { senha: string }) {
  const forca = forcaSenha(senha);

  return (
    <>
      <div className="mt-2 mb-1">
        <div className="flex gap-1">
          {REGRAS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < forca ? barraColor[forca] : 'bg-neutral-200'
              }`}
            />
          ))}
        </div>
        <p
          className={`mt-1 text-xs font-medium ${
            forca >= 4 ? 'text-success-600' : 'text-warning-600'
          }`}
        >
          {barraLabel[forca]}
        </p>
      </div>

      <ul className="mb-4 mt-2 space-y-0.5">
        {REGRAS.map((r) => {
          const ok = r.ok(senha);
          return (
            <li
              key={r.label}
              className={`flex items-center gap-1.5 text-xs ${
                ok ? 'text-success-600' : 'text-neutral-400'
              }`}
            >
              <span className="text-base leading-none">{ok ? '✓' : '○'}</span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </>
  );
}
