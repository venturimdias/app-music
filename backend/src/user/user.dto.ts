import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  nome: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;

  @IsInt()
  perfilId: number;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password?: string;

  @IsOptional()
  @IsInt()
  perfilId?: number;
}
