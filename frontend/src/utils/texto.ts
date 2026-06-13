// Normaliza para busca sem diferenciar maiúsculas/acentos
// ("espirito" acha "Espírito").
export function normalizar(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
