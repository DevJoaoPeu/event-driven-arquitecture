import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';

@Controller()
export class AppController {
  @EventPattern('order.created')
  paymentFailed(order: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef() as Channel;
    const originalMessage = context.getMessage() as Message;

    try {
      console.log(order);
      channel.ack(originalMessage);
    } catch (error) {
      console.log(error);

      channel.nack(originalMessage, false, false);
    }
  }
}
