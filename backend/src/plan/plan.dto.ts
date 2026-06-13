import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price_monthly: number;

  @IsNumber()
  @Min(0)
  price_yearly: number;

  @IsNumber()
  @Min(1)
  max_playlists: number;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsOptional()
  @IsBoolean()
  is_free?: boolean;

  @IsOptional()
  @IsString()
  pagarme_plan_id_monthly?: string;

  @IsOptional()
  @IsString()
  pagarme_plan_id_yearly?: string;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_monthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price_yearly?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_playlists?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  pagarme_plan_id_monthly?: string;

  @IsOptional()
  @IsString()
  pagarme_plan_id_yearly?: string;
}
