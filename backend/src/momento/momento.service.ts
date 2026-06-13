import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Momento } from './momento.entity';
import { BaseCrudService } from '../common/base-crud.service';

@Injectable()
export class MomentoService extends BaseCrudService<Momento> {
  constructor(@InjectRepository(Momento) repo: Repository<Momento>) {
    super(repo);
  }
}
