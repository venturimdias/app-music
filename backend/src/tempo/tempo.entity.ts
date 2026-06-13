import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tempo')
export class Tempo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ nullable: true })
  descricao: string;
}
