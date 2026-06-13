import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price_monthly: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price_yearly: number;

  @Column()
  max_playlists: number;

  @Column('simple-json')
  features: string[];

  @Column({ default: false })
  is_free: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  pagarme_plan_id_monthly: string;

  @Column({ nullable: true })
  pagarme_plan_id_yearly: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
