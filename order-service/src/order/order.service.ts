import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { RabbitMQProvider } from 'src/providers/RabbitMQProvider';

@Injectable()
export class OrderService {
    constructor(
        private readonly rabbitMqProvider: RabbitMQProvider
    ) { }

    save(order: CreateOrderDto) {
        this.rabbitMqProvider.publish('orders.exchange', 'order.created', order)
        return order
    }
}