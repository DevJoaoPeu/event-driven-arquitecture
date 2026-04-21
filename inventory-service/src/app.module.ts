import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryConsumer } from './inventory/inventory.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [InventoryConsumer],
})
export class AppModule {}
