import { IsOptional, IsString } from 'class-validator';

export class TempoDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
