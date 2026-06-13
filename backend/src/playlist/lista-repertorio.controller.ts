import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { SenhaDto } from './playlist.dto';

// Acesso externo público (sem token) — protegido apenas pela senha da playlist.
@Controller('lista-repertorio')
export class ListaRepertorioController {
  constructor(private readonly service: PlaylistService) {}

  @Post(':slug')
  @HttpCode(200)
  acessar(@Param('slug') slug: string, @Body() dto: SenhaDto) {
    return this.service.findPublic(slug, dto.senha);
  }
}
