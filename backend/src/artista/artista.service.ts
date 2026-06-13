import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artista } from './artista.entity';
import { BaseCrudService } from '../common/base-crud.service';

@Injectable()
export class ArtistaService extends BaseCrudService<Artista> {
  constructor(@InjectRepository(Artista) repo: Repository<Artista>) {
    super(repo);
  }
}
