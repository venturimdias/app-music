import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil } from './perfil/perfil.entity';
import { Plan } from './plan/plan.entity';
import { User } from './user/user.entity';
import { SeedService } from './database/seed.service';
import { AuthModule } from './auth/auth.module';
import { PerfilModule } from './perfil/perfil.module';
import { UserModule } from './user/user.module';
import { TempoModule } from './tempo/tempo.module';
import { MomentoModule } from './momento/momento.module';
import { ArtistaModule } from './artista/artista.module';
import { SongModule } from './song/song.module';
import { SongTomModule } from './song-tom/song-tom.module';
import { PlaylistModule } from './playlist/playlist.module';
import { PlanModule } from './plan/plan.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
        if (dbUrl) {
          return {
            type: 'postgres',
            url: dbUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        }
        return {
          type: 'sqlite',
          database: 'database.sqlite',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([Perfil, Plan, User]), // usado pelo SeedService
    AuthModule,
    PerfilModule,
    UserModule,
    TempoModule,
    MomentoModule,
    ArtistaModule,
    SongModule,
    SongTomModule,
    PlaylistModule,
    PlanModule,
    BillingModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
