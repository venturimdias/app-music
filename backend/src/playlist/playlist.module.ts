import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './playlist.entity';
import { PlaylistSong } from './playlist-song.entity';
import { SongTom } from '../song/song-tom.entity';
import { User } from '../user/user.entity';
import { Perfil } from '../perfil/perfil.entity';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { ListaRepertorioController } from './lista-repertorio.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistSong, SongTom, User, Perfil]),
    AuthModule,
  ],
  controllers: [PlaylistController, ListaRepertorioController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
