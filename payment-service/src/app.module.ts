import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentConsumer } from './payments/payment.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [PaymentConsumer],
})
export class AppModule {}
