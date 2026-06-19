// Normalização para busca, equivalente ao `normalizar` do frontend:
// remove acentos e ignora maiúsculas/minúsculas ("espirito" acha "Espírito").
export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Texto de busca do título.
export function buscaTitulo(titulo: string): string {
  return normalizar(titulo ?? '');
}

// Texto de busca da letra: remove os acordes inline ([..] e {{..}}) na mesma
// linha — mesma regra do frontend — para casar a letra mesmo com acordes
// intercalados (ex.: "Sant[D]o" → "santo"). O recorte não cruza quebra de
// linha, senão um colchete de seção apagaria o refrão junto.
export function buscaLetra(descricao: string): string {
  return normalizar((descricao ?? '').replace(/\[[^\]\n]*\]|\{\{[^}\n]*\}\}/g, ''));
}
