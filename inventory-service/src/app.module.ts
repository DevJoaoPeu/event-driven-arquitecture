import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    InventoryModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
