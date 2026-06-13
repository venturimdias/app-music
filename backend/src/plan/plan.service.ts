import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { User } from '../user/user.entity';
import { Playlist } from '../playlist/playlist.entity';
import { CreatePlanDto, UpdatePlanDto } from './plan.dto';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Playlist) private readonly playlistRepo: Repository<Playlist>,
  ) {}

  findAll() {
    return this.planRepo.find({ order: { price_monthly: 'ASC' } });
  }

  async findOne(id: number) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  findFree() {
    return this.planRepo.findOne({ where: { is_free: true } });
  }

  async create(dto: CreatePlanDto) {
    const plan = this.planRepo.create({
      ...dto,
      is_active: true,
      is_free: dto.is_free ?? false,
    });
    return this.planRepo.save(plan);
  }

  async update(id: number, dto: UpdatePlanDto) {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async toggle(id: number) {
    const plan = await this.findOne(id);
    plan.is_active = !plan.is_active;
    await this.planRepo.save(plan);
    return { id: plan.id, is_active: plan.is_active };
  }

  // Endpoint único: PARTICIPANTE → FREE; playlists excedentes → bloqueada = true.
  // Mantém a playlist mais recente (createdAt DESC); as demais são bloqueadas.
  async migrarPlanos() {
    const freePlan = await this.findFree();
    if (!freePlan) throw new Error('Plano FREE não encontrado. Execute o seed primeiro.');

    const participantes = await this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.perfil', 'p')
      .where('p.titulo = :titulo', { titulo: 'PARTICIPANTE' })
      .getMany();

    let usuariosAtualizados = 0;
    let playlistsBloqueadas = 0;

    for (const user of participantes) {
      user.planId = freePlan.id;
      await this.userRepo.save(user);
      usuariosAtualizados++;

      const playlists = await this.playlistRepo.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });

      for (let i = 1; i < playlists.length; i++) {
        if (!playlists[i].bloqueada) {
          playlists[i].bloqueada = true;
          await this.playlistRepo.save(playlists[i]);
          playlistsBloqueadas++;
        }
      }
    }

    return { usuariosAtualizados, playlistsBloqueadas };
  }
}
