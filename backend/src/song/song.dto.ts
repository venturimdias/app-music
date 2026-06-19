import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
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

// Parâmetros de listagem paginada/filtrada (query string).
export class QuerySongsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  // busca por título
  @IsOptional()
  @IsString()
  titulo?: string;

  // busca por trecho na letra
  @IsOptional()
  @IsString()
  letra?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tempoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  momentoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artistaId?: number;
}
