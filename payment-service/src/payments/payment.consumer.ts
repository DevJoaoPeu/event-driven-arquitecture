import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentConsumer {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.created')
  payment(order: CreateOrderDto) {
    this.paymentService.process(order);
  }
}
