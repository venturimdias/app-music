import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssinarDto {
  @IsNumber()
  planId: number;

  @IsEnum(['monthly', 'yearly'])
  billing_cycle: 'monthly' | 'yearly';
}

export class CancelarDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class ConcederAcessoDto {
  @IsNumber()
  planId: number;
}
