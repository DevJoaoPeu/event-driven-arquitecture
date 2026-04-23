import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, RmqContext } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentService } from './payment.service';
import { Channel, Message } from 'amqplib';

@Controller()
export class PaymentConsumer {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.created')
  async payment(order: CreateOrderDto, @Ctx context: RmqContext) {
    const channel = context.getChannelRef() as Channel;
    const originalMessage = context.getMessage() as Message;

    try {
      await this.paymentService.process(order);
      channel.ack(originalMessage);
    } catch (error) {
      console.log(error);

      channel.nack(originalMessage);
    }
  }
}
