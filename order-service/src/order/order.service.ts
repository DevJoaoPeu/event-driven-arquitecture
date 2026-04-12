import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
    constructor(
        @Inject('RABBITMQ_SERVICE')
        private readonly client: ClientProxy
    ) { }

    save(order: CreateOrderDto) {
        return this.client.emit("order.created", order)
    }
}