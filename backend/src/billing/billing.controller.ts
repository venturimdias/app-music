import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { AssinarDto, CancelarDto, ConcederAcessoDto } from './billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  // ── Usuário autenticado ──────────────────────────────────────────────────

  @Post('billing/assinar')
  @UseGuards(JwtAuthGuard)
  assinar(@CurrentUser() user: AuthUser, @Body() dto: AssinarDto) {
    return this.billing.assinar(user.sub, dto);
  }

  @Get('billing/minha-assinatura')
  @UseGuards(JwtAuthGuard)
  minhaAssinatura(@CurrentUser() user: AuthUser) {
    return this.billing.minhaAssinatura(user.sub);
  }

  @Get('billing/minha-assinatura/pagamentos')
  @UseGuards(JwtAuthGuard)
  meusPagamentos(@CurrentUser() user: AuthUser) {
    return this.billing.meusPagamentos(user.sub);
  }

  @Get('billing/minha-assinatura/pix-pendente')
  @UseGuards(JwtAuthGuard)
  pixPendente(@CurrentUser() user: AuthUser) {
    return this.billing.pixPendente(user.sub);
  }

  @Delete('billing/minha-assinatura')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  cancelar(@CurrentUser() user: AuthUser, @Body() dto: CancelarDto) {
    return this.billing.cancelar(user.sub, dto.motivo);
  }

  // ── Webhooks (públicos, verificados por token/HMAC) ─────────────────────

  @Post('billing/webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RequestWithRawBody,
    @Headers('x-hub-signature') assinatura = '',
  ) {
    const rawBody = (req.rawBody ?? Buffer.alloc(0)).toString('utf-8');
    return this.billing.processarWebhook(rawBody, assinatura);
  }

  @Post('billing/webhook/asaas')
  @HttpCode(200)
  webhookAsaas(
    @Req() req: RequestWithRawBody,
    @Query('token') token = '',
  ) {
    const rawBody = (req.rawBody ?? Buffer.alloc(0)).toString('utf-8');
    return this.billing.processarWebhookAsaas(rawBody, token);
  }

  // ── ADM ─────────────────────────────────────────────────────────────────

  @Get('admin/subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  listarAssinaturas(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.billing.listarTodas(+page, +limit);
  }

  @Get('admin/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  listarPagamentos(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.billing.listarPagamentos(+page, +limit);
  }

  @Post('admin/subscriptions/:id/grant-access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  concederAcesso(@Param('id') id: string, @Body() dto: ConcederAcessoDto) {
    return this.billing.concederAcesso(+id, dto);
  }

  @Post('admin/payments/:id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  reembolsar(@Param('id') id: string) {
    return this.billing.reembolsar(+id);
  }
}
