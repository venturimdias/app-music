import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './song.entity';
import { Tempo } from '../tempo/tempo.entity';
import { Momento } from '../momento/momento.entity';
import { Artista } from '../artista/artista.entity';
import { SongService } from './song.service';
import { SongController } from './song.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Song, Tempo, Momento, Artista]),
    AuthModule,
  ],
  controllers: [SongController],
  providers: [SongService],
})
export class SongModule {}
