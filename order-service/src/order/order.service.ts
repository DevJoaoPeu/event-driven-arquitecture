import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventPublisher } from 'src/shared/messaging/event-publisher';

@Injectable()
export class OrderService {
    constructor(
        private readonly eventPublisher: EventPublisher
    ) { }

    save(order: CreateOrderDto) {
        this.eventPublisher.publish('order.created', order)
        return order
    }
}
