import { IsString } from 'class-validator';

export class PerfilDto {
  @IsString()
  titulo: string;
}
