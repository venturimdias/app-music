import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  externalReference: string;
}

export interface AsaasSubscription {
  id: string;
  status: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  billingType: string;
}

export interface AsaasPixTransaction {
  qrCode: string;         // base64 da imagem PNG
  payload: string;        // copia e cola
  expirationDate: string | null;
}

export interface AsaasPayment {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  paymentDate: string | null;
  billingType: string;
  subscription: string | null;
  pixTransaction: AsaasPixTransaction | null;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get('ASAAS_API_URL', 'https://sandbox.asaas.com/api/v3');
    this.apiKey = config.get('ASAAS_API_KEY', '');
  }

  private get authHeader(): Record<string, string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Asaas não configurado. Defina ASAAS_API_KEY no .env do backend.',
      );
    }
    return { 'access_token': this.apiKey };
  }

  private async req<T>(method: string, path: string, body?: object): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeader,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      this.logger.error(`Asaas ${method} ${path} → ${res.status}: ${JSON.stringify(err)}`);
      throw new Error(`Asaas ${res.status}: ${JSON.stringify((err as any).errors ?? err)}`);
    }
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  }

  async criarOuBuscarCliente(user: {
    id: number;
    email: string;
    nome: string;
    cpfCnpj?: string;
  }): Promise<AsaasCustomer> {
    const existing = await this.req<{ data: AsaasCustomer[] }>(
      'GET',
      `/customers?externalReference=user_${user.id}`,
    );

    if (existing.data.length > 0) {
      const customer = existing.data[0];
      // Atualiza CPF no customer caso não estivesse preenchido antes
      if (user.cpfCnpj) {
        await this.req('PUT', `/customers/${customer.id}`, {
          name: customer.name,
          email: customer.email,
          cpfCnpj: user.cpfCnpj.replace(/\D/g, ''),
        });
      }
      return customer;
    }

    return this.req<AsaasCustomer>('POST', '/customers', {
      name: user.nome,
      email: user.email,
      externalReference: `user_${user.id}`,
      ...(user.cpfCnpj ? { cpfCnpj: user.cpfCnpj.replace(/\D/g, '') } : {}),
    });
  }

  async criarAssinatura(dto: {
    asaasCustomerId: string;
    value: number;
    cycle: 'MONTHLY' | 'YEARLY';
    description: string;
  }): Promise<AsaasSubscription> {
    const nextDueDate = new Date().toISOString().slice(0, 10);
    return this.req<AsaasSubscription>('POST', '/subscriptions', {
      customer: dto.asaasCustomerId,
      billingType: 'PIX',
      value: dto.value,
      nextDueDate,
      cycle: dto.cycle,
      description: dto.description,
    });
  }

  async buscarCobrancasPendentes(asaasSubId: string): Promise<AsaasPayment[]> {
    const res = await this.req<{ data: AsaasPayment[] }>(
      'GET',
      `/subscriptions/${asaasSubId}/payments?status=PENDING`,
    );
    return res.data;
  }

  async buscarPrimeiraCobranca(asaasSubId: string): Promise<AsaasPayment | null> {
    const res = await this.req<{ data: AsaasPayment[] }>(
      'GET',
      `/subscriptions/${asaasSubId}/payments?limit=10`,
    );
    // A mais antiga (primeira gerada) vem no final da lista — ordena por dueDate asc
    const sorted = [...res.data].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    return sorted[0] ?? null;
  }

  // O endpoint de lista não inclui pixTransaction — busca o QR diretamente
  async buscarPixQrCode(paymentId: string): Promise<AsaasPixTransaction | null> {
    try {
      const res = await this.req<{
        encodedImage: string;
        payload: string;
        expirationDate: string | null;
      }>('GET', `/payments/${paymentId}/pixQrCode`);
      if (!res.payload) return null;
      return {
        qrCode: res.encodedImage,
        payload: res.payload,
        expirationDate: res.expirationDate,
      };
    } catch {
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Logo após criar a assinatura, a primeira cobrança e o QR PIX podem demorar
  // alguns instantes para ficar disponíveis no Asaas. Tenta algumas vezes.
  async obterPixComRetry(
    asaasSubId: string,
    tentativas = 6,
  ): Promise<{ pix: AsaasPixTransaction; paymentId: string; value: number } | null> {
    for (let i = 0; i < tentativas; i++) {
      const cobranca = await this.buscarPrimeiraCobranca(asaasSubId);
      if (cobranca) {
        const pix = cobranca.pixTransaction ?? (await this.buscarPixQrCode(cobranca.id));
        if (pix?.payload) {
          return { pix, paymentId: cobranca.id, value: cobranca.value };
        }
      }
      if (i < tentativas - 1) await this.sleep(1500);
    }
    this.logger.error(`Asaas: QR PIX não disponível após ${tentativas} tentativas (sub ${asaasSubId})`);
    return null;
  }

  async cancelarAssinatura(asaasSubId: string): Promise<void> {
    await this.req('DELETE', `/subscriptions/${asaasSubId}`);
  }

  async reembolsar(asaasPaymentId: string): Promise<void> {
    await this.req('POST', `/payments/${asaasPaymentId}/refund`);
  }
}
