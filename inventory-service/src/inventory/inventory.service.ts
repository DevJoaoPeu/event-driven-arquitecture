import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';

@Injectable()
export class InventoryService {
  reserve(order: CreateOrderDto) {
    console.log(order);
  }
}
