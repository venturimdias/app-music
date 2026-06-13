import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('artista')
export class Artista {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ nullable: true })
  descricao: string;
}
