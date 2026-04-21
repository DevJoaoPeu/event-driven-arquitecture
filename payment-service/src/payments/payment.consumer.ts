import { Injectable } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';

@Injectable()
export class PaymentConsumer {
  @EventPattern('order.created')
  payment(order: CreateOrderDto) {
    console.log(order);
  }
}
