import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../plan/subscription.entity';
import { Payment } from '../plan/payment.entity';
import { WebhookLog } from '../plan/webhook-log.entity';
import { Plan } from '../plan/plan.entity';
import { User } from '../user/user.entity';
import { Playlist } from '../playlist/playlist.entity';
import { PagarmeService } from './pagarme.service';
import { AsaasService } from './asaas.service';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, WebhookLog, Plan, User, Playlist]),
    AuthModule,
  ],
  controllers: [BillingController],
  providers: [PagarmeService, AsaasService, BillingService],
  exports: [BillingService],
})
export class BillingModule {}
