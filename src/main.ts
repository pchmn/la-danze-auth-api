import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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

  await app.startAllMicroservicesAsync();
  await app.listen(configService.get('microservicePort'));
  Logger.log(`🚀 Auth API is running`, 'Bootstrap');
}
bootstrap();
