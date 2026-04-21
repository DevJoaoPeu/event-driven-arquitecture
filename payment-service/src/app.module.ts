import { Module } from '@nestjs/common';
import { PaymentModule } from './payments/payment.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PaymentModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
