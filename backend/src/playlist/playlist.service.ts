import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Playlist } from './playlist.entity';
import { PlaylistSong } from './playlist-song.entity';
import { SongTom } from '../song/song-tom.entity';
import { User } from '../user/user.entity';
import { Perfil } from '../perfil/perfil.entity';
import {
  AddSongDto,
  CreatePlaylistDto,
  UpdatePlaylistDto,
} from './playlist.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist) private readonly playlists: Repository<Playlist>,
    @InjectRepository(PlaylistSong) private readonly playlistSongs: Repository<PlaylistSong>,
    @InjectRepository(SongTom) private readonly songToms: Repository<SongTom>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Perfil) private readonly perfis: Repository<Perfil>,
  ) {}

  private gerarSenha(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async create(currentUser: AuthUser, dto: CreatePlaylistDto) {
    // ADM é isento de limites
    if (currentUser.perfil !== 'ADM') {
      const user = await this.users.findOne({
        where: { id: currentUser.sub },
        relations: ['plan'],
      });
      const plan = user?.plan;
      if (plan) {
        const count = await this.playlists.count({
          where: { userId: currentUser.sub, bloqueada: false },
        });
        if (count >= plan.max_playlists) {
          throw new ForbiddenException({
            message: `Você atingiu o limite de ${plan.max_playlists} playlist(s) do plano ${plan.name}.`,
            code: 'LIMITE_PLAYLISTS',
            limit: plan.max_playlists,
          });
        }
      }
    }

    const playlist = this.playlists.create({
      nome: dto.nome,
      data: new Date(dto.data),
      descricao: dto.descricao,
      userId: currentUser.sub,
      senha: this.gerarSenha(),
      slug: `${currentUser.sub}-${randomUUID()}`,
    });
    return this.playlists.save(playlist);
  }

  findAllByUser(userId: number) {
    return this.playlists.find({
      where: { userId },
      order: { data: 'DESC' },
    });
  }

  private async assertOwner(id: number, userId: number) {
    const playlist = await this.playlists.findOne({ where: { id } });
    if (!playlist) throw new NotFoundException('Playlist não encontrada');
    if (playlist.userId !== userId) {
      throw new ForbiddenException('Apenas o dono pode editar esta playlist');
    }
    return playlist;
  }

  private async montar(playlist: Playlist) {
    const itens = await this.playlistSongs.find({
      where: { playlistId: playlist.id },
      order: { ordem: 'ASC' },
    });
    const songIds = itens.map((i) => i.songId);
    const toms = songIds.length
      ? await this.songToms.find({
          where: { userId: playlist.userId, songId: In(songIds) },
        })
      : [];
    const tomMap = new Map(toms.map((t) => [t.songId, t.tom]));

    const musicas = itens.map((i) => ({
      id: i.id,
      ordem: i.ordem,
      song: i.song,
      tom: tomMap.get(i.songId) ?? i.song?.tom,
    }));
    return { ...playlist, musicas };
  }

  async findOne(id: number, userId: number) {
    const playlist = await this.assertOwner(id, userId);
    return this.montar(playlist);
  }

  async findPublic(slug: string, senha: string) {
    const playlist = await this.playlists.findOne({ where: { slug } });
    if (!playlist) throw new NotFoundException('Playlist não encontrada');
    if (playlist.senha !== senha) throw new UnauthorizedException('Senha inválida');
    const { senha: _senha, userId: _userId, ...publica } = await this.montar(playlist);
    return publica;
  }

  async update(id: number, userId: number, dto: UpdatePlaylistDto) {
    const playlist = await this.assertOwner(id, userId);
    if (dto.nome !== undefined) playlist.nome = dto.nome;
    if (dto.data !== undefined) playlist.data = new Date(dto.data);
    if (dto.descricao !== undefined) playlist.descricao = dto.descricao;
    return this.playlists.save(playlist);
  }

  async remove(id: number, userId: number) {
    await this.assertOwner(id, userId);
    await this.playlists.delete(id);
    return { deleted: true };
  }

  async addSong(id: number, currentUser: AuthUser, dto: AddSongDto) {
    await this.assertOwner(id, currentUser.sub);

    // Limite de músicas por playlist conforme o perfil (ex.: DEMO = 4).
    // null = sem limite (ADM/PARTICIPANTE por padrão).
    const perfil = await this.perfis.findOne({ where: { id: currentUser.perfilId } });
    const limite = perfil?.max_songs_per_playlist ?? null;
    if (limite != null) {
      const count = await this.playlistSongs.count({ where: { playlistId: id } });
      if (count >= limite) {
        throw new ForbiddenException({
          message: `Seu perfil (${perfil.titulo}) permite no máximo ${limite} música(s) por playlist.`,
          code: 'LIMITE_MUSICAS_PERFIL',
          limit: limite,
        });
      }
    }

    const existe = await this.playlistSongs.findOne({
      where: { playlistId: id, songId: dto.songId },
    });
    if (existe) throw new ConflictException('Música já está nesta playlist');
    return this.playlistSongs.save(
      this.playlistSongs.create({ playlistId: id, songId: dto.songId, ordem: dto.ordem }),
    );
  }

  async removeSong(id: number, userId: number, songId: number) {
    await this.assertOwner(id, userId);
    await this.playlistSongs.delete({ playlistId: id, songId });
    return { deleted: true };
  }
}
