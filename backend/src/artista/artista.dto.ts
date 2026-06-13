import { IsOptional, IsString } from 'class-validator';

export class ArtistaDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
