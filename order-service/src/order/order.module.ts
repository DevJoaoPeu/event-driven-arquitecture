import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: "RABBITMQ_SERVICE",
                imports: [ConfigModule],
                useFactory: ((configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
                        queue: 'orders_queue',
                        queueOptions: {
                            durable: true
                        }
                    }
                })),
                inject: [ConfigService]
            }]
        )
    ],
    controllers: [OrderController],
    providers: [OrderService]
})
export class OrderModule { }