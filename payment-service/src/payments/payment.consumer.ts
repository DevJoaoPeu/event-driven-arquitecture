import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentConsumer {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.created')
  async payment(order: CreateOrderDto) {
    await this.paymentService.process(order);
  }
}
