import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Playlist } from './playlist.entity';
import { Song } from '../song/song.entity';

// Relação N:N com ordem — único por par (playlistId, songId), sem repetição.
@Entity('playlist_song')
@Unique(['playlistId', 'songId'])
export class PlaylistSong {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  playlistId: number;

  @Column()
  songId: number;

  @Column()
  ordem: number;

  @ManyToOne(() => Playlist, (p) => p.musicas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playlistId' })
  playlist: Playlist;

  @ManyToOne(() => Song, { eager: true })
  @JoinColumn({ name: 'songId' })
  song: Song;
}
