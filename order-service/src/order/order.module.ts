import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: "RABBITMQ_SERVICE",
                transport: Transport.RMQ,
                options: {
                    urls: ["amqp://admin:admin@localhost:5672"],
                    queue: "order_queue",
                    queueOptions: {
                        durable: true
                    }
                }
            }]
        )
    ],
    controllers: [OrderController],
    providers: [OrderService]
})
export class OrderModule { }