import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQProvider } from 'src/providers/RabbitMQProvider';
import { EventPublisher } from 'src/shared/messaging/event-publisher';

@Module({
    imports: [ConfigModule],
    controllers: [OrderController],
    providers: [
        OrderService,
        { provide: EventPublisher, useClass: RabbitMQProvider },
    ],
})
export class OrderModule { }
