import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Momento } from './momento.entity';
import { MomentoService } from './momento.service';
import { MomentoController } from './momento.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Momento]), AuthModule],
  controllers: [MomentoController],
  providers: [MomentoService],
})
export class MomentoModule {}
