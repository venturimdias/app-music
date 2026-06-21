// Indicador do tom musical (KeyBadge) — porta do design system (louvorapp-design).
// Mostra o tom (ex.: "D", "G#m") com a legenda "TOM".

type Variant = 'soft' | 'solid' | 'gold' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const sizes: Record<Size, { box: string; key: string; label: string }> = {
  sm: { box: 'h-[34px] w-[34px]', key: 'text-sm', label: 'text-[7px]' },
  md: { box: 'h-[42px] w-[42px]', key: 'text-[17px]', label: 'text-[8px]' },
  lg: { box: 'h-14 w-14', key: 'text-[22px]', label: 'text-[9px]' },
};

const variants: Record<Variant, { box: string; key: string; label: string }> = {
  soft: { box: 'bg-teal-100', key: 'text-teal-700', label: 'text-teal-600' },
  solid: { box: 'bg-marinho', key: 'text-white', label: 'text-teal-300' },
  gold: { box: 'bg-dourado-100', key: 'text-dourado-600', label: 'text-dourado-600' },
  outline: { box: 'bg-white border border-neutral-300', key: 'text-marinho', label: 'text-neutral-400' },
};

export function KeyBadge({
  tomo,
  label = 'TOM',
  size = 'md',
  variant = 'soft',
}: {
  tomo: string;
  label?: string;
  size?: Size;
  variant?: Variant;
}) {
  const s = sizes[size];
  const v = variants[variant];
  return (
    <div
      className={`inline-flex shrink-0 flex-col items-center justify-center rounded-md leading-none ${s.box} ${v.box}`}
    >
      {label && (
        <span className={`mb-0.5 font-display font-bold tracking-[0.12em] ${s.label} ${v.label}`}>
          {label}
        </span>
      )}
      <span className={`font-display font-extrabold tracking-tight ${s.key} ${v.key}`}>{tomo}</span>
    </div>
  );
}
