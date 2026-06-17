import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { SenhaDto } from './playlist.dto';
import { LiturgiaService } from '../liturgia/liturgia.service';

// Acesso externo público (sem token) — protegido apenas pela senha da playlist.
@Controller('lista-repertorio')
export class ListaRepertorioController {
  constructor(
    private readonly service: PlaylistService,
    private readonly liturgia: LiturgiaService,
  ) {}

  @Post(':slug')
  @HttpCode(200)
  acessar(@Param('slug') slug: string, @Body() dto: SenhaDto) {
    return this.service.findPublic(slug, dto.senha);
  }

  // Liturgia do dia da playlist (mesma senha valida o acesso).
  @Post(':slug/liturgia')
  @HttpCode(200)
  async liturgiaDoDia(@Param('slug') slug: string, @Body() dto: SenhaDto) {
    const playlist = await this.service.validarSenha(slug, dto.senha);
    return this.liturgia.obterPorData(playlist.data);
  }
}
