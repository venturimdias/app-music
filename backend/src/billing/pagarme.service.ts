import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PagarmeCustomer {
  id: string;
  code: string;
  name: string;
  email: string;
}

export interface PagarmeSubscription {
  id: string;
  status: string;
  checkout_url?: string;
  current_cycle?: {
    id?: string;
    billing_at?: string;
    end_at?: string;
  };
}

export interface PagarmeCharge {
  id: string;
  amount: number;
  status: string;
  subscription_id?: string;
  payment_method?: string;
  last_transaction?: {
    card?: { last_four_digits?: string };
    paid_at?: string;
  };
  created_at: string;
}

@Injectable()
export class PagarmeService {
  private readonly logger = new Logger(PagarmeService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get('PAGARME_API_URL', 'https://api.pagar.me/core/v5');
    this.apiKey = config.get('PAGARME_API_KEY', '');
  }

  private get authHeader(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Gateway de pagamento não configurado. Defina PAGARME_API_KEY no .env do backend.',
      );
    }
    return `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`;
  }

  private async req<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      this.logger.error(`pagar.me ${method} ${path} → ${res.status}: ${JSON.stringify(err)}`);
      throw new Error(`pagar.me ${res.status}: ${JSON.stringify(err.errors ?? err)}`);
    }
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  }

  async upsertCustomer(user: {
    id: number;
    email: string;
    nome: string;
  }): Promise<PagarmeCustomer> {
    return this.req<PagarmeCustomer>('POST', '/customers', {
      code: `user_${user.id}`,
      name: user.nome,
      email: user.email,
      type: 'individual',
    });
  }

  async criarAssinatura(dto: {
    customerId: string;
    pagarmePlanId: string;
    billingCycle: 'monthly' | 'yearly';
    successUrl: string;
    metadata?: Record<string, string>;
  }): Promise<PagarmeSubscription> {
    return this.req<PagarmeSubscription>('POST', '/subscriptions', {
      customer_id: dto.customerId,
      plan_id: dto.pagarmePlanId,
      payment_method: 'checkout',
      checkout: {
        accepted_payment_methods: ['credit_card'],
        success_url: dto.successUrl,
        default_payment_method: 'credit_card',
      },
      metadata: dto.metadata,
    });
  }

  async cancelarAssinatura(pagarmeSubscriptionId: string): Promise<void> {
    await this.req('DELETE', `/subscriptions/${pagarmeSubscriptionId}`);
  }

  async listarCobranças(
    pagarmeSubscriptionId: string,
  ): Promise<{ data: PagarmeCharge[] }> {
    return this.req<{ data: PagarmeCharge[] }>(
      'GET',
      `/charges?subscription_id=${pagarmeSubscriptionId}&size=50`,
    );
  }

  async reembolsarCobrança(chargeId: string): Promise<void> {
    await this.req('POST', `/charges/${chargeId}/refund`);
  }
}
