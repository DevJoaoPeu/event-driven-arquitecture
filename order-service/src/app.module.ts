import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [OrderModule, ConfigModule.forRoot({
    isGlobal: true,
  })],
})
export class AppModule {}
