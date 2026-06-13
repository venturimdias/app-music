import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('momento')
export class Momento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ nullable: true })
  descricao: string;
}
