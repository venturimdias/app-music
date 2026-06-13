import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  nome: string;

  @IsDateString()
  data: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsDateString()
  data?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

export class AddSongDto {
  @IsInt()
  songId: number;

  @IsInt()
  ordem: number;
}

export class SenhaDto {
  @IsString()
  senha: string;
}
