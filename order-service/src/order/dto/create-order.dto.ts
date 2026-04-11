import { PaymentMethodEnum } from '../enuns/payment-method.enum';

class ItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}

class PaymentDto {
    method: PaymentMethodEnum;
    installment: number;
}

class DeliveryDto {
    addressId: string;
}

export class CreateOrderDto {
    customerId: string;

    itens: ItemDto[];
    
    payment: PaymentDto

    delivery: DeliveryDto;
}