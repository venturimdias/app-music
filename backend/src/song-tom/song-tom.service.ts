import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SongTom } from '../song/song-tom.entity';
import { SongTomDto } from './song-tom.dto';

@Injectable()
export class SongTomService {
  constructor(
    @InjectRepository(SongTom) private readonly repo: Repository<SongTom>,
  ) {}

  // Retorna o(s) tom(ns) salvos do usuário logado; se songId vier, filtra por música.
  findForUser(userId: number, songId?: number) {
    if (songId) {
      return this.repo.findOne({ where: { userId, songId } });
    }
    return this.repo.find({ where: { userId } });
  }

  // Upsert por (userId, songId): cria se não existe, atualiza o tom se já existe.
  async save(userId: number, dto: SongTomDto) {
    let registro = await this.repo.findOne({
      where: { userId, songId: dto.songId },
    });
    if (registro) {
      registro.tom = dto.tom;
    } else {
      registro = this.repo.create({
        userId,
        songId: dto.songId,
        tom: dto.tom,
      });
    }
    return this.repo.save(registro);
  }

  async remove(userId: number, id: number) {
    const registro = await this.repo.findOne({ where: { id } });
    if (!registro) throw new NotFoundException('Registro não encontrado');
    if (registro.userId !== userId) {
      throw new ForbiddenException('Você só pode remover o seu próprio tom');
    }
    await this.repo.delete(id);
    return { deleted: true };
  }
}
