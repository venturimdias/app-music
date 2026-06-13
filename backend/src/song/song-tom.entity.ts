import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Song } from './song.entity';

// Tom escolhido por usuário, por música — único por par (userId, songId).
@Entity('song_tom')
@Unique(['userId', 'songId'])
export class SongTom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  songId: number;

  @Column()
  tom: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Song)
  @JoinColumn({ name: 'songId' })
  song: Song;
}
