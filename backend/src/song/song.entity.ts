import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tempo } from '../tempo/tempo.entity';
import { Momento } from '../momento/momento.entity';
import { Artista } from '../artista/artista.entity';

@Entity('song')
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column()
  tom: string; // tom original: C, C#, D, ... A, Bb, B

  @Column({ nullable: true })
  cifra: string; // URL da cifra original

  @Column({ nullable: true })
  video: string;

  @Column({ nullable: true })
  slide: string;

  @Column('text')
  descricao: string; // texto puro com acordes em [..]/{{..}}

  // Colunas desnormalizadas para busca: título e letra já normalizados
  // (sem acento, minúsculas; a letra também sem acordes). Mantidas em sincronia
  // pelo service no create/update. Permitem LIKE simples e idêntico em
  // SQLite (dev) e Postgres (prod). Default '' para a coluna nascer preenchível
  // ao sincronizar o schema em bases já existentes.
  // select:false — usadas só no WHERE da busca, nunca retornadas ao cliente
  // (evita devolver a letra duplicada no payload).
  @Column({ default: '', select: false })
  tituloBusca: string;

  @Column('text', { default: '', select: false })
  letraBusca: string;

  @CreateDateColumn()
  createdAt: Date;

  // N:N — geram as tabelas song_tempo, song_momento, song_artista
  @ManyToMany(() => Tempo, { eager: true })
  @JoinTable({ name: 'song_tempo' })
  tempos: Tempo[];

  @ManyToMany(() => Momento, { eager: true })
  @JoinTable({ name: 'song_momento' })
  momentos: Momento[];

  @ManyToMany(() => Artista, { eager: true })
  @JoinTable({ name: 'song_artista' })
  artistas: Artista[]; // máx. 3 (validado no service)
}
