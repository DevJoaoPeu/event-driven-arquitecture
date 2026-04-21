import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryConsumer } from './inventory/inventory.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [InventoryConsumer],
})
export class AppModule {}
