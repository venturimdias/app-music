import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tempo } from './tempo.entity';
import { BaseCrudService } from '../common/base-crud.service';

@Injectable()
export class TempoService extends BaseCrudService<Tempo> {
  constructor(@InjectRepository(Tempo) repo: Repository<Tempo>) {
    super(repo);
  }
}
