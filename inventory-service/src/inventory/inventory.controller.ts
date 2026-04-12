import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class InventoryController {

  @EventPattern('order.created')
  inventory(order: any) {
    console.log(order)
  }
}
