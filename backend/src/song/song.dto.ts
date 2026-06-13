import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSongDto {
  @IsString()
  titulo: string;

  @IsString()
  tom: string;

  @IsOptional()
  @IsString()
  cifra?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  slide?: string;

  @IsString()
  descricao: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tempoIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  momentoIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(3, { message: 'No máximo 3 artistas por música' })
  artistaIds?: number[];
}

export class UpdateSongDto extends CreateSongDto {}
