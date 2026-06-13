import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plan.entity';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';
import { WebhookLog } from './webhook-log.entity';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { User } from '../user/user.entity';
import { Playlist } from '../playlist/playlist.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Subscription, Payment, WebhookLog, User, Playlist]),
    AuthModule,
  ],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService, TypeOrmModule],
})
export class PlanModule {}
