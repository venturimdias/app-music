import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class AssinarDto {
  @IsNumber()
  planId: number;

  @IsEnum(['monthly', 'yearly'])
  billing_cycle: 'monthly' | 'yearly';

  @IsEnum(['credit_card', 'pix'])
  payment_method: 'credit_card' | 'pix';

  @IsOptional()
  @IsString()
  cpfCnpj?: string;
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
