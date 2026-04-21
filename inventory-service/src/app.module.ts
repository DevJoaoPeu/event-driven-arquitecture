import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryConsumer } from './inventory/inventory.consumer';
import { InventoryService } from './inventory/inventory.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [InventoryConsumer],
  providers: [InventoryService],
})
export class AppModule {}
