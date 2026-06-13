import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { PlaylistSong } from './playlist-song.entity';

@Entity('playlist')
export class Playlist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column()
  data: Date;

  @Column({ nullable: true })
  descricao: string;

  @Column()
  senha: string; // 5 caracteres alfanuméricos, texto puro, gerada pelo sistema

  @Column({ unique: true })
  slug: string; // [usuarioId]-[guid]

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  bloqueada: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PlaylistSong, (ps) => ps.playlist, { cascade: true })
  musicas: PlaylistSong[];
}
