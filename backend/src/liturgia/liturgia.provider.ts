import { Injectable } from '@nestjs/common';

// Contrato NORMALIZADO consumido pelo app — estável, independente do provedor.
export interface LeituraNormalizada {
  tipo: string; // "Primeira leitura", "Salmo responsorial", "Evangelho", ...
  referencia?: string;
  titulo?: string;
  refrao?: string; // só no salmo
  texto: string;
}

export interface LiturgiaNormalizada {
  data: string; // YYYY-MM-DD
  titulo: string; // celebração do dia (ex.: "Domingo de Pentecostes, Solenidade")
  cor: string; // cor litúrgica (ex.: "Vermelho")
  leituras: LeituraNormalizada[];
  fonte: string;
}

export interface ProvedorLiturgia {
  buscar(dia: number, mes: number, ano: number): Promise<LiturgiaNormalizada>;
}

const BASE = 'https://liturgia.up.railway.app/v2';
const FONTE = 'liturgia.up.railway.app';
const pad = (n: number) => String(n).padStart(2, '0');

// O provedor pode devolver cada leitura como objeto OU array (dias com
// múltiplas opções/celebrações). Pegamos a primeira opção de forma defensiva.
function primeiro<T>(v: T | T[] | undefined | null): T | undefined {
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

function normalizar(raw: any, isoData: string): LiturgiaNormalizada {
  const L = raw?.leituras ?? {};
  const leituras: LeituraNormalizada[] = [];

  const pl = primeiro<any>(L.primeiraLeitura);
  if (pl?.texto) {
    leituras.push({ tipo: 'Primeira leitura', referencia: pl.referencia, titulo: pl.titulo, texto: pl.texto });
  }
  const sl = primeiro<any>(L.salmo);
  if (sl?.texto) {
    leituras.push({ tipo: 'Salmo responsorial', referencia: sl.referencia, refrao: sl.refrao, texto: sl.texto });
  }
  const sg = primeiro<any>(L.segundaLeitura);
  if (sg?.texto) {
    leituras.push({ tipo: 'Segunda leitura', referencia: sg.referencia, titulo: sg.titulo, texto: sg.texto });
  }
  const ev = primeiro<any>(L.evangelho);
  if (ev?.texto) {
    leituras.push({ tipo: 'Evangelho', referencia: ev.referencia, titulo: ev.titulo, texto: ev.texto });
  }
  // Extras (ex.: Sequência) — preserva o que vier com texto.
  const extras = Array.isArray(L.extras) ? L.extras : L.extras ? [L.extras] : [];
  for (const ex of extras) {
    if (ex?.texto) leituras.push({ tipo: ex.titulo || 'Sequência', texto: ex.texto });
  }

  return {
    data: isoData,
    titulo: raw?.liturgia ?? '',
    cor: raw?.cor ?? '',
    leituras,
    fonte: FONTE,
  };
}

@Injectable()
export class LiturgiaRailwayProvider implements ProvedorLiturgia {
  async buscar(dia: number, mes: number, ano: number): Promise<LiturgiaNormalizada> {
    const url = `${BASE}/?dia=${dia}&mes=${mes}&ano=${ano}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Liturgia HTTP ${res.status}`);
    const raw = await res.json();
    return normalizar(raw, `${ano}-${pad(mes)}-${pad(dia)}`);
  }
}
