import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Liturgia } from './liturgia.entity';
import { LiturgiaService } from './liturgia.service';
import { LiturgiaRailwayProvider } from './liturgia.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Liturgia])],
  providers: [LiturgiaService, LiturgiaRailwayProvider],
  exports: [LiturgiaService],
})
export class LiturgiaModule {}
