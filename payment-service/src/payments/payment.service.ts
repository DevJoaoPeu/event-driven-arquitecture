import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from 'src/shared/dtos/create-order.dto.';
import { PaymentGateway } from 'src/gateways/payment/payment.gateway';

const MAX_ATTEMPT = 3;
const DELAY = 5000;

@Injectable()
export class PaymentService {
  constructor(private readonly gateway: PaymentGateway) {}

  async process(order: CreateOrderDto) {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= MAX_ATTEMPT; attempt++) {
      try {
        return this.gateway.paymentProcess(order);
      } catch (error) {
        lastError = error as Error;

        console.log(`Attempt: ${attempt}, Retrying in ${DELAY / 1000} seconds`);

        await new Promise((resolve) => setTimeout(resolve, DELAY));
      }
    }

    throw lastError;
  }
}
