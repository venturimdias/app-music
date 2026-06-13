import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SongTom } from '../song/song-tom.entity';
import { SongTomService } from './song-tom.service';
import { SongTomController } from './song-tom.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SongTom]), AuthModule],
  controllers: [SongTomController],
  providers: [SongTomService],
})
export class SongTomModule {}
