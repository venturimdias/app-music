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

  // Salmo responsorial e antífona do Evangelho (texto livre, opcionais).
  // Cada um é exibido como um item ordenável na lista do repertório, então
  // guarda também sua posição (ordem) junto às músicas. null = não definido.
  @Column({ type: 'text', nullable: true })
  salmo: string | null;

  @Column({ type: 'int', nullable: true })
  salmoOrdem: number | null;

  @Column({ type: 'text', nullable: true })
  antifonaEvangelho: string | null;

  @Column({ type: 'int', nullable: true })
  antifonaEvangelhoOrdem: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PlaylistSong, (ps) => ps.playlist, { cascade: true })
  musicas: PlaylistSong[];
}
