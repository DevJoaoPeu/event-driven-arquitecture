import { Module } from '@nestjs/common';
import { PaymentModule } from './payments/payment.module';

@Module({
  imports: [PaymentModule],
})
export class AppModule {}
