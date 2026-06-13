import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './perfil.entity';
import { BaseCrudService } from '../common/base-crud.service';

@Injectable()
export class PerfilService extends BaseCrudService<Perfil> {
  constructor(@InjectRepository(Perfil) repo: Repository<Perfil>) {
    super(repo);
  }
}
