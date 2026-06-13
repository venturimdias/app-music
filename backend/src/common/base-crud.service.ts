import { NotFoundException } from '@nestjs/common';
import { DeepPartial, ObjectLiteral, Repository } from 'typeorm';

// CRUD genérico reutilizado pelos recursos simples (tempo, momento, artista...).
export class BaseCrudService<T extends ObjectLiteral> {
  constructor(protected readonly repo: Repository<T>) {}

  findAll(): Promise<T[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<T> {
    const item = await this.repo.findOne({ where: { id } as any });
    if (!item) throw new NotFoundException('Registro não encontrado');
    return item;
  }

  create(dto: DeepPartial<T>): Promise<T> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: DeepPartial<T>): Promise<T> {
    await this.findOne(id);
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
