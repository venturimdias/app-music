import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artista } from './artista.entity';
import { ArtistaService } from './artista.service';
import { ArtistaController } from './artista.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Artista]), AuthModule],
  controllers: [ArtistaController],
  providers: [ArtistaService],
})
export class ArtistaModule {}
