import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PerfilDto {
  @IsString()
  titulo: string;

  // Limite de músicas por playlist. Ausente/null = sem limite.
  @IsOptional()
  @IsInt()
  @Min(1)
  max_songs_per_playlist?: number | null;
}
