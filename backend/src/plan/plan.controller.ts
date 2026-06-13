import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto } from './plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class PlanController {
  constructor(private readonly service: PlanService) {}

  // Público: frontend usa para exibir os cards de pricing
  @Get('plans')
  findAll() {
    return this.service.findAll();
  }

  @Get('plans/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  // ADM: CRUD de planos
  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @Patch('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.service.update(+id, dto);
  }

  @Patch('plans/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  toggle(@Param('id') id: string) {
    return this.service.toggle(+id);
  }

  // ADM: executa a migração única de planos e bloqueio de playlists excedentes
  @Post('admin/migrar-planos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADM')
  migrarPlanos() {
    return this.service.migrarPlanos();
  }
}
