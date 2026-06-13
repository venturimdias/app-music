import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Plan } from './plan.entity';

export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled';
export type BillingCycle = 'monthly' | 'yearly';

@Entity('subscription')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  planId: number;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column()
  billing_cycle: BillingCycle;

  @Column()
  status: SubscriptionStatus;

  @Column({ nullable: true })
  pagarme_subscription_id: string;

  @Column({ nullable: true })
  started_at: Date;

  @Column({ nullable: true })
  current_period_end: Date;

  @Column({ nullable: true })
  past_due_since: Date;

  @Column({ nullable: true })
  canceled_at: Date;

  @Column({ nullable: true })
  cancel_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
