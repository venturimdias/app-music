import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const allowedOrigin = process.env.FRONTEND_URL;
  app.enableCors({
    origin: allowedOrigin
      ? (origin, cb) => cb(null, !origin || origin === allowedOrigin)
      : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend rodando em http://localhost:${port}`);
}
bootstrap();
