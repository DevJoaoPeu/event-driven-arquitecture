import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';

export abstract class PaymentGateway {
  abstract paymentProcess(order: CreateOrderDto): Promise<void>;
}
