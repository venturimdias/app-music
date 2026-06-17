import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('perfil')
export class Perfil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string; // 'ADM' | 'PARTICIPANTE' | 'DEMO'

  // Limite de músicas por playlist para este perfil. null = sem limite.
  @Column({ type: 'int', nullable: true })
  max_songs_per_playlist: number | null;
}
