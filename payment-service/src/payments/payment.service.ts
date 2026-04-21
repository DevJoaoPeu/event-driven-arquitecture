import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentGateway } from 'src/gateways/payment/payment.gateway';

@Injectable()
export class PaymentService {
  constructor(private readonly gateway: PaymentGateway) {}

  process(order: CreateOrderDto) {
    this.gateway.paymentProcess(order);
  }
}
