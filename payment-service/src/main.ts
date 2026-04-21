import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);

  const rabbitUrl: string = configService.getOrThrow<string>('RABBITMQ_URL');
  const routingKey: string = configService.getOrThrow<string>(
    'RABBITMQ_ORDER_ROUTING_KEY',
  );

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'payment.order.created',
      exchange: 'orders.exchange',
      exchangeType: 'topic',
      routingKey,
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });
  await app.listen();
}
bootstrap();
