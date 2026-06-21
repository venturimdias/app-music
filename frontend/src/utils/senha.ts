// Regras de senha compartilhadas entre o cadastro e a troca de senha.
// Espelham as validações do backend (RegisterDto / ChangePasswordDto).

export const REGRAS = [
  { label: '1 letra maiúscula', ok: (v: string) => /[A-Z]/.test(v) },
  { label: '1 letra minúscula', ok: (v: string) => /[a-z]/.test(v) },
  { label: '2 números', ok: (v: string) => (v.match(/\d/g) ?? []).length >= 2 },
  { label: '1 caractere especial', ok: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { label: 'mínimo 8 caracteres', ok: (v: string) => v.length >= 8 },
];

// 0–5 (quantas regras a senha cumpre)
export function forcaSenha(senha: string): number {
  return REGRAS.filter((r) => r.ok(senha)).length;
}

export function senhaValida(senha: string): boolean {
  return forcaSenha(senha) === REGRAS.length;
}

export const barraColor = [
  'bg-danger-600',
  'bg-danger-400',
  'bg-warning-400',
  'bg-warning-400',
  'bg-success-600',
  'bg-success-600',
];
export const barraLabel = ['', 'Muito fraca', 'Fraca', 'Média', 'Boa', 'Forte'];
