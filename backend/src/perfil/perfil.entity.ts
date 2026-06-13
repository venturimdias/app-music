import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('perfil')
export class Perfil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string; // 'ADM' | 'PARTICIPANTE'
}
