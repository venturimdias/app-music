import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Perfil } from '../perfil/perfil.entity';
import { Plan } from '../plan/plan.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  perfilId: number;

  @ManyToOne(() => Perfil, { eager: true })
  @JoinColumn({ name: 'perfilId' })
  perfil: Perfil;

  @Column({ nullable: true })
  planId: number;

  @ManyToOne(() => Plan, { eager: true, nullable: true })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ nullable: true })
  pagarme_customer_id: string;

  @Column({ nullable: true })
  asaas_customer_id: string;
}
