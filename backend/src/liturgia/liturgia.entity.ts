import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LiturgiaNormalizada } from './liturgia.provider';

// Cache da liturgia por data. A liturgia de uma data é imutável, então o cache
// vale "para sempre" e ainda serve de fallback se a API externa cair.
@Entity('liturgia')
export class Liturgia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  data: string; // YYYY-MM-DD

  @Column('simple-json')
  payload: LiturgiaNormalizada;

  @Column()
  fonte: string;

  @CreateDateColumn()
  fetched_at: Date;
}
