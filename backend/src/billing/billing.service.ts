import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Subscription } from '../plan/subscription.entity';
import { Payment } from '../plan/payment.entity';
import { WebhookLog } from '../plan/webhook-log.entity';
import { Plan } from '../plan/plan.entity';
import { User } from '../user/user.entity';
import { Playlist } from '../playlist/playlist.entity';
import { PagarmeService } from './pagarme.service';
import { AsaasService } from './asaas.service';
import { AssinarDto, ConcederAcessoDto } from './billing.dto';

export type AssinarResult =
  | { provider: 'pagarme'; checkoutUrl: string }
  | { provider: 'asaas'; pixQrCode: string; pixCopiaECola: string; expiresAt: string | null };

export interface PixPendenteResult {
  pixQrCode: string;
  pixCopiaECola: string;
  expiresAt: string | null;
  value: number;
  asaasPaymentId: string;
}

@Injectable()
export class BillingService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Subscription) private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(WebhookLog) private readonly webhookLogs: Repository<WebhookLog>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Playlist) private readonly playlists: Repository<Playlist>,
    private readonly pagarme: PagarmeService,
    private readonly asaas: AsaasService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    const msPerDay = 24 * 60 * 60 * 1000;
    setInterval(() => this.verificarPastDue().catch(console.error), msPerDay);
  }

  // ── Usuário ──────────────────────────────────────────────────────────────

  async assinar(userId: number, dto: AssinarDto): Promise<AssinarResult> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const existing = await this.subscriptions.findOne({
      where: [
        { userId, status: 'active' },
        { userId, status: 'pending' },
      ],
    });
    // Assinatura Asaas pendente + novo PIX: retorna QR existente em vez de conflito
    if (existing && existing.status === 'pending' && existing.provider === 'asaas' && dto.payment_method === 'pix') {
      const pixData = await this.pixPendente(userId);
      if (pixData) {
        return { provider: 'asaas', pixQrCode: pixData.pixQrCode, pixCopiaECola: pixData.pixCopiaECola, expiresAt: pixData.expiresAt };
      }
    }
    if (existing) {
      throw new ConflictException('Você já tem uma assinatura ativa ou pendente.');
    }

    const plan = await this.plans.findOne({ where: { id: dto.planId } });
    if (!plan || plan.is_free) throw new BadRequestException('Plano inválido para assinatura.');

    if (dto.payment_method === 'pix') {
      return this.assinarComAsaas(user, plan, dto);
    }
    return this.assinarComPagarme(user, plan, dto);
  }

  private async assinarComPagarme(
    user: User,
    plan: Plan,
    dto: AssinarDto,
  ): Promise<{ provider: 'pagarme'; checkoutUrl: string }> {
    const pagarmePlanId =
      dto.billing_cycle === 'monthly'
        ? plan.pagarme_plan_id_monthly
        : plan.pagarme_plan_id_yearly;
    if (!pagarmePlanId) {
      throw new BadRequestException(
        `ID pagar.me não configurado para ciclo ${dto.billing_cycle}. Acesse Gerenciar Planos e preencha o campo.`,
      );
    }

    let pagarmeCustomerId = user.pagarme_customer_id;
    if (!pagarmeCustomerId) {
      const customer = await this.pagarme.upsertCustomer({
        id: user.id,
        email: user.email,
        nome: user.nome,
      });
      pagarmeCustomerId = customer.id;
      await this.users.update(user.id, { pagarme_customer_id: pagarmeCustomerId });
    }

    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:5173');
    const pagarmeSub = await this.pagarme.criarAssinatura({
      customerId: pagarmeCustomerId,
      pagarmePlanId,
      billingCycle: dto.billing_cycle,
      successUrl: `${frontendUrl}/billing/sucesso`,
      metadata: { user_id: String(user.id), plan_id: String(plan.id) },
    });

    await this.subscriptions.save(
      this.subscriptions.create({
        userId: user.id,
        planId: plan.id,
        billing_cycle: dto.billing_cycle,
        status: 'pending',
        provider: 'pagarme',
        pagarme_subscription_id: pagarmeSub.id,
        started_at: new Date(),
      }),
    );

    const checkoutUrl =
      pagarmeSub.checkout_url ?? `${frontendUrl}/billing/cancelado?reason=no_checkout`;
    return { provider: 'pagarme', checkoutUrl };
  }

  private async assinarComAsaas(
    user: User,
    plan: Plan,
    dto: AssinarDto,
  ): Promise<{ provider: 'asaas'; pixQrCode: string; pixCopiaECola: string; expiresAt: string | null }> {
    if (!dto.cpfCnpj) {
      throw new BadRequestException('CPF ou CNPJ é obrigatório para pagamento via PIX.');
    }

    // Sempre passa pelo criarOuBuscarCliente para garantir que o CPF esteja atualizado
    const customer = await this.asaas.criarOuBuscarCliente({
      id: user.id,
      email: user.email,
      nome: user.nome,
      cpfCnpj: dto.cpfCnpj,
    });
    const asaasCustomerId = customer.id;
    if (!user.asaas_customer_id) {
      await this.users.update(user.id, { asaas_customer_id: asaasCustomerId });
    }

    const value =
      dto.billing_cycle === 'monthly'
        ? Number(plan.price_monthly)
        : Number(plan.price_yearly);
    const cycle = dto.billing_cycle === 'monthly' ? 'MONTHLY' : 'YEARLY';

    const asaasSub = await this.asaas.criarAssinatura({
      asaasCustomerId,
      value,
      cycle,
      description: `${plan.name} — ${cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}`,
    });

    const sub = await this.subscriptions.save(
      this.subscriptions.create({
        userId: user.id,
        planId: plan.id,
        billing_cycle: dto.billing_cycle,
        status: 'pending',
        provider: 'asaas',
        asaas_subscription_id: asaasSub.id,
        started_at: new Date(),
      }),
    );

    // A primeira cobrança e o QR PIX podem demorar a ficar disponíveis no Asaas;
    // tenta algumas vezes com pequeno intervalo antes de desistir.
    const resultado = await this.asaas.obterPixComRetry(asaasSub.id);

    if (!resultado) {
      throw new BadRequestException(
        'QR code PIX ainda está sendo gerado. Abra "Minha assinatura" em instantes para ver o código.',
      );
    }

    return {
      provider: 'asaas',
      pixQrCode: `data:image/png;base64,${resultado.pix.qrCode}`,
      pixCopiaECola: resultado.pix.payload,
      expiresAt: resultado.pix.expirationDate,
    };
  }

  async minhaAssinatura(userId: number): Promise<Subscription | null> {
    const sub = await this.subscriptions.findOne({
      where: [
        { userId, status: 'active' },
        { userId, status: 'pending' },
        { userId, status: 'past_due' },
      ],
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    // Reconcilia com o Asaas: se o pagamento já foi confirmado lá mas o webhook
    // não chegou, ativa localmente. Não depende do webhook para refletir o status.
    if (
      sub?.provider === 'asaas' &&
      sub.asaas_subscription_id &&
      (sub.status === 'pending' || sub.status === 'past_due')
    ) {
      const ativou = await this.reconciliarAsaas(sub.asaas_subscription_id);
      if (ativou) {
        return this.subscriptions.findOne({
          where: { id: sub.id },
          relations: ['plan'],
        });
      }
    }

    return sub;
  }

  // Verifica no Asaas se a primeira cobrança da assinatura já foi paga e, em caso
  // afirmativo, ativa a assinatura local. Retorna true se ativou.
  private async reconciliarAsaas(asaasSubId: string): Promise<boolean> {
    try {
      const primeira = await this.asaas.buscarPrimeiraCobranca(asaasSubId);
      if (primeira && (primeira.status === 'RECEIVED' || primeira.status === 'CONFIRMED')) {
        await this.onAsaasPaid({
          subscription: asaasSubId,
          id: primeira.id,
          value: primeira.value,
          paymentDate: primeira.paymentDate,
        });
        return true;
      }
    } catch (err) {
      console.error('Falha ao reconciliar com Asaas:', (err as Error).message);
    }
    return false;
  }

  async meusPagamentos(userId: number): Promise<Payment[]> {
    return this.payments.find({ where: { userId }, order: { created_at: 'DESC' } });
  }

  async pixPendente(userId: number): Promise<PixPendenteResult | null> {
    const sub = await this.subscriptions.findOne({
      where: [
        { userId, provider: 'asaas', status: 'active' },
        { userId, provider: 'asaas', status: 'pending' },
        { userId, provider: 'asaas', status: 'past_due' },
      ],
      order: { created_at: 'DESC' },
    });
    if (!sub?.asaas_subscription_id) return null;

    const cobracasPendentes = await this.asaas.buscarCobrancasPendentes(sub.asaas_subscription_id);
    const cobranca = cobracasPendentes[0];

    if (!cobranca) {
      // Sem cobrança pendente — verifica se a primeira já foi paga e o webhook falhou
      if (sub.status === 'pending' || sub.status === 'past_due') {
        await this.reconciliarAsaas(sub.asaas_subscription_id);
      }
      return null;
    }

    // pixTransaction pode não vir na lista — busca via endpoint dedicado
    const pix = cobranca.pixTransaction ?? await this.asaas.buscarPixQrCode(cobranca.id);
    if (!pix) return null;

    return {
      pixQrCode: `data:image/png;base64,${pix.qrCode}`,
      pixCopiaECola: pix.payload,
      expiresAt: pix.expirationDate,
      value: cobranca.value,
      asaasPaymentId: cobranca.id,
    };
  }

  async cancelar(userId: number, motivo?: string): Promise<void> {
    const sub = await this.minhaAssinatura(userId);
    if (!sub) throw new NotFoundException('Nenhuma assinatura ativa encontrada.');

    if (sub.provider === 'asaas' && sub.asaas_subscription_id) {
      await this.asaas.cancelarAssinatura(sub.asaas_subscription_id).catch(console.error);
    } else if (sub.pagarme_subscription_id) {
      await this.pagarme.cancelarAssinatura(sub.pagarme_subscription_id).catch(console.error);
    }

    await this.downgradeParaFree(userId);
    sub.status = 'canceled';
    sub.canceled_at = new Date();
    sub.cancel_reason = motivo ?? 'Cancelado pelo usuário';
    await this.subscriptions.save(sub);
  }

  // ── Webhook Pagar.me ──────────────────────────────────────────────────────

  async processarWebhook(rawPayload: string, assinatura: string): Promise<void> {
    const webhookSecret = this.config.get<string>('PAGARME_WEBHOOK_SECRET', '');
    if (webhookSecret) {
      if (!this.verificarAssinatura(rawPayload, assinatura, webhookSecret)) {
        throw new UnauthorizedException('Assinatura de webhook inválida');
      }
    }

    const evento = JSON.parse(rawPayload) as Record<string, unknown>;
    const eventId = evento.id as string | undefined;
    const eventType = (evento.type as string) ?? '';
    const data = (evento.data ?? {}) as Record<string, unknown>;

    if (eventId) {
      const existente = await this.webhookLogs.findOne({ where: { pagarme_event_id: eventId } });
      if (existente?.processed) return;
    }

    const log = await this.webhookLogs.save(
      this.webhookLogs.create({
        event_type: eventType,
        pagarme_event_id: eventId,
        payload: evento,
        processed: false,
      }),
    );

    try {
      await this.handleEventPagarme(eventType, data);
      log.processed = true;
    } catch (err) {
      log.error_message = (err as Error).message;
    }
    await this.webhookLogs.save(log);
  }

  private async handleEventPagarme(type: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'charge.paid':
        return this.onPagarmePaid(data);
      case 'charge.payment_failed':
        return this.onPagarmeFailed(data);
      case 'subscription.canceled':
        return this.onPagarmeSubCanceled(data);
      case 'charge.refunded':
        return this.onPagarmeRefunded(data);
    }
  }

  private async onPagarmePaid(data: Record<string, unknown>): Promise<void> {
    const pagarmeSubId = data.subscription_id as string | undefined;
    if (!pagarmeSubId) return;

    const sub = await this.subscriptions.findOne({
      where: { pagarme_subscription_id: pagarmeSubId },
    });
    if (!sub) return;

    sub.status = 'active';
    sub.past_due_since = null;
    if (data.billing_at) sub.current_period_end = new Date(data.billing_at as string);
    await this.subscriptions.save(sub);
    await this.users.update(sub.userId, { planId: sub.planId });
    await this.desbloquearPlaylists(sub.userId, sub.planId);

    const lastTx = data.last_transaction as Record<string, unknown> | undefined;
    const card = lastTx?.card as Record<string, string> | undefined;
    await this.payments.save(
      this.payments.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        amount: Number(data.amount ?? 0) / 100,
        status: 'paid',
        provider: 'pagarme',
        pagarme_charge_id: data.id as string,
        payment_method: data.payment_method as string | undefined,
        card_last_digits: card?.last_four_digits,
        paid_at: lastTx?.paid_at ? new Date(lastTx.paid_at as string) : new Date(),
      }),
    );
  }

  private async onPagarmeFailed(data: Record<string, unknown>): Promise<void> {
    const pagarmeSubId = data.subscription_id as string | undefined;
    if (!pagarmeSubId) return;

    const sub = await this.subscriptions.findOne({
      where: { pagarme_subscription_id: pagarmeSubId },
    });
    if (!sub) return;

    if (sub.status !== 'past_due') sub.past_due_since = new Date();
    sub.status = 'past_due';
    await this.subscriptions.save(sub);

    await this.payments.save(
      this.payments.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        amount: Number(data.amount ?? 0) / 100,
        status: 'failed',
        provider: 'pagarme',
        pagarme_charge_id: data.id as string,
        payment_method: data.payment_method as string | undefined,
      }),
    );
  }

  private async onPagarmeSubCanceled(data: Record<string, unknown>): Promise<void> {
    const sub = await this.subscriptions.findOne({
      where: { pagarme_subscription_id: data.id as string },
    });
    if (!sub) return;
    await this.downgradeParaFree(sub.userId);
    sub.status = 'canceled';
    sub.canceled_at = new Date();
    await this.subscriptions.save(sub);
  }

  private async onPagarmeRefunded(data: Record<string, unknown>): Promise<void> {
    const payment = await this.payments.findOne({
      where: { pagarme_charge_id: data.id as string },
    });
    if (payment) {
      payment.status = 'refunded';
      await this.payments.save(payment);
    }
  }

  // ── Webhook Asaas ─────────────────────────────────────────────────────────

  async processarWebhookAsaas(rawPayload: string, token: string): Promise<void> {
    const webhookToken = this.config.get<string>('ASAAS_WEBHOOK_TOKEN', '');
    if (webhookToken && token !== webhookToken) {
      throw new UnauthorizedException('Token de webhook Asaas inválido');
    }

    const evento = JSON.parse(rawPayload) as Record<string, unknown>;
    const eventType = (evento.event as string) ?? '';
    const payment = (evento.payment ?? {}) as Record<string, unknown>;

    const log = await this.webhookLogs.save(
      this.webhookLogs.create({
        event_type: `asaas.${eventType}`,
        pagarme_event_id: undefined,
        payload: evento,
        processed: false,
      }),
    );

    try {
      await this.handleEventAsaas(eventType, payment);
      log.processed = true;
    } catch (err) {
      log.error_message = (err as Error).message;
    }
    await this.webhookLogs.save(log);
  }

  private async handleEventAsaas(type: string, payment: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        return this.onAsaasPaid(payment);
      case 'PAYMENT_OVERDUE':
        return this.onAsaasOverdue(payment);
      case 'SUBSCRIPTION_DELETED':
        return this.onAsaasSubDeleted(payment);
      case 'PAYMENT_REFUNDED':
        return this.onAsaasRefunded(payment);
    }
  }

  private async onAsaasPaid(payment: Record<string, unknown>): Promise<void> {
    const asaasSubId = payment.subscription as string | undefined;
    if (!asaasSubId) return;

    const sub = await this.subscriptions.findOne({
      where: { asaas_subscription_id: asaasSubId },
    });
    if (!sub) return;

    if (sub.status !== 'active') {
      sub.status = 'active';
      sub.past_due_since = null;
      await this.subscriptions.save(sub);
      await this.users.update(sub.userId, { planId: sub.planId });
      await this.desbloquearPlaylists(sub.userId, sub.planId);
    }

    // Idempotência: não duplica o registro de pagamento se já existe
    const paymentId = payment.id as string;
    if (paymentId) {
      const existente = await this.payments.findOne({
        where: { asaas_payment_id: paymentId },
      });
      if (existente) return;
    }

    await this.payments.save(
      this.payments.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        amount: Number(payment.value ?? 0),
        status: 'paid',
        provider: 'asaas',
        asaas_payment_id: paymentId,
        payment_method: 'pix',
        paid_at: payment.paymentDate ? new Date(payment.paymentDate as string) : new Date(),
      }),
    );
  }

  private async onAsaasOverdue(payment: Record<string, unknown>): Promise<void> {
    const asaasSubId = payment.subscription as string | undefined;
    if (!asaasSubId) return;

    const sub = await this.subscriptions.findOne({
      where: { asaas_subscription_id: asaasSubId },
    });
    if (!sub) return;

    if (sub.status !== 'past_due') sub.past_due_since = new Date();
    sub.status = 'past_due';
    await this.subscriptions.save(sub);

    await this.payments.save(
      this.payments.create({
        subscriptionId: sub.id,
        userId: sub.userId,
        amount: Number(payment.value ?? 0),
        status: 'failed',
        provider: 'asaas',
        asaas_payment_id: payment.id as string,
        payment_method: 'pix',
      }),
    );
  }

  private async onAsaasSubDeleted(payment: Record<string, unknown>): Promise<void> {
    const asaasSubId = payment.subscription as string | undefined;
    if (!asaasSubId) return;

    const sub = await this.subscriptions.findOne({
      where: { asaas_subscription_id: asaasSubId },
    });
    if (!sub) return;

    await this.downgradeParaFree(sub.userId);
    sub.status = 'canceled';
    sub.canceled_at = new Date();
    await this.subscriptions.save(sub);
  }

  private async onAsaasRefunded(payment: Record<string, unknown>): Promise<void> {
    const p = await this.payments.findOne({
      where: { asaas_payment_id: payment.id as string },
    });
    if (p) {
      p.status = 'refunded';
      await this.payments.save(p);
    }
  }

  // ── Cron (carência) ────────────────────────────────────────────────────────

  async verificarPastDue(): Promise<void> {
    const limite = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const expiradas = await this.subscriptions.find({ where: { status: 'past_due' } });

    for (const sub of expiradas) {
      if (sub.past_due_since && sub.past_due_since <= limite) {
        await this.downgradeParaFree(sub.userId);
        sub.status = 'canceled';
        sub.canceled_at = new Date();
        sub.cancel_reason = 'Carência de 5 dias esgotada';
        await this.subscriptions.save(sub);
      }
    }
  }

  // ── ADM ────────────────────────────────────────────────────────────────────

  async listarTodas(page: number, limit: number) {
    const [data, total] = await this.subscriptions.findAndCount({
      relations: ['user', 'plan'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async listarPagamentos(page: number, limit: number) {
    const [data, total] = await this.payments.findAndCount({
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async concederAcesso(subscriptionId: number, dto: ConcederAcessoDto): Promise<void> {
    const sub = await this.subscriptions.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Assinatura não encontrada');

    sub.status = 'active';
    sub.planId = dto.planId;
    sub.past_due_since = null;
    await this.subscriptions.save(sub);
    await this.users.update(sub.userId, { planId: dto.planId });
    await this.desbloquearPlaylists(sub.userId, dto.planId);
  }

  async reembolsar(paymentId: number): Promise<void> {
    const payment = await this.payments.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');

    if (payment.provider === 'asaas') {
      if (!payment.asaas_payment_id)
        throw new BadRequestException('Cobrança sem ID Asaas para reembolso.');
      await this.asaas.reembolsar(payment.asaas_payment_id);
    } else {
      if (!payment.pagarme_charge_id)
        throw new BadRequestException('Cobrança sem ID pagar.me para reembolso.');
      await this.pagarme.reembolsarCobrança(payment.pagarme_charge_id);
    }

    payment.status = 'refunded';
    await this.payments.save(payment);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async downgradeParaFree(userId: number): Promise<void> {
    const freePlan = await this.plans.findOne({ where: { is_free: true } });
    if (!freePlan) return;

    await this.users.update(userId, { planId: freePlan.id });

    const playlists = await this.playlists.find({
      where: { userId, bloqueada: false },
      order: { createdAt: 'DESC' },
    });
    for (let i = freePlan.max_playlists; i < playlists.length; i++) {
      playlists[i].bloqueada = true;
      await this.playlists.save(playlists[i]);
    }
  }

  private async desbloquearPlaylists(userId: number, planId: number): Promise<void> {
    const plan = await this.plans.findOne({ where: { id: planId } });
    if (!plan) return;

    const ativas = await this.playlists.count({ where: { userId, bloqueada: false } });
    const slots = plan.max_playlists - ativas;
    if (slots <= 0) return;

    const bloqueadas = await this.playlists.find({
      where: { userId, bloqueada: true },
      order: { createdAt: 'DESC' },
      take: slots,
    });
    for (const p of bloqueadas) {
      p.bloqueada = false;
      await this.playlists.save(p);
    }
  }

  private verificarAssinatura(payload: string, assinatura: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const received = assinatura.replace('sha256=', '');
    if (expected.length !== received.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
    } catch {
      return false;
    }
  }
}
