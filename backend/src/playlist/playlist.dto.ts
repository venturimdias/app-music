import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  nome: string;

  @IsDateString()
  data: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  salmo?: string;

  @IsOptional()
  @IsString()
  antifonaEvangelho?: string;
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

  @IsOptional()
  @IsString()
  salmo?: string;

  @IsOptional()
  @IsString()
  antifonaEvangelho?: string;
}

// Um item da lista do repertório para reordenação: música (com songId) ou
// um dos itens litúrgicos (salmo / antífona do Evangelho).
export class ItemOrdemDto {
  @IsIn(['musica', 'salmo', 'antifona'])
  tipo: 'musica' | 'salmo' | 'antifona';

  @IsOptional()
  @IsInt()
  songId?: number;
}

export class ReordenarDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemDto)
  itens: ItemOrdemDto[];
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
