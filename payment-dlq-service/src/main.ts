import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const rabbitUrl: string = configService.getOrThrow<string>('RABBITMQ_URL');
  const queue: string = configService.getOrThrow<string>(
    'RABBITMQ_ORDER_QUEUE',
  );

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue,
      queueOptions: {
        durable: true,
        exclusive: false,
        autoDelete: false,
      },
      noAck: false,
    },
  });
  await app.listen();
}
bootstrap();
