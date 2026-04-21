import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentConsumer } from './payments/payment.consumer';
import { PaymentService } from './payments/payment.service';
import { PaymentGateway } from './gateways/payment/payment.gateway';
import { KiwifyGateway } from './gateways/payment/kiwify.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [PaymentConsumer],
  providers: [
    PaymentService,
    { provide: PaymentGateway, useClass: KiwifyGateway },
  ],
})
export class AppModule {}
