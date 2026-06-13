import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SongTomService } from './song-tom.service';
import { SongTomDto } from './song-tom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('songTom')
@UseGuards(JwtAuthGuard)
export class SongTomController {
  constructor(private readonly service: SongTomService) {}

  @Get()
  find(
    @CurrentUser('sub') userId: number,
    @Query('songId') songId?: string,
  ) {
    return this.service.findForUser(userId, songId ? +songId : undefined);
  }

  @Post()
  save(@CurrentUser('sub') userId: number, @Body() dto: SongTomDto) {
    return this.service.save(userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: number, @Param('id') id: string) {
    return this.service.remove(userId, +id);
  }
}
