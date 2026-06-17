// Tipos espelhando as entidades do backend (ver especificacao_app.md, seção 4)

export interface Plan {
  id: number;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_playlists: number;
  features: string[];
  is_free: boolean;
  is_active: boolean;
}

export interface Perfil {
  id: number;
  titulo: string;
  max_songs_per_playlist: number | null; // limite de músicas por playlist; null = sem limite
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfilId: number;
  createdAt?: string;
}

export interface Tempo {
  id: number;
  titulo: string;
  descricao: string | null;
}

export interface Momento {
  id: number;
  titulo: string;
  descricao: string | null;
}

export interface Artista {
  id: number;
  titulo: string;
  descricao: string | null;
}

export interface Song {
  id: number;
  titulo: string;
  tom: string;
  cifra: string | null;
  video: string | null;
  slide: string | null;
  descricao: string;
  createdAt: string;
  tempos: Tempo[];
  momentos: Momento[];
  artistas: Artista[];
}

export interface SongTom {
  id: number;
  userId: number;
  songId: number;
  tom: string;
}

export interface PlaylistMusica {
  id: number;
  ordem: number;
  song: Song;
  tom: string; // tom do dono (SongTom) ou o original da música
}

export interface Playlist {
  id: number;
  nome: string;
  data: string;
  descricao: string | null;
  senha: string;
  slug: string;
  userId: number;
  createdAt: string;
  bloqueada: boolean;
  musicas?: PlaylistMusica[];
}

// Payload público de /lista-repertorio/:slug (sem senha e sem userId)
export type PlaylistPublica = Omit<Playlist, 'senha' | 'userId'>;

// Liturgia do dia (normalizada pelo backend — POST /lista-repertorio/:slug/liturgia)
export interface LeituraLiturgia {
  tipo: string;
  referencia?: string;
  titulo?: string;
  refrao?: string; // só no salmo
  texto: string;
}
export interface LiturgiaDia {
  data: string;
  titulo: string;
  cor: string;
  leituras: LeituraLiturgia[];
  fonte: string;
}

export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled';
export type BillingCycle = 'monthly' | 'yearly';

export type PaymentProvider = 'pagarme' | 'asaas';

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  plan: Plan;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  provider: PaymentProvider;
  pagarme_subscription_id: string | null;
  asaas_subscription_id: string | null;
  started_at: string | null;
  current_period_end: string | null;
  past_due_since: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  subscriptionId: number;
  userId: number;
  amount: number;
  status: 'paid' | 'failed' | 'refunded';
  provider: PaymentProvider;
  pagarme_charge_id: string | null;
  asaas_payment_id: string | null;
  payment_method: string | null;
  card_last_digits: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PixPendente {
  pixQrCode: string;
  pixCopiaECola: string;
  expiresAt: string | null;
  value: number;
  asaasPaymentId: string;
}

export const TONS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B',
] as const;
