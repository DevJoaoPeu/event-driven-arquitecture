import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';

@Injectable()
export class KiwifyGateway {
  paymentProcess(data: CreateOrderDto) {
    console.log(data);
  }
}
