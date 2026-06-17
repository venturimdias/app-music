import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Liturgia } from './liturgia.entity';
import { LiturgiaNormalizada, LiturgiaRailwayProvider } from './liturgia.provider';

const pad = (n: number) => String(n).padStart(2, '0');

@Injectable()
export class LiturgiaService {
  constructor(
    @InjectRepository(Liturgia) private readonly repo: Repository<Liturgia>,
    private readonly provider: LiturgiaRailwayProvider,
  ) {}

  // Usa getters UTC: as datas de playlist são gravadas como meia-noite UTC
  // (o front também formata em UTC), então evitamos deslocamento de fuso.
  async obterPorData(data: Date): Promise<LiturgiaNormalizada> {
    const d = new Date(data);
    const ano = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const iso = `${ano}-${pad(mes)}-${pad(dia)}`;

    const cached = await this.repo.findOne({ where: { data: iso } });
    if (cached) return cached.payload;

    try {
      const normalizada = await this.provider.buscar(dia, mes, ano);
      await this.repo.save(
        this.repo.create({ data: iso, payload: normalizada, fonte: normalizada.fonte }),
      );
      return normalizada;
    } catch {
      throw new ServiceUnavailableException(
        'Liturgia indisponível no momento. Tente novamente mais tarde.',
      );
    }
  }
}
