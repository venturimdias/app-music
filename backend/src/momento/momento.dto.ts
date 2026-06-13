import { IsOptional, IsString } from 'class-validator';

export class MomentoDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
