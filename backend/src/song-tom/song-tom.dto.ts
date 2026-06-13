import { IsInt, IsString } from 'class-validator';

export class SongTomDto {
  @IsInt()
  songId: number;

  @IsString()
  tom: string;
}
