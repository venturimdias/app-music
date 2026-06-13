// Transposição e renderização de cifras.
//
// As letras do app guardam acordes de dois jeitos: inline entre colchetes
// ([D]Vem) ou em linhas separadas acima da letra (estilo mais comum). Como
// muitas letras estão em MAIÚSCULAS, bibliotecas genéricas confundem palavras
// ("E", "EM", "A") com acordes e corrompem o texto. Por isso transpomos só o
// que reconhecemos como acorde: linhas 100% de acordes e tokens entre
// colchetes; as linhas de letra ficam intactas.

// Notas na grafia usada pelo app (índice = pitch class 0–11).
const NOMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

// Aceita também bemóis/enarmonias na entrada.
const PITCH: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

// Um token é acorde se for nota + sufixo conhecido (+ extensão/baixo opcional).
// Estrito de propósito, para não classificar palavras (CASA, AMOR) como acorde.
const RE_ACORDE =
  /^[A-G][#b]?(m|maj|min|dim|aug|sus)?\d*(\([^)]*\))?(\/[A-G][#b]?)?$/;

// Linha composta só de acordes (ignorando colchetes de seção e parênteses).
export function ehLinhaAcorde(linha: string): boolean {
  const limpa = linha.replace(/[[\]]/g, ' ').trim();
  if (!limpa) return false;
  return limpa
    .split(/\s+/)
    .every((t) => RE_ACORDE.test(t) || /^[()]+$/.test(t));
}

function transporNota(nota: string, semitons: number): string {
  const pc = PITCH[nota];
  if (pc === undefined) return nota;
  return NOMES[(pc + semitons + 12) % 12];
}

// Transpõe todas as notas ([A-G] com # ou b) de um trecho, preservando
// espaçamento, sufixos e baixos (ex.: "Em7", "D7(4/9)", "G/B").
function transporNotas(trecho: string, semitons: number): string {
  return trecho.replace(/[A-G][#b]?/g, (n) => transporNota(n, semitons));
}

function semitonsEntre(origem: string, destino: string): number | null {
  const o = PITCH[origem];
  const d = PITCH[destino];
  if (o === undefined || d === undefined) return null;
  return (d - o + 12) % 12;
}

// Transpõe a cifra de tomOrigem para tomDestino. Só mexe em linhas de acorde e
// em tokens [..]/{{..}}; linhas de letra (mesmo em maiúsculas) ficam intactas.
export function transporCifra(
  texto: string,
  tomDestino: string,
  tomOrigem: string,
): string {
  const semitons = semitonsEntre(tomOrigem, tomDestino);
  if (!semitons) return texto; // sem mudança ou tom inválido

  return texto
    .split('\n')
    .map((linha) => {
      if (ehLinhaAcorde(linha)) return transporNotas(linha, semitons);
      // linha de letra: transpõe só os acordes inline
      return linha
        .replace(/\[([^\]\n]*)\]/g, (_, c) => `[${transporNotas(c, semitons)}]`)
        .replace(/\{\{([^}\n]*)\}\}/g, (_, c) => `{{${transporNotas(c, semitons)}}}`);
    })
    .join('\n');
}

// Remove os acordes, deixando só a letra: descarta linhas de acorde e os
// tokens inline [..]/{{..}}, além de marcadores de seção [ ] soltos.
export function soLetra(texto: string): string {
  return texto
    .split('\n')
    .filter((l) => !ehLinhaAcorde(l))
    .map((l) =>
      l
        .replace(/\[[^\]\n]*\]|\{\{[^}\n]*\}\}/g, '')
        .replace(/^\s*\[/, '')
        .replace(/\]\s*$/, '')
        .replace(/\s+$/, ''),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Converte a marcação [Acorde] / {{Acorde}} em <span class="acorde"> para
// renderizar com destaque (escapando HTML antes, por segurança).
export function cifraParaHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{\{/g, '<span class="acorde">')
    .replace(/\}\}/g, '</span>')
    .replace(/\[/g, '<span class="acorde">')
    .replace(/\]/g, '</span>');
}
