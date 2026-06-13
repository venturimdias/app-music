import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  nome: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter ao menos 1 letra maiúscula' })
  @Matches(/[a-z]/, { message: 'A senha deve conter ao menos 1 letra minúscula' })
  @Matches(/(\D*\d){2}/, { message: 'A senha deve conter ao menos 2 números' })
  @Matches(/[^A-Za-z0-9]/, { message: 'A senha deve conter ao menos 1 caractere especial' })
  password: string;
}
