import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { Perfil } from '../perfil/perfil.entity';
import { Plan } from '../plan/plan.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Perfil) private readonly perfis: Repository<Perfil>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já cadastrado');

    const totalUsers = await this.users.count();
    const tituloPerfil = totalUsers === 0 ? 'ADM' : 'PARTICIPANTE';
    const perfil = await this.perfis.findOne({ where: { titulo: tituloPerfil } });

    // Novos usuários recebem o plano FREE automaticamente
    const freePlan = await this.plans.findOne({ where: { is_free: true } });

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save(
      this.users.create({
        nome: dto.nome,
        email: dto.email,
        passwordHash,
        perfilId: perfil.id,
        planId: freePlan?.id ?? null,
      }),
    );

    return { id: user.id, nome: user.nome, email: user.email, perfilId: user.perfilId };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.users.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }
    return user;
  }

  signToken(user: User): string {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      perfilId: user.perfilId,
      perfil: user.perfil?.titulo,
    });
  }

  // Carrega o plano do usuário direto do banco para sempre refletir o estado atual.
  async getUserPlan(userId: number) {
    const user = await this.users.findOne({ where: { id: userId }, relations: ['plan'] });
    const p = user?.plan;
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      max_playlists: p.max_playlists,
      is_free: p.is_free,
      price_monthly: Number(p.price_monthly),
      price_yearly: Number(p.price_yearly),
    };
  }
}
