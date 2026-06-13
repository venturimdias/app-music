import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  // Remove o hash da senha antes de devolver ao cliente.
  private strip(user: User) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async findAll() {
    const users = await this.repo.find();
    return users.map((u) => this.strip(u));
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.strip(user);
  }

  async create(dto: CreateUserDto) {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.repo.save(
      this.repo.create({
        nome: dto.nome,
        email: dto.email,
        passwordHash,
        perfilId: dto.perfilId,
      }),
    );
    return this.findOne(user.id);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (dto.email && dto.email !== user.email) {
      const exists = await this.repo.findOne({
        where: { email: dto.email, id: Not(id) },
      });
      if (exists) throw new ConflictException('Email já cadastrado');
      user.email = dto.email;
    }
    if (dto.nome !== undefined) user.nome = dto.nome;
    if (dto.perfilId !== undefined) user.perfilId = dto.perfilId;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);

    await this.repo.save(user);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    await this.repo.delete(id);
    return { deleted: true };
  }
}
