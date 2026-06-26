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

// Marca um bloco de várias linhas (ex.: refrão repetido) para ficar todo em
// negrito — "[[" abre e "]]" fecha, colado no começo/fim da linha (do mesmo
// jeito que "[" já era usado) ou numa linha própria. Distinto do "[Acorde]"
// inline (um colchete só) para não conflitar com a transposição/realce dele.
const ABRE_BLOCO = '[[';
const FECHA_BLOCO = ']]';

// Um token é acorde se for nota + sufixo conhecido (+ extensão/baixo opcional).
// Estrito de propósito, para não classificar palavras (CASA, AMOR) como acorde.
// Inclui +/- (aumentado/alterado, ex.: G7+, C7-5) e ° (diminuto, ex.: D#°),
// comuns nas cifras do app.
const RE_ACORDE =
  /^[A-G][#b]?(m|maj|min|dim|aug|sus|°)?\d*[+-]?\d*(\([^)]*\))?(\/[A-G][#b]?)?$/;

// Linhas de instrução tipo "Intro/INTRO: Bm7 G7+" guardam o rótulo (até os
// dois-pontos) intacto e só tratam o que vem depois como acordes — sem isso,
// transporNotas trocaria letras A-G dentro do próprio rótulo (ex.: "ABERTURA").
function separarRotulo(linha: string): { rotulo: string; resto: string } | null {
  const m = linha.match(/^([^:\n]*:\s*)(.*)$/);
  if (!m) return null;
  const [, rotulo, resto] = m;
  if (!resto.trim()) return null;
  return { rotulo, resto };
}

// Linha composta só de acordes (ignorando colchetes de seção, parênteses e
// um rótulo opcional antes de ":").
export function ehLinhaAcorde(linha: string): boolean {
  const corpo = separarRotulo(linha)?.resto ?? linha;
  const limpa = corpo.replace(/[[\]]/g, ' ').trim();
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
      if (ehLinhaAcorde(linha)) {
        const sep = separarRotulo(linha);
        if (sep) return sep.rotulo + transporNotas(sep.resto, semitons);
        return transporNotas(linha, semitons);
      }
      // linha de letra: transpõe só os acordes inline
      return linha
        .replace(/\[([^\]\n]*)\]/g, (_, c) => `[${transporNotas(c, semitons)}]`)
        .replace(/\{\{([^}\n]*)\}\}/g, (_, c) => `{{${transporNotas(c, semitons)}}}`);
    })
    .join('\n');
}

// Detecta o tom da cifra a partir do primeiro acorde encontrado (linha de
// acorde ou token inline [Acorde]). Retorna a nota no formato NOMES ou null.
export function detectarTom(texto: string): string | null {
  for (const linha of texto.split('\n')) {
    const inline = linha.match(/\[([A-G][#b]?)/);
    if (inline) {
      const pc = PITCH[inline[1]];
      if (pc !== undefined) return NOMES[pc];
    }
    if (ehLinhaAcorde(linha)) {
      const m = linha.trim().match(/^[A-G][#b]?/);
      if (m) {
        const pc = PITCH[m[0]];
        if (pc !== undefined) return NOMES[pc];
      }
    }
  }
  return null;
}

// Remove os acordes, deixando só a letra: descarta linhas de acorde, os
// marcadores de bloco [[ ]] e os tokens inline [..]/{{..}}, além de
// marcadores de seção [ ] soltos.
export function soLetra(texto: string): string {
  return texto
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return t !== ABRE_BLOCO && t !== FECHA_BLOCO && !ehLinhaAcorde(l);
    })
    .map((l) =>
      l
        .replace(/\[[^\]\n]*\]|\{\{[^}\n]*\}\}/g, '')
        .replace(/^\s*\[+/, '')
        .replace(/\]+\s*$/, '')
        .replace(/\s+$/, ''),
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Converte os acordes em <span class="acorde"> para renderizar em destaque
// (negrito + cor, ver .acorde no index.css): linhas 100% de acordes inteiras,
// dentro de linhas de letra os tokens [Acorde] / {{Acorde}}, e blocos inteiros
// entre marcadores [[ / ]] (ex.: refrão repetido, letra + acordes negritados).
export function cifraParaHtml(texto: string): string {
  let dentroBloco = false;
  return texto
    .split('\n')
    .map((linhaOriginal) => {
      let linha = linhaOriginal;

      // Abre o bloco se "[[" aparece no começo da linha (só espaços antes) —
      // tanto colado em acordes/letra quanto numa linha só com o marcador.
      if (!dentroBloco) {
        const i = linha.indexOf(ABRE_BLOCO);
        if (i !== -1 && linha.slice(0, i).trim() === '') {
          linha = linha.slice(i + ABRE_BLOCO.length);
          dentroBloco = true;
        }
      }

      if (dentroBloco) {
        // Fecha o bloco se "]]" aparece no final da linha (só espaços depois).
        const fim = linha.lastIndexOf(FECHA_BLOCO);
        if (fim !== -1 && linha.slice(fim + FECHA_BLOCO.length).trim() === '') {
          linha = linha.slice(0, fim);
          dentroBloco = false;
        }
        return linha.trim() ? `<span class="acorde">${escapeHtml(linha)}</span>` : '';
      }

      if (ehLinhaAcorde(linha)) {
        const sep = separarRotulo(linha);
        const rotulo = sep ? escapeHtml(sep.rotulo) : '';
        const corpo = sep ? sep.resto : linha;
        return `${rotulo}<span class="acorde">${escapeHtml(corpo)}</span>`;
      }
      return escapeHtml(linha)
        .replace(/\{\{([^}\n]*)\}\}/g, '<span class="acorde">$1</span>')
        .replace(/\[([^\]\n]*)\]/g, '<span class="acorde">$1</span>');
    })
    .join('\n');
}
