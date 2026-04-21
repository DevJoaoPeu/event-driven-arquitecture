import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { InventoryService } from './inventory.service';

@Controller()
export class InventoryConsumer {
  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern('order.created')
  inventory(order: CreateOrderDto) {
    this.inventoryService.reserve(order);
  }
}
