import { Module } from '@nestjs/common';
import { HealingController } from './healing.controller';
import { HealingService } from './healing.service';

@Module({
  controllers: [HealingController],
  providers: [HealingService],
  exports: [HealingService],
})
export class HealingModule {}