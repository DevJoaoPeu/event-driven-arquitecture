import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQProvider } from 'src/providers/RabbitMQProvider';

@Module({
    imports: [ConfigModule],
    controllers: [OrderController],
    providers: [OrderService, RabbitMQProvider]
})
export class OrderModule { }