import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('webhook_log')
export class WebhookLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  event_type: string;

  @Column({ nullable: true, unique: true })
  pagarme_event_id: string;

  @Column('simple-json')
  payload: object;

  @Column({ default: false })
  processed: boolean;

  @Column({ nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;
}
