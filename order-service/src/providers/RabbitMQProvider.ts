import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { EventPublisher } from 'src/shared/messaging/event-publisher';

@Injectable()
export class RabbitMQProvider extends EventPublisher implements OnModuleInit {
  private connection: amqp.ChannelModel;
  private channel: amqp.Channel;
  private readonly exchange = 'orders.exchange';

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    const connectionUrl = this.configService.getOrThrow<string>('RABBITMQ_URL');
    this.connection = await amqp.connect(connectionUrl);

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });

    console.log('### RabbitMQ connection established');
  }

  publish(routingKey: string, data: unknown) {
    const message = {
      pattern: routingKey,
      data,
    };

    this.channel.publish(
      this.exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
    );
  }
}
