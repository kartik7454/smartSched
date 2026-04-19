import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

function corsOrigins(): string[] | boolean {
  const raw = process.env.FRONTEND_ORIGINS?.trim();
  if (raw === '*') return true;
  const fromEnv = raw
    ? raw.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const defaults = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];
  return [...new Set([...defaults, ...fromEnv])];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
void bootstrap();
