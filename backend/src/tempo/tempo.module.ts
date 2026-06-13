import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tempo } from './tempo.entity';
import { TempoService } from './tempo.service';
import { TempoController } from './tempo.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tempo]), AuthModule],
  controllers: [TempoController],
  providers: [TempoService],
})
export class TempoModule {}
