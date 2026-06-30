import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Song } from './song.entity';
import { Tempo } from '../tempo/tempo.entity';
import { Momento } from '../momento/momento.entity';
import { Artista } from '../artista/artista.entity';
import { CreateSongDto, QuerySongsDto, UpdateSongDto } from './song.dto';
import { buscaLetra, buscaTitulo, normalizar } from './song-busca.util';

const LIMITES_VALIDOS = [10, 20, 40, 80];
const LIMITE_PADRAO = 10;

export interface SongsPaginadas {
  items: Song[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SongService implements OnModuleInit {
  constructor(
    @InjectRepository(Song) private readonly songs: Repository<Song>,
    @InjectRepository(Tempo) private readonly tempos: Repository<Tempo>,
    @InjectRepository(Momento) private readonly momentos: Repository<Momento>,
    @InjectRepository(Artista) private readonly artistas: Repository<Artista>,
  ) {}

  // Preenche tituloBusca/letraBusca em registros antigos (criados antes das
  // colunas existirem). Roda uma vez na subida; é barato quando já está em dia.
  async onModuleInit() {
    const pendentes = await this.songs.find({ where: { tituloBusca: '' } });
    if (pendentes.length === 0) return;
    for (const s of pendentes) {
      s.tituloBusca = buscaTitulo(s.titulo);
      s.letraBusca = buscaLetra(s.descricao);
    }
    await this.songs.save(pendentes);
  }

  async findAll(query: QuerySongsDto = {}): Promise<SongsPaginadas> {
    const limit = LIMITES_VALIDOS.includes(Number(query.limit))
      ? Number(query.limit)
      : LIMITE_PADRAO;
    const page = query.page && query.page > 0 ? query.page : 1;

    const qb = this.songs
      .createQueryBuilder('song')
      .leftJoinAndSelect('song.tempos', 'tempo')
      .leftJoinAndSelect('song.momentos', 'momento')
      .leftJoinAndSelect('song.artistas', 'artista')
      .orderBy('song.titulo', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const titulo = normalizar((query.titulo ?? '').trim());
    if (titulo) {
      qb.andWhere('song.tituloBusca LIKE :titulo', { titulo: `%${titulo}%` });
    }

    const letra = buscaLetra((query.letra ?? '').trim());
    if (letra) {
      qb.andWhere('song.letraBusca LIKE :letra', { letra: `%${letra}%` });
    }

    // Filtros por relação via subquery — deixa o TypeORM resolver os nomes das
    // colunas das tabelas de junção (compatível com SQLite e Postgres).
    if (query.tempoId) {
      qb.andWhere((q) => {
        const sub = q
          .subQuery()
          .select('st.id')
          .from(Song, 'st')
          .innerJoin('st.tempos', 'stRel')
          .where('stRel.id = :tempoId')
          .getQuery();
        return 'song.id IN ' + sub;
      }).setParameter('tempoId', query.tempoId);
    }
    if (query.momentoId) {
      qb.andWhere((q) => {
        const sub = q
          .subQuery()
          .select('sm.id')
          .from(Song, 'sm')
          .innerJoin('sm.momentos', 'smRel')
          .where('smRel.id = :momentoId')
          .getQuery();
        return 'song.id IN ' + sub;
      }).setParameter('momentoId', query.momentoId);
    }
    if (query.artistaId) {
      qb.andWhere((q) => {
        const sub = q
          .subQuery()
          .select('sa.id')
          .from(Song, 'sa')
          .innerJoin('sa.artistas', 'saRel')
          .where('saRel.id = :artistaId')
          .getQuery();
        return 'song.id IN ' + sub;
      }).setParameter('artistaId', query.artistaId);
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  // Opções dos filtros: apenas tempos/momentos/artistas efetivamente usados
  // por alguma música (mesma semântica de antes, quando vinham das próprias
  // músicas carregadas). Acessível a qualquer usuário autenticado.
  async findFiltros() {
    // Momentos seguem a ordem litúrgica da celebração (id de cadastro), não
    // a ordem alfabética — por isso usam orderBy diferente dos demais.
    const distintos = (prop: 'tempos' | 'momentos' | 'artistas', orderBy: 'titulo' | 'id') =>
      this.songs
        .createQueryBuilder('song')
        .innerJoin(`song.${prop}`, 'rel')
        .select('rel.id', 'id')
        .addSelect('rel.titulo', 'titulo')
        .distinct(true)
        .orderBy(`rel.${orderBy}`, 'ASC')
        .getRawMany<{ id: number; titulo: string }>();

    const [temposArr, momentosArr, artistasArr] = await Promise.all([
      distintos('tempos', 'titulo'),
      distintos('momentos', 'id'),
      distintos('artistas', 'titulo'),
    ]);
    return { tempos: temposArr, momentos: momentosArr, artistas: artistasArr };
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
      bpm: dto.bpm ?? 80,
      descricao: dto.descricao,
      tituloBusca: buscaTitulo(dto.titulo),
      letraBusca: buscaLetra(dto.descricao),
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
    song.bpm = dto.bpm ?? 80;
    song.descricao = dto.descricao;
    song.tituloBusca = buscaTitulo(dto.titulo);
    song.letraBusca = buscaLetra(dto.descricao);
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
