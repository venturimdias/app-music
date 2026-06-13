import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Perfil } from '../perfil/perfil.entity';
import { Plan } from '../plan/plan.entity';
import { User } from '../user/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Perfil) private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPerfis();
    await this.seedPlanos();
    await this.atribuirPlanoParaNovos();
  }

  private async seedPerfis() {
    const total = await this.perfilRepo.count();
    if (total === 0) {
      await this.perfilRepo.save([{ titulo: 'ADM' }, { titulo: 'PARTICIPANTE' }]);
      console.log('[seed] Perfis criados: ADM, PARTICIPANTE');
    }
  }

  private async seedPlanos() {
    const total = await this.planRepo.count();
    if (total === 0) {
      await this.planRepo.save([
        {
          name: 'FREE',
          description: 'Plano gratuito com acesso básico',
          price_monthly: 0,
          price_yearly: 0,
          max_playlists: 1,
          features: ['1 playlist', 'Acesso completo às músicas'],
          is_free: true,
          is_active: true,
        },
        {
          name: 'INDIVIDUAL',
          description: 'Plano individual com mais playlists',
          price_monthly: 9.90,
          price_yearly: 89.90,
          max_playlists: 4,
          features: ['4 playlists', 'Acesso completo às músicas', 'Economize 24% no anual'],
          is_free: false,
          is_active: true,
        },
      ]);
      console.log('[seed] Planos criados: FREE, INDIVIDUAL');
    }
  }

  // Garante que usuários existentes sem planId recebam o plano FREE.
  private async atribuirPlanoParaNovos() {
    const freePlan = await this.planRepo.findOne({ where: { is_free: true } });
    if (!freePlan) return;

    const semPlano = await this.userRepo.find({ where: { planId: IsNull() } });
    if (semPlano.length === 0) return;

    await this.userRepo.save(semPlano.map((u) => ({ ...u, planId: freePlan.id })));
    console.log(`[seed] planId FREE atribuído a ${semPlano.length} usuário(s) existente(s)`);
  }
}
