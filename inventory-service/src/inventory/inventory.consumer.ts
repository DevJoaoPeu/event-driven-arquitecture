import { Injectable } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';

@Injectable()
export class InventoryConsumer {
  @EventPattern('order.created')
  inventory(order: CreateOrderDto) {
    console.log(order);
  }
}
