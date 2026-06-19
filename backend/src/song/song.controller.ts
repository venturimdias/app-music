import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SongService } from './song.service';
import { CreateSongDto, QuerySongsDto, UpdateSongDto } from './song.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Listar/detalhar: qualquer usuário autenticado. Criar/editar/excluir: só ADM.
@Controller('songs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SongController {
  constructor(private readonly service: SongService) {}

  @Get()
  findAll(@Query() query: QuerySongsDto) {
    return this.service.findAll(query);
  }

  // Opções para os filtros (tempos/momentos/artistas em uso). Precede a rota
  // ':id' para não ser capturada por ela.
  @Get('filtros')
  findFiltros() {
    return this.service.findFiltros();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @Roles('ADM')
  create(@Body() dto: CreateSongDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles('ADM')
  update(@Param('id') id: string, @Body() dto: UpdateSongDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @Roles('ADM')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
