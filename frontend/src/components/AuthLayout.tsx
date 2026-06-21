import type { ReactNode } from 'react';
import logoColorido from '../assets/louvorapp-horizontal.png';
import logoBranco from '../assets/louvorapp-horizontal-branco.png';
import simboloBranco from '../assets/louvorapp-simbolo-branco.png';

// Shell split-panel das telas de autenticação (Login / Registrar) — porta do
// design system (louvorapp-design / AuthShell). Painel de marca à esquerda
// (gradiente de celebração) + área de formulário à direita.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Painel de marca (desktop) ───────────────────────────────────── */}
      <div className="relative hidden w-[44%] flex-col overflow-hidden bg-gradient-celebracao px-12 py-12 text-white lg:flex">
        <img
          src={simboloBranco}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-[18%] -right-[40%] w-[620px] opacity-[0.06]"
        />
        <img src={logoBranco} alt="LouvorApp" className="w-48" />
        <div className="flex max-w-md flex-1 flex-col justify-center">
          <h2 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight">
            Reúna, ensaie,
            <br />
            celebre.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Cifras, letras e repertório em um só lugar. Organize celebrações e compartilhe
            com todo o grupo de canto.
          </p>
        </div>
        <div className="font-display text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
          Cante · Toque · Celebre
        </div>
      </div>

      {/* ── Área do formulário ──────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-papel p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Logo no topo (mobile, quando o painel de marca está oculto) */}
          <img src={logoColorido} alt="LouvorApp" className="mx-auto mb-8 h-9 w-auto lg:hidden" />
          {children}
        </div>
      </div>
    </div>
  );
}
