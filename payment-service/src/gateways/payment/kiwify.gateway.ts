import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentGateway } from './payment.gateway';

@Injectable()
export class KiwifyGateway extends PaymentGateway {
  paymentProcess(order: CreateOrderDto) {
    throw new Error('Error process payment')
    console.log(order);
  }
}
