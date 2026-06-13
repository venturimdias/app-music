import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Subscription } from './subscription.entity';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subscriptionId: number;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  status: 'paid' | 'failed' | 'refunded';

  @Column({ nullable: true })
  pagarme_charge_id: string;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  card_last_digits: string;

  @Column({ nullable: true })
  paid_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
