import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import {
  AddSongDto,
  CreatePlaylistDto,
  ReordenarDto,
  UpdatePlaylistDto,
} from './playlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(private readonly service: PlaylistService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: number) {
    return this.service.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('sub') userId: number, @Param('id') id: string) {
    return this.service.findOne(+id, userId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePlaylistDto) {
    return this.service.create(user, dto);
  }

  @Put(':id')
  update(
    @CurrentUser('sub') userId: number,
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.service.update(+id, userId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('sub') userId: number, @Param('id') id: string) {
    return this.service.remove(+id, userId);
  }

  @Put(':id/reordenar')
  reordenar(
    @CurrentUser('sub') userId: number,
    @Param('id') id: string,
    @Body() dto: ReordenarDto,
  ) {
    return this.service.reordenar(+id, userId, dto);
  }

  @Post(':id/songs')
  addSong(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddSongDto,
  ) {
    return this.service.addSong(+id, user, dto);
  }

  @Delete(':id/songs/:songId')
  removeSong(
    @CurrentUser('sub') userId: number,
    @Param('id') id: string,
    @Param('songId') songId: string,
  ) {
    return this.service.removeSong(+id, userId, +songId);
  }
}
