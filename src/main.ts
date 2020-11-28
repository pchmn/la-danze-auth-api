import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice({
    transport: configService.get('microServiceTransport'),
    options: {
      host: 'localhost',
      port: configService.get('port')
    }
  })

  app.use(cookieParser(configService.get('cookie.secret')));
  await app.startAllMicroservicesAsync();
  await app.listen(configService.get('microservicePort'));

  Logger.log(`🚀 Auth API is running`, 'Bootstrap');
}
bootstrap();
