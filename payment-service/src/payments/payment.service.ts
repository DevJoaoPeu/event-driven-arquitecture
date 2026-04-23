import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentGateway } from 'src/gateways/payment/payment.gateway';
import { RetryDecorator } from 'src/decorators/retry.decorator';

@Injectable()
export class PaymentService {
  constructor(private readonly gateway: PaymentGateway) {}

  @RetryDecorator()
  async process(order: CreateOrderDto) {
    return await this.gateway.paymentProcess(order);
  }
}
