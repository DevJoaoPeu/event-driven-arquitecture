import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { PaymentMethodEnum } from '../enuns/payment-method.enum';
import { Type } from 'class-transformer';

class ItemDto {
    @IsNotEmpty()
    @IsString()
    productId: string;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    unitPrice: number;
}

class PaymentDto {
    @IsNotEmpty()
    @IsEnum(PaymentMethodEnum)
    method: PaymentMethodEnum;

    @IsNotEmpty()
    @IsNumber()
    installment: number;
}

class DeliveryDto {
    @IsNotEmpty()
    @IsString()
    addressId: string;
}

export class CreateOrderDto {
    @IsNotEmpty()
    @IsString()
    customerId: string;

    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ItemDto)
    itens: ItemDto[];

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => PaymentDto)
    payment: PaymentDto

    @IsNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => DeliveryDto)
    delivery: DeliveryDto;
}