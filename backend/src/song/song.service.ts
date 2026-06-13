import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Song } from './song.entity';
import { Tempo } from '../tempo/tempo.entity';
import { Momento } from '../momento/momento.entity';
import { Artista } from '../artista/artista.entity';
import { CreateSongDto, UpdateSongDto } from './song.dto';

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song) private readonly songs: Repository<Song>,
    @InjectRepository(Tempo) private readonly tempos: Repository<Tempo>,
    @InjectRepository(Momento) private readonly momentos: Repository<Momento>,
    @InjectRepository(Artista) private readonly artistas: Repository<Artista>,
  ) {}

  findAll() {
    return this.songs.find({ order: { titulo: 'ASC' } });
  }

  async findOne(id: number) {
    const song = await this.songs.findOne({ where: { id } });
    if (!song) throw new NotFoundException('Música não encontrada');
    return song;
  }

  private resolve<E>(repo: Repository<E>, ids?: number[]) {
    if (!ids || ids.length === 0) return Promise.resolve([] as E[]);
    return repo.findBy({ id: In(ids) } as any);
  }

  async create(dto: CreateSongDto) {
    const song = this.songs.create({
      titulo: dto.titulo,
      tom: dto.tom,
      cifra: dto.cifra,
      video: dto.video,
      slide: dto.slide,
      descricao: dto.descricao,
      tempos: await this.resolve(this.tempos, dto.tempoIds),
      momentos: await this.resolve(this.momentos, dto.momentoIds),
      artistas: await this.resolve(this.artistas, dto.artistaIds),
    });
    return this.songs.save(song);
  }

  async update(id: number, dto: UpdateSongDto) {
    const song = await this.findOne(id);
    song.titulo = dto.titulo;
    song.tom = dto.tom;
    song.cifra = dto.cifra;
    song.video = dto.video;
    song.slide = dto.slide;
    song.descricao = dto.descricao;
    song.tempos = await this.resolve(this.tempos, dto.tempoIds);
    song.momentos = await this.resolve(this.momentos, dto.momentoIds);
    song.artistas = await this.resolve(this.artistas, dto.artistaIds);
    return this.songs.save(song);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.songs.delete(id);
    return { deleted: true };
  }
}
