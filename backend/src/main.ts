import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.enableCors({
    // Sem FRONTEND_URL (dev), reflete a origem da requisição — permite o
    // acesso pela rede local (http://IP-do-PC:5173 em celular/tablet).
    // Em produção, defina FRONTEND_URL para restringir.
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true, // necessário para o cookie httpOnly
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend rodando em http://localhost:${port}`);
}
bootstrap();
